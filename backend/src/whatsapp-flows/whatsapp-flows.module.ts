import { Module } from '@nestjs/common';
import { WhatsappFlowsController } from './whatsapp-flows.controller.js';
import { WhatsappFlowsService } from './whatsapp-flows.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [WhatsappFlowsController],
  providers: [WhatsappFlowsService],
  exports: [WhatsappFlowsService],
})
export class WhatsappFlowsModule {}
