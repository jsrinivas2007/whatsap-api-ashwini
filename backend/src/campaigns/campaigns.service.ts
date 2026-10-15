import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { WhatsappApiService } from '../whatsapp/whatsapp-api/whatsapp-api.service.js';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  constructor(
    private readonly supabase: SupabaseService,
    private readonly whatsappApi: WhatsappApiService,
  ) {}

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

    // A "Processing" campaign is a launch-now broadcast: actually dispatch the
    // template to each recipient in the background (fire-and-forget) so the API
    // responds instantly and the row later settles to Completed/Failed.
    const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
    if (data && payload.status === 'Processing' && recipients.length > 0) {
      this.dispatchCampaign(accountId, data.id, payload, recipients).catch((err) =>
        this.logger.error(`Campaign ${data.id} dispatch failed: ${err?.message || err}`),
      );
    }

    return data;
  }

  /**
   * Sends the campaign template to every recipient, tallies the results, and
   * writes the final status back to the campaigns row.
   */
  private async dispatchCampaign(
    accountId: string,
    campaignId: string,
    payload: any,
    recipients: any[],
  ) {
    const client = this.supabase.getClient();
    const templateName = payload.template;
    const language = payload.templateLanguage || 'en_US';

    let built: { components: any[]; preview: string } = {
      components: [],
      preview: `Template "${templateName}"`,
    };
    try {
      built = await this.buildTemplateComponents(
        accountId,
        templateName,
        language,
        payload.paramValues,
      );
    } catch (err: any) {
      this.logger.warn(`Could not prebuild components for ${templateName}: ${err?.message}`);
    }

    let delivered = 0;
    let failed = 0;
    this.logger.log(
      `[campaign ${campaignId}] START template="${templateName}" lang="${language}" ` +
        `recipients=${recipients.length} components=${JSON.stringify(built.components)}`,
    );
    for (const r of recipients) {
      const phone = String(r?.phone || '').replace(/\D/g, '');
      if (!phone) {
        failed++;
        this.logger.warn(`[campaign ${campaignId}] SKIP blank phone for recipient ${JSON.stringify(r)}`);
        continue;
      }
      try {
        const result: any = await this.whatsappApi.sendTemplateMessage(
          accountId,
          phone,
          templateName,
          language,
          built.components,
        );
        delivered++;
        const waId = result?.messages?.[0]?.id || null;
        // Meta can answer HTTP 200 with per-message warnings even when the
        // message will not actually be delivered, so log the full response.
        this.logger.log(
          `[campaign ${campaignId}] SENT to ${phone} -> ${waId || 'no-id'} ` +
            `metaResponse=${JSON.stringify(result)}`,
        );
        await this.logCampaignMessage(client, accountId, phone, r?.name, templateName, built.preview, waId);
      } catch (err: any) {
        failed++;
        this.logger.warn(`Campaign ${campaignId}: send to ${phone} failed: ${err?.message}`);
      }
    }

    const status = delivered > 0 ? 'Completed' : 'Failed';
    await client.from('campaigns').update({ delivered, failed, status }).eq('id', campaignId);
    this.logger.log(`Campaign ${campaignId} dispatched: ${delivered} sent, ${failed} failed.`);
  }

  /**
   * Records the broadcast message so it appears in the Chats UI and the Meta
   * delivery-status webhook can later flip it sent -> delivered -> read. Never
   * fatal: a logging failure must not stop the rest of the campaign.
   */
  private async logCampaignMessage(
    client: any,
    accountId: string,
    phone: string,
    name: string | undefined,
    templateName: string,
    preview: string,
    waId: string | null,
  ) {
    try {
      const { data: existing } = await client
        .from('contacts')
        .select('id')
        .eq('account_id', accountId)
        .eq('whatsapp_number', phone)
        .maybeSingle();
      let contactId = existing?.id || null;
      if (!contactId) {
        const { data: nc } = await client
          .from('contacts')
          .insert({ account_id: accountId, name: name || 'Campaign Recipient', whatsapp_number: phone, source: 'campaign' })
          .select('id')
          .single();
        contactId = nc?.id || null;
      }
      if (!contactId) return;

      const { data: conv } = await client
        .from('conversations')
        .select('id')
        .eq('account_id', accountId)
        .eq('contact_id', contactId)
        .in('status', ['open', 'snoozed'])
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      let conversationId = conv?.id || null;
      if (!conversationId) {
        const { data: nconv } = await client
          .from('conversations')
          .insert({ account_id: accountId, contact_id: contactId, status: 'open', last_message_at: new Date().toISOString() })
          .select('id')
          .single();
        conversationId = nconv?.id || null;
      }
      if (!conversationId) return;

      await client.from('messages').insert({
        conversation_id: conversationId,
        direction: 'outbound',
        type: 'template',
        content: { text: preview, template_name: templateName },
        status: 'sent',
        message_id: waId,
        wa_message_id: waId,
      });
    } catch (err: any) {
      this.logger.warn(`Campaign message logging failed for ${phone}: ${err?.message}`);
    }
  }

  /**
   * Builds Meta template components (media header + {{param}} body values) from
   * the template synced in our DB, mirroring the proven test-send path exactly.
   *
   * Crucially, for a static (handle-based) media header we re-read the LIVE
   * handle from Meta. A baked-in template image is NOT sent as a header
   * component (the handle is not an http link), because sending the stored,
   * expiring CDN link makes Meta accept the call but silently fail delivery.
   */
  private async buildTemplateComponents(
    accountId: string,
    templateName: string,
    language: string,
    paramValues?: string[],
  ): Promise<{ components: any[]; preview: string }> {
    const client = this.supabase.getClient();
    const { data: waba } = await client
      .from('waba_accounts')
      .select('waba_id, access_token')
      .eq('account_id', accountId)
      .maybeSingle();
    const { data } = await client
      .from('templates')
      .select('body, header_type, header_content, template_variables(*)')
      .eq('account_id', accountId)
      .eq('name', templateName)
      .maybeSingle();
    const tmplRow: any = data;
    const components: any[] = [];

    const headerType = String(tmplRow?.header_type || 'NONE').toUpperCase();
    let headerLink = String(tmplRow?.header_content || '');
    const mediaParamMap: Record<string, string> = { IMAGE: 'image', VIDEO: 'video', DOCUMENT: 'document' };
    const mediaType = mediaParamMap[headerType];
    if (mediaType && waba?.access_token && waba?.waba_id) {
      try {
        const metaTmpls: any = await fetch(
          `https://graph.facebook.com/v21.0/${waba.waba_id}/message_templates?limit=100&access_token=${waba.access_token}`,
        ).then((r) => r.json());
        const live = (metaTmpls.data || []).find(
          (x: any) => x.name === templateName && (x.language === language || !language),
        );
        const liveHandle = live?.components?.find((c: any) => c.type === 'HEADER')?.example?.header_handle?.[0];
        if (liveHandle) headerLink = String(liveHandle);
      } catch {
        // keep stored value
      }
    }
    if (mediaType && /^https?:\/\//i.test(headerLink)) {
      components.push({ type: 'header', parameters: [{ type: mediaType, [mediaType]: { link: headerLink } }] });
    }
    this.logger.log(
      `[campaign build] template="${templateName}" headerType=${headerType} ` +
        `sentHeaderComponent=${components.some((c) => c.type === 'header')} ` +
        `headerLinkIsHttp=${/^https?:\/\//i.test(headerLink)}`,
    );

    const needed = (String(tmplRow?.body || '').match(/\{\{\d+\}\}/g) || []).length;
    let bodyParameters: { type: string; text: string }[] = [];
    if (needed > 0) {
      const vars = [...(tmplRow?.template_variables || [])].sort(
        (a: any, b: any) => a.position - b.position,
      );
      const provided: string[] = Array.isArray(paramValues) ? paramValues : [];
      bodyParameters = Array.from({ length: needed }, (_unused, i) => ({
        type: 'text',
        text: String(provided[i] || vars[i]?.sample_value || `value ${i + 1}`),
      }));
      components.push({ type: 'body', parameters: bodyParameters });
    }

    const preview =
      String(tmplRow?.body || '')
        .replace(/\{\{(\d+)\}\}/g, (_m, d) => bodyParameters[Number(d) - 1]?.text ?? _m)
        .trim() || `Template "${templateName}"`;

    return { components, preview };
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
