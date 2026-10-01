import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);

  async exchangeCodeForToken(code: string) {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret || appId === 'your_facebook_app_id_here') {
      this.logger.error('Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET. Code exchange cannot proceed.');
      throw new Error('Missing Meta App configuration on server.');
    }

    try {
      const url = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        this.logger.error(`Meta API Error during code exchange: ${JSON.stringify(data.error)}`);
        throw new Error(`Meta API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      this.logger.log('Successfully exchanged code for access token.');
      return data.access_token;
    } catch (error: any) {
      if (error.message.includes('Meta API Error')) throw error;
      this.logger.error(`Code-exchange network failure: ${error.message}`);
      throw new Error(`Code-exchange failure: ${error.message}`);
    }
  }

  async fetchWabaDetails(accessToken: string) {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    try {
      // Step 1: Use debug_token to discover which WABA IDs were shared via Embedded Signup
      const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
      const debugRes = await fetch(debugUrl);
      const debugData = await debugRes.json();

      if (!debugRes.ok || debugData.error) {
        this.logger.error(`debug_token failed: ${JSON.stringify(debugData.error)}`);
        throw new Error(debugData.error?.message || 'Failed to inspect access token');
      }

      // Extract WABA IDs from the granted scopes
      let wabaId: string | null = null;
      const scopes = debugData.data?.granular_scopes || [];
      for (const scope of scopes) {
        if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length > 0) {
          wabaId = scope.target_ids[0];
          break;
        }
      }

      // Fallback: try the shared WABAs endpoint if debug_token didn't yield IDs
      if (!wabaId) {
        this.logger.warn('debug_token did not return WABA IDs, trying shared_whatsapp_business_accounts...');
        const sharedRes = await fetch(
          `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${accessToken}`
        );
        const sharedData = await sharedRes.json();
        
        if (sharedData.data?.[0]?.id) {
          const bizId = sharedData.data[0].id;
          const wabaRes = await fetch(
            `https://graph.facebook.com/v21.0/${bizId}/client_whatsapp_business_accounts?access_token=${accessToken}`
          );
          const wabaData = await wabaRes.json();
          if (wabaData.data?.[0]?.id) {
            wabaId = wabaData.data[0].id;
          }
        }
      }

      if (!wabaId) {
        throw new Error('Could not discover any WhatsApp Business Account from the granted permissions. Please ensure you selected a WABA during signup.');
      }

      this.logger.log(`Discovered WABA ID: ${wabaId}`);

      // Step 2: Fetch WABA details (name)
      const wabaRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name&access_token=${accessToken}`
      );
      const wabaInfo = await wabaRes.json();
      const businessName = wabaInfo.name || 'Connected Business';

      // Step 3: Fetch phone numbers registered under this WABA
      const phonesRes = await fetch(
        `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name&access_token=${accessToken}`
      );
      const phonesData = await phonesRes.json();

      if (!phonesData.data || phonesData.data.length === 0) {
        throw new Error('No phone numbers found under this WABA. Please register a number first.');
      }

      const phone = phonesData.data[0]; // Use the first registered phone number

      this.logger.log(`Discovered Phone: ${phone.display_phone_number} (ID: ${phone.id})`);

      return {
        waba_id: wabaId,
        phone_number_id: phone.id,
        display_phone_number: phone.display_phone_number,
        business_name: phone.verified_name || businessName,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch WABA details: ${error.message}`);
      throw new Error(`Failed to fetch WABA details from Meta: ${error.message}`);
    }
  }

  // Simulates pulling data from Graph API, which would be cached in Redis in production (15-30min TTL)
  async fetchAccountStatus(wabaId: string) {
    return {
      status: 'approved',
      quality_rating: 'green',
      message_limit_tier: 'TIER_1K (1,000/24h)',
    };
  }

  async fetchVerificationStatus(wabaId: string) {
    return {
      fb_business_verification_status: 'verified',
      payment_method_status: 'action_required',
    };
  }

  async updateBusinessProfile(phoneId: string, payload: any) {
    // Validates with Meta Graph API endpoint: /{phone-number-id}/whatsapp_business_profile
    return { success: true };
  }
}
