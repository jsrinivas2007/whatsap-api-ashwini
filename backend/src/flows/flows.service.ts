import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

const DEFAULT_ACCOUNT = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class FlowsService {
  constructor(private readonly supabase: SupabaseService) {}

  private client() {
    return this.supabase.getClient();
  }

  private handleError(error: any) {
    throw new HttpException(error?.message || 'Unexpected error', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // ---------- Flows ----------

  async listFlows(accountId: string = DEFAULT_ACCOUNT) {
    const { data, error } = await this.client()
      .from('automation_flows')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) this.handleError(error);
    return data || [];
  }

  async getFlow(accountId: string, flowId: string) {
    const { data, error } = await this.client()
      .from('automation_flows')
      .select('*')
      .eq('id', flowId)
      .eq('account_id', accountId)
      .maybeSingle();
    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Flow not found');
    return data;
  }

  async createFlow(accountId: string, name: string) {
    if (!name || !name.trim()) {
      throw new HttpException('Flow name is required', HttpStatus.BAD_REQUEST);
    }
    const { data, error } = await this.client()
      .from('automation_flows')
      .insert({ account_id: accountId, name: name.trim(), status: 'inactive' })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async updateFlow(accountId: string, flowId: string, payload: { name?: string; trigger_type?: string; trigger_config?: any }) {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.trigger_type !== undefined) updateData.trigger_type = payload.trigger_type;
    if (payload.trigger_config !== undefined) updateData.trigger_config = payload.trigger_config;

    const { data, error } = await this.client()
      .from('automation_flows')
      .update(updateData)
      .eq('id', flowId)
      .eq('account_id', accountId)
      .select()
      .maybeSingle();
    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Flow not found');
    return data;
  }

  async updateStatus(accountId: string, flowId: string, status: string) {
    if (!['active', 'inactive'].includes(status)) {
      throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
    }
    const { data, error } = await this.client()
      .from('automation_flows')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', flowId)
      .eq('account_id', accountId)
      .select()
      .maybeSingle();
    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Flow not found');
    return data;
  }

  async deleteFlow(accountId: string, flowId: string) {
    // Cascade deletes nodes/edges via FK.
    const { error } = await this.client()
      .from('automation_flows')
      .delete()
      .eq('id', flowId)
      .eq('account_id', accountId);
    if (error) this.handleError(error);
    return { success: true };
  }

  async duplicateFlow(accountId: string, flowId: string) {
    const original = await this.getFlow(accountId, flowId);
    const nodes = await this.listNodes(accountId, flowId);
    const edges = await this.listEdges(accountId, flowId);

    const { data: copy, error: copyErr } = await this.client()
      .from('automation_flows')
      .insert({
        account_id: accountId,
        name: `${original.name} (Copy)`,
        trigger_type: original.trigger_type,
        trigger_config: original.trigger_config,
        status: 'inactive',
      })
      .select()
      .single();
    if (copyErr) this.handleError(copyErr);

    const idMap: Record<string, string> = {};
    for (const n of nodes) {
      const { data: nn, error } = await this.client()
        .from('flow_nodes')
        .insert({
          flow_id: copy.id,
          type: n.type,
          config: n.config,
          position_x: n.position_x,
          position_y: n.position_y,
        })
        .select()
        .single();
      if (error) this.handleError(error);
      idMap[n.id] = nn.id;
    }

    for (const e of edges) {
      const source = idMap[e.source_node_id];
      const target = idMap[e.target_node_id];
      if (!source || !target) continue;
      const { error } = await this.client()
        .from('flow_edges')
        .insert({
          flow_id: copy.id,
          source_node_id: source,
          target_node_id: target,
          source_handle: e.source_handle,
        });
      if (error) this.handleError(error);
    }

    return copy;
  }

  // ---------- Nodes ----------

  async listNodes(accountId: string, flowId: string) {
    await this.getFlow(accountId, flowId); // ownership guard
    const { data, error } = await this.client()
      .from('flow_nodes')
      .select('*')
      .eq('flow_id', flowId)
      .order('created_at', { ascending: true });
    if (error) this.handleError(error);
    return data || [];
  }

  async createNode(accountId: string, flowId: string, payload: { type: string; config?: any; position_x?: number; position_y?: number }) {
    await this.getFlow(accountId, flowId); // ownership guard
    if (!payload.type) throw new HttpException('Node type is required', HttpStatus.BAD_REQUEST);

    const { data, error } = await this.client()
      .from('flow_nodes')
      .insert({
        flow_id: flowId,
        type: payload.type,
        config: payload.config || {},
        position_x: payload.position_x ?? 0,
        position_y: payload.position_y ?? 0,
      })
      .select()
      .single();
    if (error) this.handleError(error);

    // A starting_step implies this is a message-triggered chatbot flow.
    if (payload.type === 'starting_step') {
      await this.client()
        .from('automation_flows')
        .update({ trigger_type: 'message', updated_at: new Date().toISOString() })
        .eq('id', flowId);
    }

    return data;
  }

  async updateNode(accountId: string, flowId: string, nodeId: string, payload: { config?: any; position_x?: number; position_y?: number; type?: string }) {
    await this.getFlow(accountId, flowId); // ownership guard
    const updateData: any = { updated_at: new Date().toISOString() };
    if (payload.config !== undefined) updateData.config = payload.config;
    if (payload.position_x !== undefined) updateData.position_x = payload.position_x;
    if (payload.position_y !== undefined) updateData.position_y = payload.position_y;
    if (payload.type !== undefined) updateData.type = payload.type;

    const { data, error } = await this.client()
      .from('flow_nodes')
      .update(updateData)
      .eq('id', nodeId)
      .eq('flow_id', flowId)
      .select()
      .maybeSingle();
    if (error) this.handleError(error);
    if (!data) throw new NotFoundException('Node not found');
    return data;
  }

  async deleteNode(accountId: string, flowId: string, nodeId: string) {
    await this.getFlow(accountId, flowId); // ownership guard
    const { error } = await this.client()
      .from('flow_nodes')
      .delete()
      .eq('id', nodeId)
      .eq('flow_id', flowId);
    if (error) this.handleError(error);
    return { success: true };
  }

  // ---------- Edges ----------

  async listEdges(accountId: string, flowId: string) {
    await this.getFlow(accountId, flowId); // ownership guard
    const { data, error } = await this.client()
      .from('flow_edges')
      .select('*')
      .eq('flow_id', flowId)
      .order('created_at', { ascending: true });
    if (error) this.handleError(error);
    return data || [];
  }

  async createEdge(accountId: string, flowId: string, payload: { source_node_id: string; target_node_id: string; source_handle?: string | null }) {
    await this.getFlow(accountId, flowId); // ownership guard
    if (!payload.source_node_id || !payload.target_node_id) {
      throw new HttpException('Source and target nodes are required', HttpStatus.BAD_REQUEST);
    }

    const { data, error } = await this.client()
      .from('flow_edges')
      .insert({
        flow_id: flowId,
        source_node_id: payload.source_node_id,
        target_node_id: payload.target_node_id,
        source_handle: payload.source_handle ?? null,
      })
      .select()
      .single();
    if (error) this.handleError(error);
    return data;
  }

  async deleteEdge(accountId: string, flowId: string, edgeId: string) {
    await this.getFlow(accountId, flowId); // ownership guard
    const { error } = await this.client()
      .from('flow_edges')
      .delete()
      .eq('id', edgeId)
      .eq('flow_id', flowId);
    if (error) this.handleError(error);
    return { success: true };
  }
}
