import { Module, Global } from '@nestjs/common';
import { WhatsappApiService } from './whatsapp-api/whatsapp-api.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [WhatsappApiService],
  exports: [WhatsappApiService],
})
export class WhatsappModule {}
