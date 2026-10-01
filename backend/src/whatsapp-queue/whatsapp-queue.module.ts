import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappQueueProcessor } from './whatsapp-queue.processor.js';
import { WhatsappQueueService } from './whatsapp-queue.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'whatsapp-outbound',
    }),
  ],
  providers: [WhatsappQueueProcessor, WhatsappQueueService],
  exports: [WhatsappQueueService],
})
export class WhatsappQueueModule {}
