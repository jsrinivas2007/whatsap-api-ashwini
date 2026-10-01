import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class ContactsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getContacts(accountId: string, query?: string, tags?: string[]) {
    const client = this.supabase.getClient();
    let queryBuilder = client.from('contacts').select('*').eq('account_id', accountId).is('deleted_at', null);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,whatsapp_number.ilike.%${query}%`);
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async addContact(accountId: string, payload: any) {
    console.log("BACKEND ADD CONTACT RECEIVED:", accountId, JSON.stringify(payload));
    const client = this.supabase.getClient();
    
    // Check duplicate
    const { data: existing } = await client
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('whatsapp_number', payload.whatsapp_number)
      .single();

    if (existing) {
      throw new BadRequestException('Contact with this WhatsApp number already exists.');
    }

    const { data, error } = await client.from('contacts').insert({
      account_id: accountId,
      name: payload.name,
      whatsapp_number: payload.whatsapp_number,
      country_code: payload.country_code || null,
      tags: payload.tags || [],
      attributes: payload.attributes || {},
      source: 'manual',
    }).select().single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async updateContact(accountId: string, id: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('contacts').update({
      name: payload.name,
      whatsapp_number: payload.whatsapp_number,
      country_code: payload.country_code || null,
      tags: payload.tags || [],
      attributes: payload.attributes || {},
      updated_at: new Date().toISOString(),
    }).eq('id', id).eq('account_id', accountId).select().single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async deleteContact(accountId: string, id: string) {
    const client = this.supabase.getClient();
    const { error } = await client.from('contacts').update({
      deleted_at: new Date().toISOString(),
    }).eq('id', id).eq('account_id', accountId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true };
  }

  async importContacts(accountId: string, rows: any[]) {
    if (!rows || rows.length === 0) {
      throw new BadRequestException('No rows provided');
    }

    const client = this.supabase.getClient();
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Fetch existing contacts for this account to check duplicates fast
    const { data: existingContacts } = await client
      .from('contacts')
      .select('id, whatsapp_number, deleted_at')
      .eq('account_id', accountId);

    const activeNumbers = new Set(existingContacts?.filter(c => !c.deleted_at).map(c => c.whatsapp_number) || []);
    const deletedContactsMap = new Map(
      existingContacts?.filter(c => c.deleted_at).map(c => [c.whatsapp_number, c.id]) || []
    );

    const toInsert = [];
    const toRestoreIds = [];

    console.log("BACKEND RECEIVED ROWS COUNT:", rows.length);
    let loopCounter = 0;
    for (const row of rows) {
      loopCounter++;
      console.log(`BACKEND PROCESSING ROW ${loopCounter}:`, JSON.stringify(row));
      
      if (!row.whatsapp_number) {
        failed++;
        continue;
      }

      if (activeNumbers.has(row.whatsapp_number)) {
        skipped++;
        continue;
      }

      if (deletedContactsMap.has(row.whatsapp_number)) {
        toRestoreIds.push(deletedContactsMap.get(row.whatsapp_number));
        activeNumbers.add(row.whatsapp_number); // Prevent restoring same number twice in same CSV
        continue;
      }

      toInsert.push({
        account_id: accountId,
        name: row.name || null,
        whatsapp_number: row.whatsapp_number,
        country_code: row.country_code || null,
        tags: row.tags || [],
        attributes: row.attributes || {},
        source: 'csv_upload',
      });
      activeNumbers.add(row.whatsapp_number);
    }
    
    console.log("BACKEND TO INSERT COUNT:", toInsert.length);
    console.log("BACKEND TO RESTORE COUNT:", toRestoreIds.length);

    if (toInsert.length > 0) {
      const { error } = await client.from('contacts').insert(toInsert);
      if (error) {
        throw new BadRequestException(`Failed to insert batch: ${error.message}`);
      }
      imported += toInsert.length;
    }

    if (toRestoreIds.length > 0) {
      const { error } = await client.from('contacts').update({ deleted_at: null, source: 'csv_upload' }).in('id', toRestoreIds);
      if (error) {
        throw new BadRequestException(`Failed to restore contacts: ${error.message}`);
      }
      imported += toRestoreIds.length;
    }

    return { imported, skipped, failed };
  }
}
