import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type FlowNode = {
  id: string;
  type: string;
  config: Record<string, any>;
};

type FlowEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string | null;
};

type TestStep = {
  node_id: string;
  node_type: string;
  rendered_content: string;
  action_taken?: string;
  buttons?: { id: string; text: string }[];
  list_rows?: { id: string; title: string; section_title: string }[];
  media_url?: string;
  media_type?: string;
  audio_url?: string;
};

function getDryRunAction(node: FlowNode): string | null {
  const c = node.config || {};
  switch (node.type) {
    case 'save_attribute':
      return `Would save attribute: ${c.attribute_id || '?'} = ${c.value || '?'}`;
    case 'add_tag':
      return `Would add tag: ${c.tag_id || '?'}`;
    case 'google_sheet':
      return `Would write to Google Sheet: ${c.spreadsheet_id || '?'} / ${c.sheet_name || '?'}`;
    case 'webhook':
      return `Would call webhook: ${c.method || 'POST'} ${c.url || '?'}`;
    case 'meta_conversion_api':
      return `Would fire Meta Conversion event: ${c.event_type || '?'} (value: ${c.event_value || '0'})`;
    case 'payment':
      return `Would request payment: ${c.currency || '?'} ${c.amount || '0'} — ${c.description || ''}`;
    case 'time_delay':
      if (c.mode === 'specific_time') {
        return `Would delay until ${c.specific_datetime || '?'}`;
      }
      return `Would delay for ${c.days || 0}d ${c.hours || 0}h ${c.minutes || 0}m`;
    default:
      return null;
  }
}

function getRenderedContent(node: FlowNode): string {
  const c = node.config || {};
  switch (node.type) {
    case 'text_button':
      return c.message || '[No message configured]';
    case 'media':
      return c.caption || '';
    case 'audio':
      return '';
    case 'list':
      return c.message_body || '[No message body configured]';
    case 'template':
      return `[Template: ${c.template_name || '?'}]`;
    case 'ask_question':
      return c.question || '[No question configured]';
    case 'whatsapp_form':
      return c.message_body || '[WhatsApp Form message]';
    default:
      return '';
  }
}

// Action node types that don't produce visible messages
const ACTION_TYPES = new Set([
  'save_attribute', 'add_tag', 'google_sheet', 'webhook',
  'meta_conversion_api', 'payment', 'time_delay'
]);

// Message node types that produce visible content
const MESSAGE_TYPES = new Set([
  'text_button', 'media', 'audio', 'list', 'template',
  'ask_question', 'whatsapp_form'
]);

// Types that require interactive input from the user
const INTERACTIVE_TYPES = new Set(['text_button', 'list', 'ask_question', 'whatsapp_form', 'template']);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const { message, continue_from_node, selected_handle } = body;

    // Fetch all nodes and edges for this flow
    const [nodesRes, edgesRes] = await Promise.all([
      supabase.from('flow_nodes').select('*').eq('flow_id', params.id),
      supabase.from('flow_edges').select('*').eq('flow_id', params.id),
    ]);

    const allNodes: FlowNode[] = nodesRes.data || [];
    const allEdges: FlowEdge[] = edgesRes.data || [];

    const nodeMap = new Map(allNodes.map(n => [n.id, n]));

    // Helper: find outgoing edges from a node+handle
    const getOutgoingEdges = (nodeId: string, handleId?: string | null): FlowEdge[] => {
      if (handleId) {
        return allEdges.filter(e => e.source_node_id === nodeId && e.source_handle === handleId);
      }
      // For nodes with a single output, match edges with no handle or 'output' handle
      return allEdges.filter(e => e.source_node_id === nodeId && (!e.source_handle || e.source_handle === 'output'));
    };

    // If continuing from a previous interactive node
    if (continue_from_node) {
      const currentNode = nodeMap.get(continue_from_node);
      if (!currentNode) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }

      // Handle Ask a Question text reply
      if (currentNode.type === 'ask_question' && message && !selected_handle) {
        const c = currentNode.config || {};
        const expected = (c.expected_reply_type || 'Text').toLowerCase();
        let valid = true;
        const msgStr = message.trim();

        if (expected === 'number') {
          valid = !isNaN(Number(msgStr)) && msgStr !== '';
        } else if (expected === 'email') {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msgStr);
        } else if (expected === 'phone') {
          valid = /^[\d\s\-\+\(\)]{7,20}$/.test(msgStr); // basic loose validation
        } else if (expected === 'url') {
          valid = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(msgStr);
        } else if (expected === 'date' || expected === 'date & time' || expected === 'datetime') {
          valid = !isNaN(Date.parse(msgStr));
        }

        if (!valid) {
          // If invalid, we simulate the retry behavior
          const retryMsg = c.retry_message || `Invalid ${expected}. Please try again.`;
          return NextResponse.json({
            steps: [{
              node_id: currentNode.id,
              node_type: 'ask_question_retry',
              rendered_content: retryMsg,
              action_taken: `Failed validation for ${expected}`
            }],
            ended_at_node_id: currentNode.id,
            reason: 'awaiting_reply',
          });
        }

        // If valid, proceed down 'next_step'
        const outEdges = allEdges.filter(e => e.source_node_id === currentNode.id && e.source_handle === 'next_step');
        if (outEdges.length === 0) {
          return NextResponse.json({
            steps: [],
            ended_at_node_id: currentNode.id,
            reason: 'completed',
          });
        }

        const steps = walkGraph(nodeMap, allEdges, outEdges[0].target_node_id);
        return NextResponse.json({
          steps,
          ended_at_node_id: steps.length > 0 ? steps[steps.length - 1].node_id : currentNode.id,
          reason: steps.length > 0 && INTERACTIVE_TYPES.has(allNodes.find(n => n.id === steps[steps.length - 1].node_id)?.type || '')
            ? (steps[steps.length - 1].node_type === 'ask_question' ? 'awaiting_reply' : 'awaiting_button_selection')
            : 'completed',
        });
      }

      // Handle button selections
      if (selected_handle) {

      // Find the edge from the selected handle
      const outEdges = allEdges.filter(e => e.source_node_id === continue_from_node && e.source_handle === selected_handle);

      if (outEdges.length === 0) {
        // Try the 'next_step' fallback
        const fallbackEdges = allEdges.filter(e => e.source_node_id === continue_from_node && e.source_handle === 'next_step');
        if (fallbackEdges.length === 0) {
          return NextResponse.json({
            steps: [],
            ended_at_node_id: continue_from_node,
            reason: 'completed',
          });
        }
        // Walk from the next_step target
        const steps = walkGraph(nodeMap, allEdges, fallbackEdges[0].target_node_id);
        return NextResponse.json({
          steps,
          ended_at_node_id: steps.length > 0 ? steps[steps.length - 1].node_id : continue_from_node,
          reason: steps.length > 0 && INTERACTIVE_TYPES.has(allNodes.find(n => n.id === steps[steps.length - 1].node_id)?.type || '')
            ? (steps[steps.length - 1].node_type === 'ask_question' ? 'awaiting_reply' : 'awaiting_button_selection')
            : 'completed',
        });
      }

      const mockAttrs = body.mock_attributes || {};
      const steps = walkGraph(nodeMap, allEdges, outEdges[0].target_node_id, mockAttrs);
      return NextResponse.json({
        steps,
        ended_at_node_id: steps.length > 0 ? steps[steps.length - 1].node_id : continue_from_node,
        reason: steps.length > 0 && INTERACTIVE_TYPES.has(allNodes.find(n => n.id === steps[steps.length - 1].node_id)?.type || '')
          ? (steps[steps.length - 1].node_type === 'ask_question' ? 'awaiting_reply' : 'awaiting_button_selection')
          : 'completed',
      });
      }
    }

    // New test: start from the beginning
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'A test message string is required' }, { status: 400 });
    }

    // Find starting step (if multiple, prefer one with edges, then one with keywords)
    const startingSteps = allNodes.filter(n => n.type === 'starting_step');
    let startingStep = startingSteps[0];
    
    if (startingSteps.length > 1) {
      startingStep = startingSteps.find(n => getOutgoingEdges(n.id, 'output').length > 0) || startingStep;
    }

    if (!startingStep) {
      return NextResponse.json({
        steps: [],
        ended_at_node_id: '',
        reason: 'no_matching_trigger',
      });
    }

    const config = startingStep.config || {};
    const matchMode = config.match_mode || 'specific_keywords';

    console.log('[Test Flow] trigger_config loaded from DB:', JSON.stringify(config));
    console.log('[Test Flow] incoming message:', message);

    let triggered = false;

    if (matchMode === 'any_message') {
      triggered = true;
    } else if (matchMode === 'specific_keywords') {
      const keywords: string[] = (config.keywords || []).map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0);
      
      console.log('[Test Flow] keyword list being compared against:', keywords);

      if (keywords.length === 0) {
        return NextResponse.json({ error: "No keywords defined in Starting Step. Please add at least one keyword or select 'Any message'." }, { status: 400 });
      }

      const normalizedMessage = message.trim().toLowerCase();
      
      // Match if the normalized message EXACTLY matches a keyword, or if the keyword is a substring.
      // E.g. test message "hi there" matches keyword "hi".
      triggered = keywords.some((kw: string) => {
        const exact = normalizedMessage === kw;
        const substring = normalizedMessage.includes(kw);
        console.log(`[Test Flow] comparing msg "${normalizedMessage}" to kw "${kw}" -> exact: ${exact}, substring: ${substring}`);
        return exact || substring;
      });
      
      console.log('[Test Flow] triggered result:', triggered);
    }

    if (!triggered) {
      return NextResponse.json({
        steps: [],
        ended_at_node_id: startingStep.id,
        reason: 'no_matching_trigger',
      });
    }

    // Walk the graph from the starting step's output
    const startEdges = getOutgoingEdges(startingStep.id, 'output');
    if (startEdges.length === 0) {
      return NextResponse.json({
        steps: [],
        ended_at_node_id: startingStep.id,
        reason: 'completed',
      });
    }

    const mockAttrs = body.mock_attributes || {};
    const steps = walkGraph(nodeMap, allEdges, startEdges[0].target_node_id, mockAttrs);

    const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
    const lastNode = lastStep ? nodeMap.get(lastStep.node_id) : null;
    let reason: string = 'completed';
    if (lastNode && INTERACTIVE_TYPES.has(lastNode.type)) {
      reason = lastNode.type === 'ask_question' ? 'awaiting_reply' : 'awaiting_button_selection';
    }

    return NextResponse.json({
      steps,
      ended_at_node_id: lastStep ? lastStep.node_id : startingStep.id,
      reason,
    });
  } catch (err) {
    console.error('Test flow error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Walk the graph from a given node, collecting steps.
 * Stops at interactive nodes (text_button, list, ask_question) or when there are no more edges.
 */
function walkGraph(
  nodeMap: Map<string, FlowNode>,
  allEdges: FlowEdge[],
  startNodeId: string,
  mockAttrs: Record<string, string> = {},
  maxSteps = 50
): TestStep[] {
  const steps: TestStep[] = [];
  let currentId: string | null = startNodeId;
  const visited = new Set<string>();

  while (currentId && steps.length < maxSteps) {
    if (visited.has(currentId)) break; // prevent infinite loops
    visited.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node) break;

    const c = node.config || {};

    if (ACTION_TYPES.has(node.type)) {
      const action = getDryRunAction(node);
      steps.push({
        node_id: node.id,
        node_type: node.type,
        rendered_content: '',
        action_taken: action || `Would execute: ${node.type}`,
      });

      // Continue to next node via 'output' handle
      const outEdges = allEdges.filter(e => e.source_node_id === node.id && (!e.source_handle || e.source_handle === 'output'));
      currentId = outEdges.length > 0 ? outEdges[0].target_node_id : null;
      continue;
    }

    if (node.type === 'condition') {
      const c = node.config || {};
      const conditions = c.conditions || [];
      const logic = c.logic || 'and';

      let allEvaluated = true;
      let rowResults = [];

      for (const row of conditions) {
        const contactVal = mockAttrs[row.attribute_id];
        if (contactVal === undefined) {
          allEvaluated = false;
          break;
        }

        const op = row.operator;
        const val = row.value || '';
        let result = false;

        if (op === 'is_empty') result = contactVal.trim() === '';
        else if (op === 'is_not_empty') result = contactVal.trim() !== '';
        else if (op === 'equal') result = contactVal === val;
        else if (op === 'not_equal') result = contactVal !== val;
        else if (op === 'contains') result = contactVal.includes(val);
        else if (op === 'not_contains') result = !contactVal.includes(val);
        else if (op === 'greater_than' || op === 'less_than') {
          const numC = parseFloat(contactVal);
          const numV = parseFloat(val);
          if (isNaN(numC) || isNaN(numV)) {
            allEvaluated = false;
            break;
          }
          if (op === 'greater_than') result = numC > numV;
          if (op === 'less_than') result = numC < numV;
        }

        rowResults.push(result);
      }

      let routeHandle = 'next_step';
      let outcomeLabel = 'Next Step (Cannot Evaluate)';

      if (allEvaluated && conditions.length > 0) {
        let finalResult = logic === 'and' 
          ? rowResults.every(r => r === true)
          : rowResults.some(r => r === true);
        
        if (finalResult) {
          routeHandle = 'true';
          outcomeLabel = 'When True';
        } else {
          routeHandle = 'false';
          outcomeLabel = 'When False';
        }
      }

      steps.push({
        node_id: node.id,
        node_type: node.type,
        rendered_content: `Condition Node evaluated ${conditions.length} condition(s)`,
        action_taken: `Evaluating conditions... routed to -> ${outcomeLabel}`,
      });

      const edges = allEdges.filter(e => e.source_node_id === node.id && e.source_handle === routeHandle);
      currentId = edges.length > 0 ? edges[0].target_node_id : null;
      continue;
    }

    if (MESSAGE_TYPES.has(node.type)) {
      const step: TestStep = {
        node_id: node.id,
        node_type: node.type,
        rendered_content: getRenderedContent(node),
      };
      if (node.type === 'media') {
        step.media_url = c.media_url;
        step.media_type = c.media_type;
      }
      if (node.type === 'audio') {
        step.audio_url = c.audio_url;
      }

      // Add interactive elements
      if (node.type === 'text_button' && c.button_mode === 'reply_buttons' && c.buttons?.length > 0) {
        step.buttons = c.buttons.map((b: { id: string; text: string }) => ({ id: b.id, text: b.text }));
      } else if (node.type === 'whatsapp_form' && c.button_text) {
        step.buttons = [
          { id: 'form_completed', text: c.button_text },
          { id: 'next_step', text: 'Skip / Do not fill (Simulate Fallback)' }
        ];
      } else if (node.type === 'template' && c.buttons?.length > 0) {
        step.buttons = c.buttons.map((b: any, idx: number) => ({ id: b.id || `btn-${idx}`, text: b.text }));
      }

      if (node.type === 'list' && c.sections?.length > 0) {
        const rows: { id: string; title: string; section_title: string }[] = [];
        for (const section of c.sections) {
          for (const row of (section.rows || [])) {
            rows.push({ id: row.id, title: row.title, section_title: section.title });
          }
        }
        step.list_rows = rows;
      }

      steps.push(step);

      // If this is an interactive node, stop and wait for user selection
      if (INTERACTIVE_TYPES.has(node.type)) {
        return steps;
      }

      // Otherwise continue to 'output' handle
      const outEdges = allEdges.filter(e => e.source_node_id === node.id && (!e.source_handle || e.source_handle === 'output'));
      currentId = outEdges.length > 0 ? outEdges[0].target_node_id : null;
      continue;
    }

    // Unknown node type, skip
    currentId = null;
  }

  return steps;
}
