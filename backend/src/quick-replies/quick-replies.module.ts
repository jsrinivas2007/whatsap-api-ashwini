import { Module } from '@nestjs/common';
import { QuickRepliesController } from './quick-replies.controller.js';
import { QuickRepliesService } from './quick-replies.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [QuickRepliesController],
  providers: [QuickRepliesService],
  exports: [QuickRepliesService],
})
export class QuickRepliesModule {}
