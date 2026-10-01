import { Module } from '@nestjs/common';
import { AiGenerateController, AiProviderKeysController } from './ai-generate.controller.js';
import { AiGenerateService } from './ai-generate.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [AiGenerateController, AiProviderKeysController],
  providers: [AiGenerateService],
})
export class AiGenerateModule {}
