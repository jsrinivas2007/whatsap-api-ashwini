import { Controller, Get, Post, Delete, Body, Param, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappFlowsService } from './whatsapp-flows.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api/whatsapp-flows')
export class WhatsappFlowsController {
  constructor(
    private readonly whatsappFlowsService: WhatsappFlowsService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  @Get()
  async getFlows(@Headers('x-account-id') accountId: string) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    return this.whatsappFlowsService.getFlows(id);
  }

  @Get('published')
  async getPublishedFlows(@Headers('x-account-id') accountId: string) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    return this.whatsappFlowsService.getPublishedFlows(id);
  }

  @Get('playground-url')
  async getPlaygroundUrl(@Headers('x-account-id') accountId: string) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    return this.whatsappFlowsService.getPlaygroundUrl(id);
  }

  @Get(':id')
  async getFlowDetail(@Headers('x-account-id') accountId: string, @Param('id') paramId: string) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    return this.whatsappFlowsService.getFlowDetail(id, paramId);
  }

  @Post()
  async createFlow(
    @Headers('x-account-id') accountId: string,
    @Body() payload: { name: string; flow_json: any }
  ) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    await this.planEnforcementService.enforceAction(id, 'whatsapp_forms', 1);
    const result = await this.whatsappFlowsService.createFlow(id, payload);
    await this.planEnforcementService.incrementUsage(id, 'whatsapp_forms', 1);
    return result;
  }

  @Delete(':id')
  async deleteFlow(
    @Headers('x-account-id') accountId: string,
    @Param('id') paramId: string
  ) {
    const id = accountId || '00000000-0000-0000-0000-000000000000';
    const result = await this.whatsappFlowsService.deleteFlow(id, paramId);
    await this.planEnforcementService.decrementUsage(id, 'whatsapp_forms', 1);
    return result;
  }
}
