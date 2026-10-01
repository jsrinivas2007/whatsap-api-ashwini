import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller.js';
import { ChatsService } from './chats.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
