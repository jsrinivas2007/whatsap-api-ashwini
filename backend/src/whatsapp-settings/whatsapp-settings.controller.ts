import { Controller, Get, Post, Patch, Body, Headers, BadRequestException, UnauthorizedException, Logger, InternalServerErrorException } from '@nestjs/common';
import { WabaService } from './waba.service.js';
import { MetaApiService } from './meta-api.service.js';
import { WhatsappApiService } from '../whatsapp/whatsapp-api/whatsapp-api.service.js';

@Controller('api/whatsapp')
export class WhatsappSettingsController {
  private readonly logger = new Logger(WhatsappSettingsController.name);
  constructor(
    private readonly wabaService: WabaService,
    private readonly metaApiService: MetaApiService,
    private readonly whatsappApiService: WhatsappApiService,
  ) {}

  // Simulating RBAC middleware/guard by reading a header for now
  private getAccountId(headers: any): string {
    const accountId = headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
    return accountId;
  }

  private checkPermissions(headers: any) {
    const role = headers['x-role'] || 'admin';
    if (role !== 'admin') {
      throw new UnauthorizedException('Requires settings management permission');
    }
  }

  @Get('setup-status')
  async getSetupStatus(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    const account = await this.wabaService.getWabaAccount(accountId);

    if (!account) {
      return null; // Frontend expects empty response for unconnected state
    }

    // Live-validate the stored token against Meta so the UI never shows a
    // false "Connected" badge for expired/revoked credentials.
    let connectionVerified = false;
    let verificationError: string | null = null;
    if (account.access_token && account.phone_number_id) {
      try {
        await this.metaApiService.validateCredentials(account.access_token, account.phone_number_id);
        connectionVerified = true;
      } catch (err: any) {
        verificationError = err.message || 'Token could not be verified';
      }
    }

    return {
      businessName: account.business_name,
      displayPhoneNumber: account.display_phone_number,
      messageLimitTier: account.message_limit_tier,
      accountStatus: account.account_status,
      qualityRating: account.quality_rating,
      fbBusinessVerificationStatus: account.fb_business_verification_status,
      paymentMethodStatus: account.payment_method_status,
      // Non-secret identifiers so the frontend can prefill the form after
      // navigation/tab switches (token is intentionally never returned).
      phoneNumberId: account.phone_number_id,
      wabaId: account.waba_id,
      hasToken: !!account.access_token,
      connectionVerified,
      verificationError,
    };
  }

  @Post('refresh-status')
  async refreshStatus(@Headers() headers: any) {
    this.checkPermissions(headers);
    const accountId = this.getAccountId(headers);
    const account = await this.wabaService.getWabaAccount(accountId);
    
    if (account && account.access_token) {
      try {
        const metaDetails = await this.metaApiService.fetchWabaDetails(account.access_token);
        await this.wabaService.updateWabaAccount(accountId, {
          business_name: metaDetails.business_name,
          display_phone_number: metaDetails.display_phone_number,
          account_status: (metaDetails as any).account_status,
          quality_rating: (metaDetails as any).quality_rating,
          fb_business_verification_status: (metaDetails as any).fb_business_verification_status,
        });
      } catch (err) {
        this.logger.error('Failed to refresh status from Meta', err);
      }
    }
    return { success: true };
  }

  @Post('embedded-signup/init')
  async initSignup(@Body() body: any, @Headers() headers: any) {
    this.checkPermissions(headers);
    if (!['new_number', 'existing_number', 'migrated'].includes(body.connection_type)) {
      throw new BadRequestException('Invalid connection_type');
    }
    return { session_id: 'mock-session-id', connection_type: body.connection_type };
  }

  @Post('embedded-signup/callback')
  async signupCallback(@Body() body: any, @Headers() headers: any) {
    this.checkPermissions(headers);
    const accountId = this.getAccountId(headers);
    
    if (!body.code) {
      this.logger.error('No authorization code provided by frontend');
      throw new BadRequestException('Authorization code is required');
    }

    try {
      this.logger.log(`Received Embedded Signup callback for connection_type: ${body.connection_type}`);
      
      // 1. Exchange code for long-lived access token
      const accessToken = await this.metaApiService.exchangeCodeForToken(body.code);
      
      // 2. Fetch WABA Details
      const metaDetails = await this.metaApiService.fetchWabaDetails(accessToken);
      
      // 3. Create or Update WabaAccount record
      await this.wabaService.createWabaAccount(accountId, {
        ...metaDetails,
        access_token: accessToken,
        connection_type: body.connection_type || 'new_number',
      });
      
      this.logger.log(`Successfully completed Embedded Signup flow for account ${accountId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Signup Callback Failed: ${error.message}`);
      throw new InternalServerErrorException(error.message || 'Failed to complete Meta connection');
    }
  }

  @Get('business-profile')
  async getBusinessProfile(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    const profile = await this.wabaService.getBusinessProfile(accountId);
    
    if (!profile) {
      return {
        profilePictureUrl: null,
        email: '',
        description: '',
        address: '',
        category: '',
        websiteLinks: [],
      };
    }

    return {
      profilePictureUrl: profile.profile_picture_url || null,
      email: profile.email,
      description: profile.description,
      address: profile.address,
      category: profile.category,
      websiteLinks: profile.website_links || [],
    };
  }

  @Patch('business-profile')
  async updateBusinessProfile(@Body() body: any, @Headers() headers: any) {
    this.checkPermissions(headers);
    const accountId = this.getAccountId(headers);

    // Server-side validation based on Meta's constraints
    if (body.description && body.description.length > 512) throw new BadRequestException('Description exceeds 512 characters');
    if (body.address && body.address.length > 256) throw new BadRequestException('Address exceeds 256 characters');
    if (body.websiteLinks) {
      if (body.websiteLinks.length > 2) throw new BadRequestException('Maximum 2 website links allowed');
      for (const link of body.websiteLinks) {
        if (link && link.length > 256) throw new BadRequestException('Website link exceeds 256 characters');
        if (link && !link.startsWith('http')) throw new BadRequestException('Invalid URL format');
      }
    }
    if (body.email && !body.email.includes('@')) throw new BadRequestException('Invalid email format');

    // In a real flow, this payload would first be sent to Meta Graph API
    await this.metaApiService.updateBusinessProfile('mock-phone-id', body);

    const updated = await this.wabaService.updateBusinessProfile(accountId, {
      description: body.description,
      address: body.address,
      category: body.category,
      email: body.email,
      website_links: body.websiteLinks,
    });

    return updated;
  }

  @Get('insights-link')
  async getInsightsLink() {
    return { url: 'https://business.facebook.com/wa/manage/insights/' };
  }

  @Post('test-config')
  async testConfig(@Body() body: any, @Headers() headers: any) {
    const accountId = this.getAccountId(headers);

    if (!body.phoneNumberId || !body.wabaId) {
      throw new BadRequestException('Phone Number ID and WABA ID are required');
    }

    // Allow keeping the previously stored token when the field is left blank
    const existing = await this.wabaService.getWabaAccount(accountId);
    const accessToken = body.accessToken || existing?.access_token;
    if (!accessToken) {
      throw new BadRequestException('Access Token is required');
    }

    // Validate against Meta BEFORE saving — never store broken credentials
    let verified;
    try {
      verified = await this.metaApiService.validateCredentials(accessToken, body.phoneNumberId);
    } catch (err: any) {
      throw new BadRequestException(`Meta rejected these credentials: ${err.message}`);
    }

    await this.wabaService.createWabaAccount(accountId, {
      waba_id: body.wabaId,
      phone_number_id: body.phoneNumberId,
      access_token: accessToken,
      display_phone_number: verified.display_phone_number || 'Test Number',
      business_name: verified.verified_name || 'Test Business',
      connection_type: 'new_number',
    });

    return { success: true, verified: true, displayPhoneNumber: verified.display_phone_number || null };
  }

  @Post('send-test-message')
  async sendTestMessage(@Body() body: any, @Headers() headers: any) {
    const accountId = this.getAccountId(headers);

    if (!body.recipient) {
      throw new BadRequestException('Test recipient phone number is required');
    }

    // Credentials are retrieved server-side from DB — access token never exposed to frontend
    try {
      // Pick what to send: explicit template > first APPROVED template > plain text.
      // (The old hardcoded 'hello_world' sample only exists on Meta sandbox
      // numbers, which caused "template does not exist" errors on real numbers.)
      const waba = await this.wabaService.getWabaAccount(accountId);
      let templateName: string | null = body.templateName || null;
      let language: string = body.language || 'en_US';

      if (!templateName && waba?.access_token && waba?.waba_id) {
        const approved = await this.metaApiService.listApprovedTemplates(waba.access_token, waba.waba_id);
        if (approved.length > 0) {
          templateName = approved[0].name;
          language = approved[0].language || language;
        }
      }

      let result: any;
      let sentAs: string;
      if (templateName) {
        result = await this.whatsappApiService.sendTemplateMessage(
          accountId,
          body.recipient,
          templateName,
          language,
          []
        );
        sentAs = `template:${templateName}`;
      } else {
        result = await this.whatsappApiService.sendTextMessage(
          accountId,
          body.recipient,
          'Test message from Ashwini Innovations ✔ Connection is working.'
        );
        sentAs = 'text';
      }

      // Save this outbound test message to the DB so it appears in the Chats UI
      const client = this.wabaService['supabase'].getClient(); // accessing the supabase client
      
      // 1. Find or create Contact
      let contactId = null;
      const { data: contact } = await client.from('contacts').select('id').eq('account_id', accountId).eq('whatsapp_number', body.recipient).single();
      if (contact) {
        contactId = contact.id;
      } else {
        const { data: newContact } = await client.from('contacts').insert({
          account_id: accountId, name: 'Test Recipient', whatsapp_number: body.recipient, source: 'manual'
        }).select('id').single();
        contactId = newContact?.id;
      }

      // 2. Find or create Conversation
      let conversationId = null;
      if (contactId) {
        const { data: conv } = await client.from('conversations').select('id').eq('account_id', accountId).eq('contact_id', contactId).single();
        if (conv) {
          conversationId = conv.id;
          await client.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
        } else {
          const { data: newConv } = await client.from('conversations').insert({
            account_id: accountId, contact_id: contactId, status: 'open', last_message_at: new Date().toISOString()
          }).select('id').single();
          conversationId = newConv?.id;
        }
      }

      // 3. Insert Message
      if (conversationId) {
        await client.from('messages').insert({
          conversation_id: conversationId,
          direction: 'outbound',
          type: 'template',
          content: { text: 'Hello World Template Sent' },
          status: 'sent',
          message_id: result.messages?.[0]?.id || `test_${Date.now()}`,
        });
      }

      return { success: true, sentAs, meta: result };
    } catch (error: any) {
      this.logger.error(`Failed to send test message: ${error.message}`);
      const friendly = /24 hours|re-engagement|session/i.test(error.message || '')
        ? `${error.message}. Tip: plain text only delivers within 24h of an incoming message from that number — send an approved template instead.`
        : error.message;
      throw new InternalServerErrorException(friendly || 'Failed to send test message');
    }
  }
}
