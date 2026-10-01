import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WhatsappQueueService {
  constructor(
    @InjectQueue('whatsapp-outbound') private readonly whatsappQueue: Queue,
  ) {}

  async queueTemplateMessage(payload: any) {
    await this.whatsappQueue.add('send-template', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
