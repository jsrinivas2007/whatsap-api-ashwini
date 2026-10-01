import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

type NodeRow = { id: string; type: string; config: Record<string, any> };
type EdgeRow = { source_node_id: string; target_node_id: string; source_handle: string | null };

type TestStep = {
  node_id: string;
  node_type: string;
  rendered_content: string | null;
  action_taken?: string;
  buttons?: { id: string; text: string }[];
  list_rows?: { id: string; title: string; section_title: string }[];
  media_url?: string;
  media_type?: string;
  audio_url?: string;
};

type TestResult = {
  steps: TestStep[];
  ended_at_node_id: string | null;
  reason: 'completed' | 'awaiting_button_selection' | 'awaiting_reply' | 'no_matching_trigger';
};

@Injectable()
export class FlowEngineService {
  constructor(private readonly supabase: SupabaseService) {}

  private client() {
    return this.supabase.getClient();
  }

  private handleError(error: any) {
    throw new HttpException(error?.message || 'Unexpected error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Substitute {{key}} tokens using mock attributes (keys are attribute ids/names).
  private render(text: string, mock: Record<string, any>): string {
    if (!text) return '';
    return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, key) => {
      const v = mock[key];
      return v !== undefined && v !== null ? String(v) : `{{${key}}}`;
    });
  }

  // ---------- Test simulation ----------

  async testFlow(accountId: string, flowId: string, body: any): Promise<TestResult> {
    const { data: flow, error: flowErr } = await this.client()
      .from('automation_flows')
      .select('*')
      .eq('id', flowId)
      .eq('account_id', accountId)
      .maybeSingle();
    if (flowErr) this.handleError(flowErr);
    if (!flow) throw new NotFoundException('Flow not found');

    const { data: nodeRows, error: nodeErr } = await this.client()
      .from('flow_nodes').select('id,type,config').eq('flow_id', flowId);
    if (nodeErr) this.handleError(nodeErr);

    const { data: edgeRows, error: edgeErr } = await this.client()
      .from('flow_edges').select('source_node_id,target_node_id,source_handle').eq('flow_id', flowId);
    if (edgeErr) this.handleError(edgeErr);

    const nodes: Record<string, NodeRow> = {};
    for (const n of (nodeRows || []) as NodeRow[]) nodes[n.id] = n;
    const edges = (edgeRows || []) as EdgeRow[];
    const mock: Record<string, any> = body?.mock_attributes || {};

    const findTarget = (sourceId: string, handle: string | null): string | null => {
      const e = edges.find(
        (x) => x.source_node_id === sourceId && (x.source_handle || null) === (handle || null),
      );
      return e ? e.target_node_id : null;
    };

    const steps: TestStep[] = [];
    let currentId: string | null = null;

    if (body?.continue_from_node) {
      const cur = nodes[body.continue_from_node];
      if (!cur) throw new NotFoundException('Continue-from node not found');
      // Interactive nodes resume via their selected handle; ask_question via next_step.
      const handle = body.selected_handle || (cur.type === 'ask_question' ? 'next_step' : null) || 'next_step';
      currentId = findTarget(cur.id, handle);
      if (!currentId) {
        return { steps, ended_at_node_id: cur.id, reason: 'completed' };
      }
    } else {
      const start = Object.values(nodes).find((n) => n.type === 'starting_step');
      if (!start) {
        return { steps, ended_at_node_id: null, reason: 'no_matching_trigger' };
      }
      if (!this.matchesTrigger(start, body?.message || '')) {
        return { steps, ended_at_node_id: start.id, reason: 'no_matching_trigger' };
      }
      currentId = findTarget(start.id, 'output');
      if (!currentId) {
        return { steps, ended_at_node_id: start.id, reason: 'completed' };
      }
    }

    let guard = 0;
    while (currentId && guard < 60) {
      guard++;
      const node = nodes[currentId];
      if (!node) break;

      const out = this.renderNode(node, mock);
      steps.push(out.step);

      if (out.await) {
        return { steps, ended_at_node_id: node.id, reason: out.reason as TestResult['reason'] };
      }

      currentId = findTarget(node.id, out.nextHandle);
      if (!currentId) {
        return { steps, ended_at_node_id: node.id, reason: 'completed' };
      }
    }

    return { steps, ended_at_node_id: currentId, reason: 'completed' };
  }

  private matchesTrigger(start: NodeRow, message: string): boolean {
    const cfg = start.config || {};
    const mode = cfg.match_mode || 'specific_keywords';
    if (mode === 'any_message') return true;
    const keywords: string[] = (cfg.keywords || []).map((k: string) => String(k).trim().toLowerCase()).filter(Boolean);
    const msg = (message || '').trim().toLowerCase();
    if (!msg) return false;
    return keywords.some((k) => msg === k || msg.includes(k));
  }

  private evaluateCondition(cfg: Record<string, any>, mock: Record<string, any>): boolean {
    const conditions: any[] = cfg.conditions || [];
    if (conditions.length === 0) return false;
    const logic = (cfg.logic || 'and').toLowerCase();

    const test = (c: any): boolean => {
      const actual = mock[c.attribute_id];
      const a = actual === undefined || actual === null ? '' : String(actual);
      const b = c.value === undefined || c.value === null ? '' : String(c.value);
      switch (c.operator) {
        case 'equal': return a.toLowerCase() === b.toLowerCase();
        case 'not_equal': return a.toLowerCase() !== b.toLowerCase();
        case 'contains': return a.toLowerCase().includes(b.toLowerCase());
        case 'not_contains': return !a.toLowerCase().includes(b.toLowerCase());
        case 'greater_than': return parseFloat(a) > parseFloat(b);
        case 'less_than': return parseFloat(a) < parseFloat(b);
        case 'is_empty': return a.trim() === '';
        case 'is_not_empty': return a.trim() !== '';
        default: return false;
      }
    };

    return logic === 'or' ? conditions.some(test) : conditions.every(test);
  }

  // Returns the rendered step + how to continue (nextHandle) or whether it awaits input.
  private renderNode(
    node: NodeRow,
    mock: Record<string, any>,
  ): { step: TestStep; await?: boolean; reason?: string; nextHandle: string | null } {
    const cfg = node.config || {};
    const base = { node_id: node.id, node_type: node.type };

    switch (node.type) {
      case 'text_button': {
        const buttons: { id: string; text: string }[] = (cfg.buttons || [])
          .filter((b: any) => b && b.text)
          .map((b: any) => ({ id: b.id, text: b.text }));
        const step: TestStep = { ...base, rendered_content: this.render(cfg.message || '', mock), buttons };
        if (cfg.button_mode === 'url_button') {
          if (cfg.url_button_text) step.buttons = [{ id: 'url', text: cfg.url_button_text }];
          return { step, nextHandle: 'next_step' };
        }
        if (buttons.length > 0) {
          return { step, await: true, reason: 'awaiting_button_selection', nextHandle: null };
        }
        return { step, nextHandle: 'next_step' };
      }

      case 'list': {
        const rows: { id: string; title: string; section_title: string }[] = [];
        for (const section of cfg.sections || []) {
          for (const row of section.rows || []) {
            if (row && row.title) rows.push({ id: row.id, title: row.title, section_title: section.title || '' });
          }
        }
        const step: TestStep = { ...base, rendered_content: this.render(cfg.message_body || '', mock), list_rows: rows };
        if (rows.length > 0) {
          return { step, await: true, reason: 'awaiting_button_selection', nextHandle: null };
        }
        return { step, nextHandle: 'next_step' };
      }

      case 'media': {
        const buttons: { id: string; text: string }[] = (cfg.buttons || [])
          .filter((b: any) => b && b.text)
          .map((b: any) => ({ id: b.id, text: b.text }));
        const step: TestStep = {
          ...base,
          rendered_content: this.render(cfg.caption || '', mock),
          media_url: cfg.media_url || undefined,
          media_type: cfg.media_type || undefined,
          buttons,
        };
        if ((cfg.button_mode || 'reply_buttons') === 'reply_buttons' && buttons.length > 0) {
          return { step, await: true, reason: 'awaiting_button_selection', nextHandle: null };
        }
        return { step, nextHandle: 'next_step' };
      }

      case 'audio': {
        const step: TestStep = { ...base, rendered_content: '', audio_url: cfg.audio_url || undefined };
        return { step, nextHandle: 'next_step' };
      }

      case 'template': {
        const step: TestStep = { ...base, rendered_content: `[Template: ${cfg.template_name || cfg.template_id || 'not set'}]` };
        return { step, nextHandle: 'next_step' };
      }

      case 'ask_question': {
        const step: TestStep = { ...base, rendered_content: this.render(cfg.question || '', mock) };
        return { step, await: true, reason: 'awaiting_reply', nextHandle: 'next_step' };
      }

      case 'whatsapp_form': {
        const step: TestStep = { ...base, rendered_content: null, action_taken: `[WhatsApp Form] flow_id=${cfg.flow_id || 'not set'}` };
        return { step, nextHandle: 'next_step' };
      }

      case 'save_attribute': {
        const step: TestStep = {
          ...base,
          rendered_content: null,
          action_taken: `Would save attribute (ID ${cfg.attribute_id || '?'}) = "${this.render(cfg.value || '', mock)}"`,
        };
        return { step, nextHandle: 'next_step' };
      }

      case 'add_tag': {
        const step: TestStep = { ...base, rendered_content: null, action_taken: `Would add tag (ID ${cfg.tag_id || '?'})` };
        return { step, nextHandle: 'next_step' };
      }

      case 'time_delay': {
        const parts: string[] = [];
        if (cfg.days) parts.push(`${cfg.days}d`);
        if (cfg.hours) parts.push(`${cfg.hours}h`);
        if (cfg.minutes) parts.push(`${cfg.minutes}m`);
        const summary = cfg.mode === 'specific_time' && cfg.specific_datetime
          ? `until ${cfg.specific_datetime}`
          : parts.length ? `for ${parts.join(' ')}` : 'immediately';
        const step: TestStep = { ...base, rendered_content: null, action_taken: `[Time delay] flow would pause ${summary}` };
        return { step, nextHandle: 'next_step' };
      }

      case 'condition': {
        const pass = this.evaluateCondition(cfg, mock);
        const step: TestStep = { ...base, rendered_content: null, action_taken: `[Condition] evaluated ${pass ? 'TRUE' : 'FALSE'}` };
        return { step, nextHandle: pass ? 'true' : 'false' };
      }

      default: {
        const step: TestStep = { ...base, rendered_content: null, action_taken: `[${node.type}]` };
        return { step, nextHandle: 'next_step' };
      }
    }
  }

  // ---------- Publish validation ----------

  async publishFlow(accountId: string, flowId: string, force: boolean) {
    const { data: flow, error: flowErr } = await this.client()
      .from('automation_flows')
      .select('*')
      .eq('id', flowId)
      .eq('account_id', accountId)
      .maybeSingle();
    if (flowErr) this.handleError(flowErr);
    if (!flow) throw new NotFoundException('Flow not found');

    const { data: nodeRows, error: nodeErr } = await this.client()
      .from('flow_nodes').select('id,type,config').eq('flow_id', flowId);
    if (nodeErr) this.handleError(nodeErr);
    const { data: edgeRows, error: edgeErr } = await this.client()
      .from('flow_edges').select('source_node_id,source_handle,target_node_id').eq('flow_id', flowId);
    if (edgeErr) this.handleError(edgeErr);

    const nodes = (nodeRows || []) as NodeRow[];
    const edges = (edgeRows || []) as { source_node_id: string; source_handle: string | null; target_node_id: string }[];

    const errors: { nodeId: string | null; message: string }[] = [];
    const warnings: { nodeId: string | null; message: string }[] = [];

    const start = nodes.find((n) => n.type === 'starting_step');
    if (!start) {
      errors.push({ nodeId: null, message: 'Flow must have a Starting Step.' });
    } else if (!edges.some((e) => e.source_node_id === start.id)) {
      errors.push({ nodeId: start.id, message: 'The Starting Step is not connected to any next step.' });
    }

    for (const n of nodes) {
      const cfg = n.config || {};
      if (n.type === 'text_button' && !cfg.message && !(cfg.buttons || []).length) {
        errors.push({ nodeId: n.id, message: 'A Text + Button step has no message or buttons.' });
      }
      if (n.type === 'ask_question' && !cfg.question) {
        errors.push({ nodeId: n.id, message: 'An Ask Question step has no question text.' });
      }
      if (n.type === 'list' && !((cfg.sections || []).some((s: any) => (s.rows || []).length))) {
        errors.push({ nodeId: n.id, message: 'A List step has no rows.' });
      }
      if (n.type === 'condition') {
        const hasBranch = edges.some((e) => e.source_node_id === n.id && (e.source_handle === 'true' || e.source_handle === 'false'));
        if (!hasBranch) warnings.push({ nodeId: n.id, message: 'A Condition step has neither a True nor a False branch connected.' });
      }
    }

    if (errors.length && !force) {
      throw new HttpException({ errors, warnings }, HttpStatus.BAD_REQUEST);
    }

    if (!force && warnings.length && !errors.length) {
      return { needsConfirmation: true, warnings };
    }

    const { data: updated, error: updErr } = await this.client()
      .from('automation_flows')
      .update({ status: 'active', trigger_type: flow.trigger_type === 'not_set' ? 'message' : flow.trigger_type, updated_at: new Date().toISOString() })
      .eq('id', flowId)
      .eq('account_id', accountId)
      .select()
      .maybeSingle();
    if (updErr) this.handleError(updErr);
    return { success: true, flow: updated };
  }
}
