import { Module } from '@nestjs/common';
import { FlowsController } from './flows.controller.js';
import { FlowsService } from './flows.service.js';
import { FlowEngineService } from './flow-engine.service.js';
import { SupabaseModule } from '../supabase/supabase.module.js';

@Module({
  imports: [SupabaseModule],
  controllers: [FlowsController],
  providers: [FlowsService, FlowEngineService],
  exports: [FlowsService],
})
export class FlowsModule {}
