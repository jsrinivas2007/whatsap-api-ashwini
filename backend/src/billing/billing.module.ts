import { Module, Global } from '@nestjs/common';
import { PlanEnforcementService } from './plan-enforcement.service.js';
import { BillingController } from './billing.controller.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [BillingController],
  providers: [PlanEnforcementService],
  exports: [PlanEnforcementService],
})
export class BillingModule {}
