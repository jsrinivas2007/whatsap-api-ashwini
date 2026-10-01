import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class CampaignsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getCampaigns(accountId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('campaigns')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async createCampaign(accountId: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('campaigns').insert({
      account_id: accountId,
      name: payload.name,
      template: payload.template,
      contacts_count: payload.contacts || 0,
      type: payload.type || 'BROADCAST',
      status: payload.status || 'Draft',
      delivered: 0,
      read: 0,
      replies: 0,
      failed: 0,
    }).select().single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async deleteCampaign(accountId: string, id: string) {
    const client = this.supabase.getClient();
    const { error } = await client
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }
}
