import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class WabaService {
  constructor(private readonly supabase: SupabaseService) {}

  async getWabaAccount(accountId: string) {
    const client = this.supabase.getClient();
    // Use raw query logic for the stub since we don't know the exact schema deployment state
    const { data, error } = await client
      .from('waba_accounts')
      .select('*')
      .eq('account_id', accountId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('WabaAccount not found:', error.message);
      return null;
    }
    return data;
  }

  async getBusinessProfile(accountId: string) {
    const account = await this.getWabaAccount(accountId);
    if (!account) return null;

    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('business_profiles')
      .select('*')
      .eq('waba_account_id', account.id)
      .single();

    if (error) {
      console.warn('BusinessProfile not found:', error.message);
      return null;
    }
    return data;
  }

  async createWabaAccount(accountId: string, payload: any) {
    const client = this.supabase.getClient();
    
    // Check if account already exists to avoid duplicates
    const { data: existing } = await client
      .from('waba_accounts')
      .select('id')
      .eq('account_id', accountId)
      .limit(1)
      .maybeSingle();

    const accountData = {
      account_id: accountId,
      waba_id: payload.waba_id,
      phone_number_id: payload.phone_number_id,
      display_phone_number: payload.display_phone_number,
      business_name: payload.business_name,
      message_limit_tier: 'TIER_1K',
      account_status: 'approved',
      quality_rating: 'green',
      fb_business_verification_status: 'verified',
      payment_method_status: 'action_required',
      access_token: payload.access_token,
      connection_type: payload.connection_type,
    };

    let result;
    if (existing) {
      result = await client.from('waba_accounts').update(accountData).eq('id', existing.id).select().single();
    } else {
      result = await client.from('waba_accounts').insert(accountData).select().single();
    }

    if (result.error) {
      throw new Error(`Failed to create/update WabaAccount: ${result.error.message}`);
    }
    return result.data;
  }

  async updateWabaAccount(accountId: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('waba_accounts')
      .update(payload)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update WabaAccount: ${error.message}`);
    }
    return data;
  }

  async updateBusinessProfile(accountId: string, payload: any) {
    const account = await this.getWabaAccount(accountId);
    if (!account) throw new Error('WabaAccount not found');

    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('business_profiles')
      .upsert({ waba_account_id: account.id, ...payload })
      .select()
      .single();

    if (error) {
      console.warn('Failed to update BusinessProfile:', error.message);
      return payload; // fallback
    }
    return data;
  }
}
