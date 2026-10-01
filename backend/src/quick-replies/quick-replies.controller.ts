import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api/quick-replies')
export class QuickRepliesController {
  constructor(
    private readonly quickRepliesService: QuickRepliesService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  async getQuickReplies(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    return this.quickRepliesService.getQuickReplies(accountId);
  }

  @Post()
  async createQuickReply(
    @Headers() headers: any,
    @Body() payload: { title: string; message: string; shortcut?: string }
  ) {
    const accountId = this.getAccountId(headers);
    if (!payload.title || !payload.message) {
      throw new HttpException('Title and message are required', HttpStatus.BAD_REQUEST);
    }
    await this.planEnforcementService.enforceAction(accountId, 'quick_replies', 1);
    const result = await this.quickRepliesService.createQuickReply(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'quick_replies', 1);
    return result;
  }

  @Patch(':id')
  async updateQuickReply(
    @Headers() headers: any,
    @Param('id') id: string,
    @Body() payload: { title?: string; message?: string; shortcut?: string }
  ) {
    const accountId = this.getAccountId(headers);
    return this.quickRepliesService.updateQuickReply(accountId, id, payload);
  }

  @Delete(':id')
  async deleteQuickReply(
    @Headers() headers: any,
    @Param('id') id: string
  ) {
    const accountId = this.getAccountId(headers);
    const result = await this.quickRepliesService.deleteQuickReply(accountId, id);
    await this.planEnforcementService.decrementUsage(accountId, 'quick_replies', 1);
    return result;
  }
}
