import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api')
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  // --- Tags ---

  @Get('tags')
  async getTags(@Headers() headers: any) {
    return this.tagsService.getTags(this.getAccountId(headers));
  }

  @Post('tags')
  async createTag(@Headers() headers: any, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    await this.planEnforcementService.enforceAction(accountId, 'tags_attributes', 1);
    const result = await this.tagsService.createTag(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'tags_attributes', 1);
    return result;
  }

  @Patch('tags/:id')
  async updateTag(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.tagsService.updateTag(this.getAccountId(headers), id, payload);
  }

  @Delete('tags/:id')
  async deleteTag(@Headers() headers: any, @Param('id') id: string) {
    const accountId = this.getAccountId(headers);
    const result = await this.tagsService.deleteTag(accountId, id);
    await this.planEnforcementService.decrementUsage(accountId, 'tags_attributes', 1);
    return result;
  }

  // --- Attributes ---

  @Get('attribute-definitions')
  async getAttributes(@Headers() headers: any) {
    return this.tagsService.getAttributes(this.getAccountId(headers));
  }

  @Post('attribute-definitions')
  async createAttribute(@Headers() headers: any, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    await this.planEnforcementService.enforceAction(accountId, 'tags_attributes', 1);
    const result = await this.tagsService.createAttribute(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'tags_attributes', 1);
    return result;
  }

  @Patch('attribute-definitions/:id')
  async updateAttribute(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.tagsService.updateAttribute(this.getAccountId(headers), id, payload);
  }

  @Delete('attribute-definitions/:id')
  async deleteAttribute(@Headers() headers: any, @Param('id') id: string) {
    const accountId = this.getAccountId(headers);
    const result = await this.tagsService.deleteAttribute(accountId, id);
    await this.planEnforcementService.decrementUsage(accountId, 'tags_attributes', 1);
    return result;
  }
}
