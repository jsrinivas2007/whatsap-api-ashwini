import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [TagsController],
  providers: [TagsService]
})
export class TagsModule {}
