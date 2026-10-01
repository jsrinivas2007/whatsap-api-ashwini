import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller.js';
import { CampaignsService } from './campaigns.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
