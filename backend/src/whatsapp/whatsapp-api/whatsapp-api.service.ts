import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';

@Injectable()
export class WhatsappApiService {
  private readonly logger = new Logger(WhatsappApiService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Retrieves the connected WabaAccount for the given accountId.
   * Throws an error if no active connection exists.
   */
  async getConnectedWabaAccount(accountId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('waba_accounts')
      .select('*')
      .eq('account_id', accountId)
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.access_token || !data.phone_number_id) {
      this.logger.warn(`WhatsApp API requested but no connection found for account: ${accountId}`);
      throw new BadRequestException('WhatsApp account is not connected or missing credentials. Please connect your account in Settings.');
    }

    return data;
  }

  /**
   * Send a template message to a recipient.
   */
  async sendTemplateMessage(
    accountId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components: any[] = []
  ) {
    const waba = await this.getConnectedWabaAccount(accountId);
    
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    return this.executeMetaApiRequest(waba.phone_number_id, waba.access_token, 'messages', payload);
  }

  /**
   * Submit a template for review to Meta.
   */
  async submitTemplate(
    accountId: string,
    templatePayload: any
  ) {
    const waba = await this.getConnectedWabaAccount(accountId);
    return this.executeMetaApiRequest(waba.waba_id, waba.access_token, 'message_templates', templatePayload);
  }

  /**
   * Delete a template from Meta.
   */
  async deleteTemplate(
    accountId: string,
    templateName: string
  ) {
    const waba = await this.getConnectedWabaAccount(accountId);
    const url = `https://graph.facebook.com/v21.0/${waba.waba_id}/message_templates?name=${templateName}`;
    return this.executeMetaApiRequestUrl(url, waba.access_token, 'DELETE');
  }

  /**
   * Generic method to call Meta Graph API.
   */
  private async executeMetaApiRequest(
    entityId: string,
    accessToken: string,
    endpoint: string,
    payload: any,
    method: string = 'POST'
  ) {
    const url = `https://graph.facebook.com/v21.0/${entityId}/${endpoint}`;
    return this.executeMetaApiRequestUrl(url, accessToken, method, payload);
  }

  private async executeMetaApiRequestUrl(
    url: string,
    accessToken: string,
    method: string,
    payload?: any
  ) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Meta API Error: ${JSON.stringify(data.error)}`);
        throw new BadRequestException(`Meta API Error: ${data.error?.message || 'Unknown error'}`);
      }

      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to reach Meta API: ${error.message}`);
      throw new BadRequestException(`Failed to reach Meta API: ${error.message}`);
    }
  }
}
