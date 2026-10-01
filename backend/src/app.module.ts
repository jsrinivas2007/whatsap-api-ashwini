import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseModule } from './supabase/supabase.module.js';
// import { WhatsappQueueModule } from './whatsapp-queue/whatsapp-queue.module.js';
import { StubsController } from './stubs/stubs.controller.js';
import { WhatsappSettingsModule } from './whatsapp-settings/whatsapp-settings.module.js';
import { TemplatesModule } from './templates/templates.module.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';
import { ContactsModule } from './contacts/contacts.module.js';
import { TagsModule } from './tags/tags.module.js';
import { QuickRepliesModule } from './quick-replies/quick-replies.module.js';
import { WhatsappFlowsModule } from './whatsapp-flows/whatsapp-flows.module.js';
import { FlowsModule } from './flows/flows.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { ChatsModule } from './chats/chats.module.js';
import { AiGenerateModule } from './ai-generate/ai-generate.module.js';
import { BillingModule } from './billing/billing.module.js';

import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    SupabaseModule,
    WhatsappSettingsModule,
    TemplatesModule,
    WhatsappModule,
    ContactsModule,
    TagsModule,
    QuickRepliesModule,
    WhatsappFlowsModule,
    FlowsModule,
    CampaignsModule,
    ChatsModule,
    AiGenerateModule,
    BillingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
