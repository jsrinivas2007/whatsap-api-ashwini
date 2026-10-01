import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller.js';
import { ContactsService } from './contacts.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [ContactsController],
  providers: [ContactsService]
})
export class ContactsModule {}
