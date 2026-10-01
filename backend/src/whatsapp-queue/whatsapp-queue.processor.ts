import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('whatsapp-outbound')
export class WhatsappQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappQueueProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    
    // Stub for sending WhatsApp message via Meta API
    if (job.name === 'send-template') {
      this.logger.log(`[STUB] Sending template message to ${job.data.to}`);
      // await this.whatsappService.sendTemplateMessage(...)
    }

    return { success: true };
  }
}
