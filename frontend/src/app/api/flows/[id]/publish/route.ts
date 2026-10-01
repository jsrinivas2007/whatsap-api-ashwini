import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    
    // Parse body if any
    let body = {};
    try {
      body = await request.json();
    } catch (e) {}
    const force = (body as any).force === true;

    // 1. Fetch the flow, nodes, and edges
    const [flowRes, nodesRes, edgesRes] = await Promise.all([
      supabase.from('automation_flows').select('*').eq('id', params.id).single(),
      supabase.from('flow_nodes').select('*').eq('flow_id', params.id),
      supabase.from('flow_edges').select('*').eq('flow_id', params.id)
    ]);

    if (flowRes.error || !flowRes.data) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    const flow = flowRes.data;
    const nodes = nodesRes.data || [];
    const edges = edgesRes.data || [];

    // 2. Validate starting step configuration
    const startingStep = nodes.find(n => n.type === 'starting_step');
    if (!startingStep) {
       return NextResponse.json({ error: 'Flow must have a Starting Step.' }, { status: 400 });
    }
    const config = startingStep.config || {};
    
    if (!config.match_mode) {
      return NextResponse.json({ error: 'Please configure the starting step before publishing. Select "Specific keywords" or "Any message".' }, { status: 400 });
    }

    if (config.match_mode === 'specific_keywords') {
      const keywords = (config.keywords || []).filter((k: string) => k.trim().length > 0);
      if (keywords.length === 0) {
        return NextResponse.json({ error: 'Please add at least one keyword to the Starting Step.' }, { status: 400 });
      }
    }

    // 3. Validation
    const errors: { nodeId: string; message: string }[] = [];
    const warnings: { nodeId: string; message: string }[] = [];

    // Structural: Reachability
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const reachable = new Set<string>();
    
    function traverse(nodeId: string) {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);
      edges.filter(e => e.source_node_id === nodeId).forEach(e => {
        if (e.target_node_id) traverse(e.target_node_id);
      });
    }
    traverse(startingStep.id);

    // Structural: Unconnected outputs
    const TERMINAL_TYPES = new Set(['google_sheet', 'webhook', 'meta_conversion_api']); 
    
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        warnings.push({ nodeId: node.id, message: `Node "${node.type}" is unreachable from the Starting Step.` });
      }

      const c = node.config || {};
      const outEdges = edges.filter(e => e.source_node_id === node.id);

      // Node-specific validation
      switch (node.type) {
        case 'starting_step':
          if (!c.match_mode) {
             errors.push({ nodeId: node.id, message: 'Starting step requires a trigger configuration.' });
          } else if (c.match_mode === 'specific_keywords') {
             const keywords = (c.keywords || []).filter((k: string) => k.trim().length > 0);
             if (keywords.length === 0) errors.push({ nodeId: node.id, message: 'Starting step requires at least one keyword.' });
          }
          break;
        case 'text_button':
          if (!c.message || !c.message.trim()) {
            errors.push({ nodeId: node.id, message: 'Text + Button node requires a message.' });
          }
          if (c.button_mode === 'reply_buttons') {
            const btns = (c.buttons || []).filter((b: any) => b.text && b.text.trim());
            if (btns.length === 0) {
              errors.push({ nodeId: node.id, message: 'Text + Button node requires at least one button.' });
            }
          }
          break;
        case 'media':
          if (!c.media_url || !c.media_url.trim()) errors.push({ nodeId: node.id, message: 'Media node is missing an uploaded file.' });
          break;
        case 'audio':
          if (!c.audio_url || !c.audio_url.trim()) errors.push({ nodeId: node.id, message: 'Audio node is missing an uploaded file.' });
          break;
        case 'template':
          if (!c.template_id && !c.template_name) {
            errors.push({ nodeId: node.id, message: 'Template Message node requires a selected template.' });
          } else {
            // Re-check live status (assuming templates table exists, graceful fallback)
            const { data: tpl } = await supabase.from('whatsapp_templates').select('status').eq('id', c.template_id || c.template_name).maybeSingle();
            if (tpl && tpl.status !== 'approved') {
              errors.push({ nodeId: node.id, message: 'Selected template is no longer approved.' });
            }
          }
          break;
        case 'list':
          if (!c.message_body || !c.message_body.trim()) {
            errors.push({ nodeId: node.id, message: 'List node requires a message body.' });
          }
          const sections = c.sections || [];
          let hasRow = false;
          for (const sec of sections) {
            if (sec.rows && sec.rows.length > 0) hasRow = true;
          }
          if (!hasRow) {
            errors.push({ nodeId: node.id, message: 'List node requires at least one section with one row.' });
          }
          break;
        case 'ask_question':
          if (!c.question || !c.question.trim()) errors.push({ nodeId: node.id, message: 'Ask a Question node requires a question.' });
          if (!c.expected_reply_type) errors.push({ nodeId: node.id, message: 'Ask a Question node requires an expected reply type.' });
          if (!c.save_to_attribute_id) errors.push({ nodeId: node.id, message: 'Ask a Question node requires an attribute to save to.' });
          break;
        case 'whatsapp_form':
          if (!c.message_body || !c.message_body.trim()) errors.push({ nodeId: node.id, message: 'WhatsApp Form node requires a message.' });
          if (!c.button_text || !c.button_text.trim()) errors.push({ nodeId: node.id, message: 'WhatsApp Form node requires a button text.' });
          if (!c.form_id) {
            errors.push({ nodeId: node.id, message: 'WhatsApp Form node requires a selected form.' });
          } else {
            const { data: form } = await supabase.from('whatsapp_forms').select('status').eq('id', c.form_id).maybeSingle();
            if (form && form.status !== 'published') {
              errors.push({ nodeId: node.id, message: 'Selected WhatsApp Form is no longer published.' });
            }
          }
          break;
        case 'save_attribute':
          if (!c.attribute_id) errors.push({ nodeId: node.id, message: 'Save Attribute node requires an attribute.' });
          if (c.value === undefined || c.value === null || c.value === '') errors.push({ nodeId: node.id, message: 'Save Attribute node requires a value.' });
          break;
        case 'add_tag':
          if (!c.tag_id) errors.push({ nodeId: node.id, message: 'Add Tag node requires a tag.' });
          break;
        case 'time_delay':
          const mode = c.delay_mode || 'relative';
          if (mode === 'relative') {
            const dur = Number(c.duration || 0);
            if (dur === 0) warnings.push({ nodeId: node.id, message: 'Time Delay node has 0 duration.' });
          } else {
            if (!c.specific_time) errors.push({ nodeId: node.id, message: 'Time Delay node requires a specific time.' });
            else if (new Date(c.specific_time).getTime() < Date.now()) errors.push({ nodeId: node.id, message: 'Time Delay node specific time must be in the future.' });
          }
          break;
        case 'condition':
          const conds = c.conditions || [];
          if (conds.length === 0) errors.push({ nodeId: node.id, message: 'Condition node requires at least one condition row.' });
          for (const row of conds) {
            if (!row.attribute_id) errors.push({ nodeId: node.id, message: 'Condition row requires an attribute.' });
            if (!row.operator) errors.push({ nodeId: node.id, message: 'Condition row requires an operator.' });
            if (row.operator !== 'is_empty' && row.operator !== 'is_not_empty' && (row.value === undefined || row.value === '')) {
              errors.push({ nodeId: node.id, message: 'Condition row requires a value.' });
            }
          }
          break;
      }

      // Check unconnected outputs
      if (!TERMINAL_TYPES.has(node.type) && outEdges.length === 0 && node.type !== 'starting_step') {
        warnings.push({ nodeId: node.id, message: `Node "${node.type}" has no outgoing connection, path will dead-end.` });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors, warnings }, { status: 400 });
    }

    if (warnings.length > 0 && !force) {
      return NextResponse.json({ needsConfirmation: true, warnings }, { status: 200 });
    }

    // 4. Update the main flow table
    const { data, error } = await supabase
      .from('automation_flows')
      .update({ 
         status: 'active', 
         trigger_type: 'message',
         trigger_config: startingStep.config || {}
      })
      .eq('id', params.id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flow: data?.[0], warnings });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
