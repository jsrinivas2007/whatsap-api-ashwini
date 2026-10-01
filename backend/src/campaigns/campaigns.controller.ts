import { Controller, Get, Post, Delete, Body, Param, Headers } from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api/campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  async getCampaigns(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    return this.campaignsService.getCampaigns(accountId);
  }

  @Post()
  async createCampaign(@Headers() headers: any, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    const count = payload.contacts || 1; // Fallback if 0
    await this.planEnforcementService.enforceAction(accountId, 'bulk_broadcast_messages', count);
    
    // Check if scheduling is used
    if (payload.scheduledAt) {
      await this.planEnforcementService.enforceAction(accountId, 'campaign_scheduler', 1);
    }
    
    const result = await this.campaignsService.createCampaign(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'bulk_broadcast_messages', count);
    return result;
  }

  @Delete(':id')
  async deleteCampaign(@Headers() headers: any, @Param('id') id: string) {
    const accountId = this.getAccountId(headers);
    return this.campaignsService.deleteCampaign(accountId, id);
  }
}
