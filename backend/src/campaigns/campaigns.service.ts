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

    let components: any[] = [];
    try {
      components = await this.buildTemplateComponents(
        accountId,
        templateName,
        payload.paramValues,
      );
    } catch (err: any) {
      this.logger.warn(`Could not prebuild components for ${templateName}: ${err?.message}`);
    }

    let delivered = 0;
    let failed = 0;
    for (const r of recipients) {
      const phone = String(r?.phone || '').replace(/\D/g, '');
      if (!phone) {
        failed++;
        continue;
      }
      try {
        await this.whatsappApi.sendTemplateMessage(accountId, phone, templateName, language, components);
        delivered++;
      } catch (err: any) {
        failed++;
        this.logger.warn(`Campaign ${campaignId}: send to ${phone} failed: ${err?.message}`);
      }
    }

    const status = delivered > 0 ? 'Completed' : 'Failed';
    await client.from('campaigns').update({ delivered, failed, status }).eq('id', campaignId);
    this.logger.log(`Campaign ${campaignId} dispatched: ${delivered} delivered, ${failed} failed.`);
  }

  /**
   * Builds Meta template components (media header + {{param}} body values) from
   * the template synced in our DB, mirroring the test-send path so any
   * approved template — with or without variables/media — can be broadcast.
   */
  private async buildTemplateComponents(
    accountId: string,
    templateName: string,
    paramValues?: string[],
  ): Promise<any[]> {
    const client = this.supabase.getClient();
    const { data } = await client
      .from('templates')
      .select('body, header_type, header_content, template_variables(*)')
      .eq('account_id', accountId)
      .eq('name', templateName)
      .maybeSingle();
    const tmplRow: any = data;
    const components: any[] = [];

    const headerType = String(tmplRow?.header_type || 'NONE').toUpperCase();
    const headerLink = String(tmplRow?.header_content || '');
    const mediaParamMap: Record<string, string> = { IMAGE: 'image', VIDEO: 'video', DOCUMENT: 'document' };
    const mediaType = mediaParamMap[headerType];
    if (mediaType && /^https?:\/\//i.test(headerLink)) {
      components.push({ type: 'header', parameters: [{ type: mediaType, [mediaType]: { link: headerLink } }] });
    }

    const needed = (String(tmplRow?.body || '').match(/\{\{\d+\}\}/g) || []).length;
    if (needed > 0) {
      const vars = [...(tmplRow?.template_variables || [])].sort(
        (a: any, b: any) => a.position - b.position,
      );
      const provided: string[] = Array.isArray(paramValues) ? paramValues : [];
      const bodyParameters = Array.from({ length: needed }, (_unused, i) => ({
        type: 'text',
        text: String(provided[i] || vars[i]?.sample_value || `value ${i + 1}`),
      }));
      components.push({ type: 'body', parameters: bodyParameters });
    }

    return components;
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
