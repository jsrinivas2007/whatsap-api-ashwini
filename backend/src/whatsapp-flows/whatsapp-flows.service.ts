import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class WhatsappFlowsService {
  constructor(private readonly supabase: SupabaseService) {}

  private async getAccountMetaDetails(accountId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('waba_accounts')
      .select('waba_id, access_token')
      .eq('account_id', accountId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data;
  }

  async getFlows(accountId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getPublishedFlows(accountId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .select('id, name, meta_flow_id')
      .eq('account_id', accountId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getPlaygroundUrl(accountId: string) {
    const metaDetails = await this.getAccountMetaDetails(accountId);
    if (!metaDetails || !metaDetails.waba_id) {
      return { url: 'https://business.facebook.com/latest/whatsapp_manager/flows/' };
    }
    return { url: `https://business.facebook.com/latest/whatsapp_manager/flows/?waba_id=${metaDetails.waba_id}` };
  }

  async createFlow(accountId: string, payload: { name: string; flow_json: any }) {
    // 1. Initial Validation
    if (!payload.name || !payload.flow_json) {
      throw new HttpException('Name and flow_json are required', HttpStatus.BAD_REQUEST);
    }
    if (typeof payload.flow_json !== 'object' || !payload.flow_json.version || !Array.isArray(payload.flow_json.screens)) {
      throw new HttpException('flow_json must be an object containing "version" and "screens" array', HttpStatus.BAD_REQUEST);
    }
    const screensCount = payload.flow_json.screens.length;

    // 2. Insert as draft locally
    let { data: flowRecord, error: insertError } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .insert({
        account_id: accountId,
        name: payload.name,
        flow_json: payload.flow_json,
        screens_count: screensCount,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      throw new HttpException(insertError.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 3. Submit to Meta
    const metaDetails = await this.getAccountMetaDetails(accountId);
    if (!metaDetails || !metaDetails.waba_id || !metaDetails.access_token) {
      // If no valid Meta connection, leave as draft with an error message
      const updated = await this.updateFlowStatus(accountId, flowRecord.id, 'error', 'No valid WABA ID or Access Token configured.');
      return updated;
    }

    try {
      // Step A: Create Flow on Meta using form-encoded data (Meta requires this format)
      const createParams = new URLSearchParams();
      createParams.append('name', payload.name);
      createParams.append('categories', JSON.stringify(['OTHER']));

      const createRes = await fetch(`https://graph.facebook.com/v21.0/${metaDetails.waba_id}/flows`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaDetails.access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: createParams.toString()
      });
      const createData = await createRes.json();
      console.log('Meta Flow Create response:', JSON.stringify(createData));
      
      if (!createRes.ok || createData.error) {
        const metaMsg = createData.error?.error_user_msg || createData.error?.message || JSON.stringify(createData);
        throw new Error(metaMsg);
      }
      
      const metaFlowId = createData.id;
      console.log('Meta Flow created with ID:', metaFlowId);

      // Step B: Update Flow Assets (JSON)
      const formData = new FormData();
      formData.append('name', 'flow.json');
      formData.append('asset_type', 'FLOW_JSON');
      formData.append('file', new Blob([JSON.stringify(payload.flow_json)], { type: 'application/json' }), 'flow.json');

      const assetRes = await fetch(`https://graph.facebook.com/v21.0/${metaFlowId}/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaDetails.access_token}`
        },
        body: formData as any
      });
      
      const assetData = await assetRes.json();
      console.log('Meta Flow Asset response:', JSON.stringify(assetData));
      if (!assetRes.ok || assetData.error) {
        // Asset upload failed — still save locally as draft with the meta_flow_id
        console.warn('Flow asset upload failed, saving as draft:', assetData.error?.message);
        return await this.updateFlowStatus(accountId, flowRecord.id, 'draft', `Flow created on Meta but JSON upload failed: ${assetData.error?.message || 'Unknown error'}`, metaFlowId);
      }

      // Step C: Publish Flow
      const publishRes = await fetch(`https://graph.facebook.com/v21.0/${metaFlowId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaDetails.access_token}`
        }
      });
      const publishData = await publishRes.json();
      console.log('Meta Flow Publish response:', JSON.stringify(publishData));
      if (!publishRes.ok || publishData.error) {
        // Publish failed — save as draft with meta ID
        return await this.updateFlowStatus(accountId, flowRecord.id, 'draft', `Flow created but publish failed: ${publishData.error?.message || 'Unknown error'}`, metaFlowId);
      }

      // Success
      return await this.updateFlowStatus(accountId, flowRecord.id, 'published', null, metaFlowId);

    } catch (error: any) {
      console.error('Meta API Error:', error);
      return await this.updateFlowStatus(accountId, flowRecord.id, 'error', error.message);
    }
  }

  private async updateFlowStatus(accountId: string, id: string, status: string, errorMessage: string | null = null, metaFlowId: string | null = null) {
    const updatePayload: any = { status, error_message: errorMessage };
    if (metaFlowId) updatePayload.meta_flow_id = metaFlowId;

    const { data, error } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .update(updatePayload)
      .eq('account_id', accountId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getFlowDetail(accountId: string, id: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .select('*')
      .eq('account_id', accountId)
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    return data;
  }

  async deleteFlow(accountId: string, id: string) {
    // Ideally delete/deprecate from Meta first
    const flow = await this.getFlowDetail(accountId, id);
    if (flow.meta_flow_id) {
       const metaDetails = await this.getAccountMetaDetails(accountId);
       if (metaDetails && metaDetails.access_token) {
           await fetch(`https://graph.facebook.com/v21.0/${flow.meta_flow_id}`, {
               method: 'DELETE',
               headers: { 'Authorization': `Bearer ${metaDetails.access_token}` }
           }).catch(() => {});
       }
    }

    const { error } = await this.supabase
      .getClient()
      .from('whatsapp_flows')
      .delete()
      .eq('account_id', accountId)
      .eq('id', id);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true };
  }
}
