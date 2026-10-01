import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class ChatsService {
  private bulkJobs = new Map<string, any>();

  constructor(private readonly supabase: SupabaseService) {}

  async getConversations(accountId: string) {
    const client = this.supabase.getClient();
    // In a real app we'd join with contacts. Here we just fetch conversations.
    const { data, error } = await client
      .from('conversations')
      .select('*, contacts(name, whatsapp_number, country_code)')
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async getMessages(conversationId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async sendMessage(conversationId: string, payload: any) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('messages').insert({
      conversation_id: conversationId,
      direction: 'outbound',
      type: 'text',
      content: { text: payload.text },
      status: 'sent',
    }).select().single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Update conversation last_message_at
    await client.from('conversations').update({
      last_message_at: new Date().toISOString()
    }).eq('id', conversationId);

    return data;
  }

  async assignConversation(conversationId: string, agentId: string) {
    const client = this.supabase.getClient();
    // Assuming assigned_to exists as requested by the user
    // The user also requested dismissing the 'New Conversation waiting' banner,
    // which in a real app might mean updating status from 'new' to 'open'
    const { data, error } = await client.from('conversations').update({
      assigned_to: agentId,
      status: 'open'
    }).eq('id', conversationId).select().single();

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async startSingleChat(accountId: string, payload: { name: string, country_code: string, whatsapp_number: string }) {
    const client = this.supabase.getClient();
    let contactId = null;

    // 1. Find or create Contact
    const { data: existingContact } = await client
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('whatsapp_number', payload.whatsapp_number)
      .single();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact, error: contactErr } = await client.from('contacts').insert({
        account_id: accountId,
        name: payload.name,
        whatsapp_number: payload.whatsapp_number,
        country_code: payload.country_code,
        source: 'manual',
      }).select('id').single();
      if (contactErr) throw new BadRequestException(contactErr.message);
      contactId = newContact.id;
    }

    // 2. Find or create Conversation
    let conversationId = null;
    let requiresTemplate = true;

    const { data: existingConv } = await client
      .from('conversations')
      .select('id, last_message_at')
      .eq('account_id', accountId)
      .eq('contact_id', contactId)
      .in('status', ['open', 'snoozed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingConv) {
      conversationId = existingConv.id;
      if (existingConv.last_message_at) {
        const lastMsgTime = new Date(existingConv.last_message_at).getTime();
        const now = new Date().getTime();
        // 24 hours = 86400000 ms
        if (now - lastMsgTime < 86400000) {
          requiresTemplate = false;
        }
      }
    } else {
      const { data: newConv, error: convErr } = await client.from('conversations').insert({
        account_id: accountId,
        contact_id: contactId,
        status: 'open',
      }).select('id').single();
      if (convErr) throw new BadRequestException(convErr.message);
      conversationId = newConv.id;
    }

    return { conversation_id: conversationId, requires_template: requiresTemplate };
  }

  async startBulkChat(accountId: string, payload: { mode: string, template_id?: string, rows: any[] }) {
    if (!payload.rows || payload.rows.length === 0) throw new BadRequestException('No rows provided');
    
    // Quick template validation if send_template
    if (payload.mode === 'send_template') {
      if (!payload.template_id) throw new BadRequestException('template_id is required');
      // In a real app, query templates table to ensure status === 'APPROVED'
    }

    const jobId = 'job-' + Date.now();
    this.bulkJobs.set(jobId, { status: 'processing', processed: 0, total: payload.rows.length, result: { created: 0, sent: 0, failed: 0 } });
    
    // Async worker execution
    this.processBulkChat(accountId, jobId, payload).catch(err => console.error(err));
    
    return { job_id: jobId };
  }

  private async processBulkChat(accountId: string, jobId: string, payload: any) {
    const job = this.bulkJobs.get(jobId);
    const client = this.supabase.getClient();

    for (const row of payload.rows) {
      if (!row.whatsapp_number) {
        job.processed++;
        job.result.failed++;
        continue;
      }

      try {
        // Find or create Contact
        let contactId = null;
        const { data: existingContact } = await client
          .from('contacts')
          .select('id')
          .eq('account_id', accountId)
          .eq('whatsapp_number', row.whatsapp_number)
          .single();

        if (existingContact) {
          contactId = existingContact.id;
        } else {
          const { data: newContact } = await client.from('contacts').insert({
            account_id: accountId,
            name: row.name || 'Unnamed',
            whatsapp_number: row.whatsapp_number,
            country_code: row.country_code,
            source: 'csv_upload',
          }).select('id').single();
          contactId = newContact?.id;
        }

        if (!contactId) throw new Error('Failed to create/find contact');

        // Find or create Conversation
        let conversationId = null;
        const { data: existingConv } = await client
          .from('conversations')
          .select('id')
          .eq('account_id', accountId)
          .eq('contact_id', contactId)
          .in('status', ['open', 'snoozed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          const { data: newConv } = await client.from('conversations').insert({
            account_id: accountId,
            contact_id: contactId,
            status: 'open',
          }).select('id').single();
          conversationId = newConv?.id;
          job.result.created++;
        }

        // Send Message if needed
        if (payload.mode === 'send_template' && conversationId) {
          // Send via WhatsApp API mock
          await client.from('messages').insert({
            conversation_id: conversationId,
            direction: 'outbound',
            type: 'template',
            content: { template_id: payload.template_id },
            status: 'sent',
          });
          
          await client.from('conversations').update({
            last_message_at: new Date().toISOString()
          }).eq('id', conversationId);
          
          job.result.sent++;
        }
      } catch (e) {
        job.result.failed++;
      }

      job.processed++;
    }

    job.status = 'completed';
    this.bulkJobs.set(jobId, job);
  }

  getBulkJobProgress(jobId: string) {
    const job = this.bulkJobs.get(jobId);
    if (!job) throw new BadRequestException('Job not found');
    return job;
  }
}
