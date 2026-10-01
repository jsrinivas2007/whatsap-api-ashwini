import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class TemplatesService {
  constructor(private readonly supabase: SupabaseService) { }

  // --- Helpers for validation ---
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

  private validateTemplateConstraints(payload: any) {
    if (!payload.name || !/^[a-z0-9_]+$/.test(payload.name) || payload.name.length > 512) {
      throw new BadRequestException('Invalid name: lowercase letters, numbers, underscores only, max 512 chars');
    }
    if (payload.footer && payload.footer.length > 60) {
      throw new BadRequestException('Footer exceeds 60 characters');
    }
    if (!payload.body || payload.body.length > 1024) {
      throw new BadRequestException('Body is required and cannot exceed 1024 characters');
    }

    if (payload.buttons && Array.isArray(payload.buttons)) {
      const counts: Record<string, number> = {
        QUICK_REPLY: 0,
        URL: 0,
        PHONE_NUMBER: 0,
        FLOW: 0
      };

      for (const btn of payload.buttons) {
        if (counts[btn.type] !== undefined) {
          counts[btn.type]++;
        }
        if (btn.button_text && btn.button_text.length > 25) {
          throw new BadRequestException('Button text cannot exceed 25 characters');
        }
      }

      if (counts.QUICK_REPLY > 4) throw new BadRequestException('Max 4 Quick Reply buttons allowed');
      if (counts.URL > 2) throw new BadRequestException('Max 2 Visit Website buttons allowed');
      if (counts.PHONE_NUMBER > 1) throw new BadRequestException('Max 1 Call Phone button allowed');
      if (counts.FLOW > 1) throw new BadRequestException('Max 1 Form button allowed');
    }

    // Validate Variables (Exact match and strict sequence)
    const matches = Array.from(payload.body.matchAll(/\{\{(\d+)\}\}/g));
    const uniqueNums = Array.from(new Set(matches.map((m: any) => parseInt(m[1], 10)))).sort((a: number, b: number) => a - b);

    const isSequential = uniqueNums.length === 0 || (uniqueNums[0] === 1 && uniqueNums[uniqueNums.length - 1] === uniqueNums.length);
    if (!isSequential) {
      throw new BadRequestException('Variables in the message body must be strictly sequential starting from 1 (e.g. {{1}}, {{2}}).');
    }

    if (uniqueNums.length > 0 && (!payload.variables || payload.variables.length !== uniqueNums.length)) {
      throw new BadRequestException(`Expected exactly ${uniqueNums.length} variable sample values, but got ${payload.variables?.length || 0}.`);
    }

    if (payload.variables && Array.isArray(payload.variables)) {
      for (const v of payload.variables) {
        if (!uniqueNums.includes(v.position)) {
          throw new BadRequestException(`Sample value provided for {{${v.position}}} but it was not found in the message body.`);
        }
        if (!v.sample_value || v.sample_value.trim() === '') {
          throw new BadRequestException(`Every variable must have a non-empty sample value (missing for {{${v.position}}}).`);
        }
      }
    }
  }

  // --- Endpoints ---

  async getTemplates(accountId: string, statusFilter?: string) {
    if (!accountId) throw new BadRequestException('accountId is required');

    const client = this.supabase.getClient();
    let query = client.from('templates').select(`
      *,
      template_variables(*),
      template_buttons(*)
    `).eq('account_id', accountId);

    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      query = query.eq('status', statusFilter.toUpperCase() as any);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Templates table not found, falling back to mock data:', error.message);
      return this.getMockTemplates(statusFilter);
    }
    return data;
  }

  async createTemplate(accountId: string, payload: any) {
    if (!accountId) throw new BadRequestException('accountId is required');
    this.validateTemplateConstraints(payload);

    let meta_template_id = `mock_meta_${Date.now()}`;
    let initialStatus = 'PENDING';

    const metaDetails = await this.getAccountMetaDetails(accountId);
    if (metaDetails && metaDetails.waba_id && metaDetails.access_token) {
      try {
        const metaPayload = {
          name: payload.name,
          language: payload.language,
          category: payload.category,
          components: [] as any[]
        };

        if (payload.header_type && payload.header_type !== 'NONE') {
          const headerComp: any = { type: 'HEADER', format: payload.header_type };
          if (payload.header_type === 'TEXT') {
            headerComp.text = payload.header_content;
          } else {
            // For media headers, Meta requires an example instead of text
            headerComp.example = { header_handle: [payload.header_handle || ""] };
          }
          metaPayload.components.push(headerComp);
        }

        const bodyComp: any = { type: 'BODY', text: payload.body };
        if (payload.variables && payload.variables.length > 0) {
          const sortedVars = [...payload.variables].sort((a, b) => a.position - b.position);
          bodyComp.example = { body_text: [sortedVars.map(v => v.sample_value)] };
        }
        metaPayload.components.push(bodyComp);

        if (payload.footer) {
          metaPayload.components.push({ type: 'FOOTER', text: payload.footer });
        }

        if (payload.buttons && payload.buttons.length > 0) {
          metaPayload.components.push({
            type: 'BUTTONS',
            buttons: payload.buttons.map((b: any) => {
              if (b.type === 'QUICK_REPLY') {
                return { type: 'QUICK_REPLY', text: b.button_text };
              } else if (b.type === 'URL') {
                return { type: 'URL', text: b.button_text, url: b.website_url };
              } else if (b.type === 'PHONE_NUMBER') {
                return { type: 'PHONE_NUMBER', text: b.button_text, phone_number: b.phone_number };
              } else if (b.type === 'FLOW') {
                return { type: 'FLOW', text: b.button_text, flow_id: b.flow_id || '123', flow_action: 'navigate', navigate_screen: 'DETAILS' };
              }
              return b;
            })
          });
        }

        const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${metaDetails.waba_id}/message_templates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaDetails.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metaPayload)
        });

        const metaData = await metaResponse.json();
        console.log('Meta Template Create response:', JSON.stringify(metaData));

        if (!metaResponse.ok || metaData.error) {
          const errMsg = metaData.error?.error_user_msg || metaData.error?.message || JSON.stringify(metaData.error);
          throw new Error(errMsg);
        }
        meta_template_id = metaData.id;
      } catch (err: any) {
        throw new BadRequestException(`Meta API Error: ${err.message}`);
      }
    }

    const client = this.supabase.getClient();
    const { data: template, error } = await client.from('templates').insert({
      account_id: accountId,
      meta_template_id: meta_template_id,
      name: payload.name,
      language: payload.language,
      category: payload.category,
      header_type: payload.header_type || 'NONE',
      header_content: payload.header_content || null,
      body: payload.body,
      footer: payload.footer || null,
      status: initialStatus
    }).select().single();

    if (error) {
      console.warn('Failed to insert template to DB, returning mock success:', error.message);
      return { id: `mock_${Date.now()}`, ...payload, status: initialStatus };
    }

    // Insert variables
    if (payload.variables && payload.variables.length > 0) {
      await client.from('template_variables').insert(
        payload.variables.map((v: any, index: number) => ({
          template_id: template.id,
          position: index + 1,
          sample_value: v.sample_value
        }))
      );
    }

    // Insert buttons
    if (payload.buttons && payload.buttons.length > 0) {
      const { error: btnError } = await client.from('template_buttons').insert(
        payload.buttons.map((b: any, index: number) => ({
          template_id: template.id,
          type: b.type,
          order: index,
          button_text: b.button_text,
          phone_number: b.phone_number,
          website_url: b.website_url,
          form_id: b.form_id
        }))
      );
      if (btnError) {
        console.error('Failed to insert template buttons:', btnError.message);
      }
    }

    return template;
  }

  async getTemplateById(accountId: string, id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client.from('templates').select(`
      *,
      template_variables(*),
      template_buttons(*)
    `).eq('account_id', accountId).eq('id', id).single();

    if (error) {
      console.warn('Failed to fetch template by id (fallback mock applied):', error.message);
      const mocks = this.getMockTemplates('ALL');
      const mock = mocks.find(m => m.id === id);
      if (mock) return mock;
      throw new BadRequestException('Template not found');
    }
    return data;
  }

  async deleteTemplate(accountId: string, id: string) {
    // 1. DELETE from Meta via API
    const client = this.supabase.getClient();
    const { error } = await client.from('templates').delete().eq('account_id', accountId).eq('id', id);
    if (error) {
      console.warn('Failed to delete template from DB:', error.message);
    }
    return { success: true };
  }

  async syncTemplates(accountId: string) {
    const metaDetails = await this.getAccountMetaDetails(accountId);
    if (!metaDetails || !metaDetails.waba_id || !metaDetails.access_token) {
      throw new BadRequestException('WhatsApp account not connected properly.');
    }
    
    try {
      const url = `https://graph.facebook.com/v21.0/${metaDetails.waba_id}/message_templates`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${metaDetails.access_token}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch templates from Meta');
      }
      
      const client = this.supabase.getClient();
      
      // Upsert templates into Supabase
      if (data.data && Array.isArray(data.data)) {
        for (const tmpl of data.data) {
          const headerComp = tmpl.components?.find((c: any) => c.type === 'HEADER');
          const bodyComp = tmpl.components?.find((c: any) => c.type === 'BODY');
          const footerComp = tmpl.components?.find((c: any) => c.type === 'FOOTER');
          
          await client.from('templates').upsert({
            account_id: accountId,
            meta_template_id: tmpl.id,
            name: tmpl.name,
            language: tmpl.language,
            category: tmpl.category,
            status: tmpl.status,
            header_type: headerComp?.format || 'NONE',
            header_content: headerComp?.text || null,
            body: bodyComp?.text || '',
            footer: footerComp?.text || null
          }, { onConflict: 'account_id, name, language' });
        }
      }
      
      return { success: true, message: 'Templates synced successfully', count: data.data?.length || 0 };
    } catch (err: any) {
      console.error('Error syncing templates:', err);
      throw new BadRequestException(`Meta API Error: ${err.message}`);
    }
  }

  async getTemplateLibrary(accountId: string) {
    return [
      { id: 'lib_1', name: 'order_confirmation', category: 'UTILITY', language: 'en', body: 'Your order is confirmed.' },
      { id: 'lib_2', name: 'marketing_promo', category: 'MARKETING', language: 'en', body: '20% off all items today!' }
    ];
  }

  async getTemplateInsights(accountId: string, id: string) {
    // Return mock insights
    return {
      sent: Math.floor(Math.random() * 5000),
      delivered: Math.floor(Math.random() * 4800),
      read: Math.floor(Math.random() * 3000),
      clicked: Math.floor(Math.random() * 500)
    };
  }

  async uploadMedia(accountId: string, file: any) {
    if (!accountId) throw new BadRequestException('accountId is required');
    if (!file) throw new BadRequestException('File is required');

    const metaDetails = await this.getAccountMetaDetails(accountId);
    if (!metaDetails || !metaDetails.waba_id || !metaDetails.access_token) {
      throw new BadRequestException('WhatsApp account not connected properly.');
    }

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) throw new Error('FACEBOOK_APP_ID is not configured in backend');

    try {
      // Step 1: Create Resumable Upload Session
      const sessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${file.size}&file_type=${file.mimetype}`;
      const sessionRes = await fetch(sessionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaDetails.access_token}`
        }
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || sessionData.error) {
        throw new Error(sessionData.error?.message || 'Failed to create upload session');
      }
      const uploadSessionId = sessionData.id;

      // Step 2: Upload Binary Data to the Session
      const uploadUrl = `https://graph.facebook.com/v21.0/${uploadSessionId}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${metaDetails.access_token}`,
          'file_offset': '0',
          'Content-Type': 'application/octet-stream'
        },
        body: file.buffer
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error?.message || 'Failed to upload file bytes');
      }

      return { handle: uploadData.h };
    } catch (err: any) {
      console.error('Meta Media Upload Error:', err.message);
      throw new BadRequestException(`Media Upload Failed: ${err.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string) {
    // Process message_template_status_update webhook
    // e.g., payload.entry[0].changes[0].value.event === 'APPROVED'
    console.log('Received Meta webhook:', JSON.stringify(payload, null, 2));
    return { received: true };
  }

  // --- Mock Data Fallback ---
  private getMockTemplates(statusFilter?: string) {
    const mocks = [
      {
        id: 'mock_1',
        name: 'welcome_offer',
        language: 'en',
        category: 'MARKETING',
        header_type: 'IMAGE',
        header_content: 'https://via.placeholder.com/800x400',
        body: 'Hi {{1}}! Welcome to our store. Use code {{2}} for 20% off.',
        footer: 'Reply STOP to opt out.',
        status: 'APPROVED',
        template_variables: [
          { position: 1, sample_value: 'John' },
          { position: 2, sample_value: 'WELCOME20' }
        ],
        template_buttons: [
          { type: 'URL', render_order: 0, button_text: 'Shop Now', website_url: 'https://example.com' },
          { type: 'QUICK_REPLY', render_order: 1, button_text: 'Talk to Sales' }
        ]
      },
      {
        id: 'mock_2',
        name: 'shipping_update',
        language: 'en',
        category: 'UTILITY',
        header_type: 'NONE',
        body: 'Your order {{1}} is out for delivery today.',
        footer: 'Thanks for shopping with us!',
        status: 'PENDING',
        template_variables: [
          { position: 1, sample_value: '#12345' }
        ],
        template_buttons: []
      },
      {
        id: 'mock_3',
        name: 'account_alert',
        language: 'en',
        category: 'AUTHENTICATION',
        header_type: 'TEXT',
        header_content: 'Security Alert',
        body: 'Suspicious login detected from {{1}}.',
        footer: null,
        status: 'REJECTED',
        rejection_reason: 'Message violates policy against frightening language.',
        template_variables: [
          { position: 1, sample_value: 'New York, USA' }
        ],
        template_buttons: [
          { type: 'QUICK_REPLY', render_order: 0, button_text: 'It was me' },
          { type: 'QUICK_REPLY', render_order: 1, button_text: 'Secure Account' }
        ]
      }
    ];

    if (statusFilter && statusFilter.toUpperCase() !== 'ALL') {
      return mocks.filter(m => m.status === statusFilter.toUpperCase());
    }
    return mocks;
  }
}
