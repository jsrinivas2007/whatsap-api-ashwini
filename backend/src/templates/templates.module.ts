import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller.js';
import { TemplatesService } from './templates.service.js';
import { SupabaseService } from '../supabase/supabase.service.js'; // Adjust path if necessary

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, SupabaseService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
