import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappApiService } from './whatsapp-api.service.js';

describe('WhatsappApiService', () => {
  let service: WhatsappApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappApiService],
    }).compile();

    service = module.get<WhatsappApiService>(WhatsappApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
