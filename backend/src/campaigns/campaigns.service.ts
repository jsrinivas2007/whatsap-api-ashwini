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

    let built: { components: any[]; preview: string; category: string } = {
      components: [],
      preview: `Template "${templateName}"`,
      category: 'UTILITY',
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
    // Meta paces MARKETING templates per recipient (roughly 1 per rolling 7
    // days, shared across ALL businesses). Extra sends are accepted by the API
    // and then silently dropped by WhatsApp — the campaign would report
    // "Completed" while nobody's phone ever rang. Check our own send history
    // first and skip + explain instead of lying.
    let marketingNames: string[] | null = null;
    if (built.category === 'MARKETING') {
      const { data: mkt } = await client
        .from('templates')
        .select('name')
        .eq('account_id', accountId)
        .eq('category', 'MARKETING');
      marketingNames = (mkt || []).map((t: any) => t.name);
    }
    this.logger.log(
      `[campaign ${campaignId}] START template="${templateName}" lang="${language}" ` +
        `category=${built.category} recipients=${recipients.length} components=${JSON.stringify(built.components)}`,
    );
    for (const r of recipients) {
      const phone = String(r?.phone || '').replace(/\D/g, '');
      if (!phone) {
        failed++;
        this.logger.warn(`[campaign ${campaignId}] SKIP blank phone for recipient ${JSON.stringify(r)}`);
        continue;
      }
      if (marketingNames) {
        const recent = await this.recentMarketingSends(client, accountId, phone, marketingNames);
        if (recent > 0) {
          failed++;
          this.logger.warn(
            `[campaign ${campaignId}] SKIP ${phone}: already received ${recent} MARKETING template(s) in the ` +
              `last 7 days — Meta would silently drop this send (per-user marketing pacing limit).`,
          );
          continue;
        }
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
   * Counts outbound MARKETING template messages we already logged for this
   * phone in the rolling 7-day pacing window (contacts -> conversations ->
   * messages). Never fatal: on any lookup failure we return 0 and let the
   * send through.
   */
  private async recentMarketingSends(
    client: any,
    accountId: string,
    phone: string,
    marketingNames: string[],
  ): Promise<number> {
    try {
      const { data: contact } = await client
        .from('contacts')
        .select('id')
        .eq('account_id', accountId)
        .eq('whatsapp_number', phone)
        .maybeSingle();
      if (!contact?.id) return 0;
      const { data: convs } = await client
        .from('conversations')
        .select('id')
        .eq('account_id', accountId)
        .eq('contact_id', contact.id);
      const convIds = (convs || []).map((c: any) => c.id);
      if (!convIds.length) return 0;
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: msgs } = await client
        .from('messages')
        .select('id, content, created_at')
        .in('conversation_id', convIds)
        .eq('direction', 'outbound')
        .eq('type', 'template')
        .gte('created_at', since);
      return (msgs || []).filter((m: any) => marketingNames.includes(m?.content?.template_name)).length;
    } catch {
      return 0;
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
  ): Promise<{ components: any[]; preview: string; category: string }> {
    const client = this.supabase.getClient();
    const { data: waba } = await client
      .from('waba_accounts')
      .select('waba_id, access_token, phone_number_id')
      .eq('account_id', accountId)
      .maybeSingle();
    const { data } = await client
      .from('templates')
      .select('body, header_type, header_content, category, template_variables(*)')
      .eq('account_id', accountId)
      .eq('name', templateName)
      .maybeSingle();
    const tmplRow: any = data;
    const category = String(tmplRow?.category || 'UTILITY').toUpperCase();
    const components: any[] = [];

    // Media header (IMAGE/VIDEO/DOCUMENT): Meta REQUIRES a header parameter at
    // send time for these templates — omitting it returns #132012
    // "expected IMAGE, received UNKNOWN". The media must be passed as an http
    // LINK (image:{link}) — NOT image:{id}, which only accepts a numeric media
    // upload ID and returns #100 for a URL. Crucially the link must be FRESH:
    // the scontent CDN link stored in our DB expires (oe= epoch param), so Meta
    // accepts the send but silently fails delivery ("Completed but not
    // received"). We therefore re-read the live example header_handle URL from
    // Meta at send time, mirroring the proven test-send path exactly.
    const headerType = String(tmplRow?.header_type || 'NONE').toUpperCase();
    const mediaParamMap: Record<string, string> = { IMAGE: 'image', VIDEO: 'video', DOCUMENT: 'document' };
    const mediaType = mediaParamMap[headerType];
    let headerVia = 'none';
    let headerAs = 'none';
    if (mediaType) {
      let headerLink = String(tmplRow?.header_content || '');
      if (waba?.access_token && waba?.waba_id) {
        try {
          const metaTmpls: any = await fetch(
            `https://graph.facebook.com/v21.0/${waba.waba_id}/message_templates?limit=250&access_token=${waba.access_token}`,
          ).then((r) => r.json());
          const list: any[] = metaTmpls.data || [];
          // Match name+language first, but fall back to name-only: the UI can
          // send "en_US" while Meta stores "en", and a missed lookup would
          // silently degrade to the stale stored link (accept-but-drop).
          const live =
            list.find(
              (x: any) =>
                x.name === templateName &&
                String(x.language).toLowerCase() === String(language).toLowerCase(),
            ) || list.find((x: any) => x.name === templateName);
          const hdr = live?.components?.find((c: any) => c.type === 'HEADER');
          const handle = hdr?.example?.header_handle?.[0];
          const urlField = hdr?.example?.header_url;
          const url = Array.isArray(urlField) ? urlField[0] : (urlField || '');
          if (/^https?:\/\//i.test(String(handle || ''))) headerLink = String(handle);
          else if (/^https?:\/\//i.test(String(url || ''))) headerLink = String(url);
          headerVia = 'live';
        } catch {
          headerVia = 'stored';
        }
      } else {
        headerVia = 'stored';
      }
      if (/^https?:\/\//i.test(headerLink)) {
        // Most robust: upload the media to Meta once and send image:{id} —
        // Meta then hosts the asset itself, so there is no expiring CDN link
        // that can be accepted-but-dropped. Falls back to the fresh {link}.
        let mediaId: string | null = null;
        if (waba?.phone_number_id && waba?.access_token) {
          mediaId = await this.uploadHeaderMedia(
            waba.phone_number_id, waba.access_token, headerLink, headerType,
          );
        }
        if (mediaId) {
          headerAs = 'id';
          components.push({ type: 'header', parameters: [{ type: mediaType, [mediaType]: { id: mediaId } }] });
        } else {
          headerAs = 'link';
          components.push({ type: 'header', parameters: [{ type: mediaType, [mediaType]: { link: headerLink } }] });
        }
      }
    }
    this.logger.log(
      `[campaign build] template="${templateName}" category=${category} headerType=${headerType} ` +
        `headerSent=${components.some((c) => c.type === 'header')} headerVia=${headerVia} headerAs=${headerAs}`,
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

    return { components, preview, category };
  }

  /**
   * Downloads the (expiring) Meta CDN header image and re-uploads it to the
   * phone_number_id /media edge so the template can reference a durable media
   * ID instead of a URL Meta must fetch at delivery time. Returns null on any
   * failure so the caller can fall back to sending the link directly.
   */
  private async uploadHeaderMedia(
    phoneNumberId: string,
    accessToken: string,
    link: string,
    headerType: string,
  ): Promise<string | null> {
    try {
      const dl = await fetch(link);
      if (!dl.ok) {
        this.logger.warn(`Header media download failed: HTTP ${dl.status}`);
        return null;
      }
      const buf = await dl.arrayBuffer();
      const guessMime: Record<string, string> = { IMAGE: 'image/png', VIDEO: 'video/mp4', DOCUMENT: 'application/pdf' };
      let mime = String(dl.headers.get('content-type') || '').split(';')[0];
      if (!mime || mime === 'application/octet-stream') mime = guessMime[headerType] || 'image/png';
      const extMap: Record<string, string> = {
        'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'jpg',
        'video/mp4': 'mp4', 'application/pdf': 'pdf',
      };
      const ext = extMap[mime] || (headerType === 'VIDEO' ? 'mp4' : headerType === 'DOCUMENT' ? 'pdf' : 'png');
      if (mime === 'image/webp') mime = 'image/jpeg'; // Meta rejects webp
      const form = new FormData();
      form.append('messaging_product', 'whatsapp');
      form.append('file', new Blob([buf], { type: mime }), `campaign_header.${ext}`);
      const up = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const json: any = await up.json().catch(() => ({}));
      if (!up.ok || !json?.id) {
        this.logger.warn(`Meta /media upload rejected: HTTP ${up.status} ${JSON.stringify(json?.error || json).slice(0, 200)}`);
        return null;
      }
      return String(json.id);
    } catch (err: any) {
      this.logger.warn(`Meta /media upload threw: ${err?.message}`);
      return null;
    }
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
