import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { WhatsappSettingsController } from './whatsapp-settings.controller.js';
import { WabaService } from './waba.service.js';
import { MetaApiService } from './meta-api.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [SupabaseModule, WhatsappModule],
  controllers: [WhatsappSettingsController],
  providers: [WabaService, MetaApiService],
})
export class WhatsappSettingsModule implements OnModuleInit {
  private readonly logger = new Logger(WhatsappSettingsModule.name);

  onModuleInit() {
    const facebookAppId = process.env.FACEBOOK_APP_ID;
    const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    const whatsappConfigId = process.env.WHATSAPP_CONFIG_ID;

    if (!facebookAppId || facebookAppId === 'your_facebook_app_id_here') {
      this.logger.warn('FACEBOOK_APP_ID is missing or not configured in backend .env');
    }
    if (!facebookAppSecret || facebookAppSecret === 'your_facebook_app_secret_here') {
      this.logger.warn('FACEBOOK_APP_SECRET is missing or not configured in backend .env');
    }
    if (!whatsappConfigId || whatsappConfigId === 'your_whatsapp_config_id_here') {
      this.logger.warn('WHATSAPP_CONFIG_ID is missing or not configured in backend .env');
    }
  }
}
