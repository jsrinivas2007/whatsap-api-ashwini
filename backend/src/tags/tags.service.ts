import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class TagsService {
  constructor(private readonly supabase: SupabaseService) {}

  // --- Tags ---

  async getTags(accountId: string) {
    const client = this.supabase.getClient();
    
    // 1. Fetch tags
    const { data: tags, error } = await client
      .from('tags')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty
        return [];
      }
      throw new BadRequestException(error.message);
    }

    // 2. Fetch contact counts for each tag
    // Since tags are stored as string[] in contacts table, we count them manually
    const { data: contacts } = await client
      .from('contacts')
      .select('tags')
      .eq('account_id', accountId)
      .is('deleted_at', null);

    const tagCounts: Record<string, number> = {};
    if (contacts) {
      for (const c of contacts) {
        if (c.tags) {
          for (const t of c.tags) {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          }
        }
      }
    }

    return tags.map(t => ({
      ...t,
      contact_count: tagCounts[t.name] || 0
    }));
  }

  async createTag(accountId: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('tags')
      .insert({
        account_id: accountId,
        name: payload.name,
        color: payload.color || '#e2e8f0',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { ...data, contact_count: 0 };
  }

  async updateTag(accountId: string, id: string, payload: any) {
    const client = this.supabase.getClient();
    
    // Check if renaming
    const { data: oldTag } = await client.from('tags').select('name').eq('id', id).eq('account_id', accountId).single();
    
    const { data, error } = await client
      .from('tags')
      .update({
        name: payload.name,
        color: payload.color,
      })
      .eq('id', id)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // If renamed, update contacts
    if (oldTag && oldTag.name !== payload.name) {
      // Find contacts with old tag
      const { data: affected } = await client.from('contacts').select('id, tags').eq('account_id', accountId).contains('tags', [oldTag.name]);
      if (affected && affected.length > 0) {
        for (const c of affected) {
          const newTags = c.tags.map((t: string) => t === oldTag.name ? payload.name : t);
          await client.from('contacts').update({ tags: newTags }).eq('id', c.id);
        }
      }
    }

    return data;
  }

  async deleteTag(accountId: string, id: string) {
    const client = this.supabase.getClient();
    
    const { data: oldTag } = await client.from('tags').select('name').eq('id', id).eq('account_id', accountId).single();
    
    const { error } = await client
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) throw new BadRequestException(error.message);

    // Remove from contacts
    if (oldTag) {
      const { data: affected } = await client.from('contacts').select('id, tags').eq('account_id', accountId).contains('tags', [oldTag.name]);
      if (affected && affected.length > 0) {
        for (const c of affected) {
          const newTags = c.tags.filter((t: string) => t !== oldTag.name);
          await client.from('contacts').update({ tags: newTags }).eq('id', c.id);
        }
      }
    }

    return { success: true };
  }

  // --- Attributes ---

  async getAttributes(accountId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('attribute_definitions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
       if (error.code === '42P01') return [];
       throw new BadRequestException(error.message);
    }
    return data;
  }

  async createAttribute(accountId: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('attribute_definitions')
      .insert({
        account_id: accountId,
        key_name: payload.key_name,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async updateAttribute(accountId: string, id: string, payload: any) {
    const client = this.supabase.getClient();
    
    const { data: oldAttr } = await client.from('attribute_definitions').select('key_name').eq('id', id).eq('account_id', accountId).single();

    const { data, error } = await client
      .from('attribute_definitions')
      .update({
        key_name: payload.key_name,
      })
      .eq('id', id)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // If renamed, update contacts' JSONB
    if (oldAttr && oldAttr.key_name !== payload.key_name) {
      const { data: affected } = await client.from('contacts').select('id, attributes').eq('account_id', accountId).neq(`attributes->>${oldAttr.key_name}`, null);
      if (affected && affected.length > 0) {
        for (const c of affected) {
          const newAttrs = { ...c.attributes, [payload.key_name]: c.attributes[oldAttr.key_name] };
          delete newAttrs[oldAttr.key_name];
          await client.from('contacts').update({ attributes: newAttrs }).eq('id', c.id);
        }
      }
    }

    return data;
  }

  async deleteAttribute(accountId: string, id: string) {
    const client = this.supabase.getClient();
    
    const { data: oldAttr } = await client.from('attribute_definitions').select('key_name').eq('id', id).eq('account_id', accountId).single();

    const { error } = await client
      .from('attribute_definitions')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) throw new BadRequestException(error.message);

    // Remove from contacts' JSONB
    if (oldAttr) {
      const { data: affected } = await client.from('contacts').select('id, attributes').eq('account_id', accountId).neq(`attributes->>${oldAttr.key_name}`, null);
      if (affected && affected.length > 0) {
        for (const c of affected) {
          const newAttrs = { ...c.attributes };
          delete newAttrs[oldAttr.key_name];
          await client.from('contacts').update({ attributes: newAttrs }).eq('id', c.id);
        }
      }
    }

    return { success: true };
  }
}
