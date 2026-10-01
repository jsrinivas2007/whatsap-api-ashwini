import { Controller, Get, Post, Delete, Body, Param, Query, Headers, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api/templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  async getTemplates(
    @Headers() headers: any,
    @Query('status') status?: string
  ) {
    return this.templatesService.getTemplates(this.getAccountId(headers), status);
  }

  @Post()
  async createTemplate(
    @Headers() headers: any,
    @Body() payload: any
  ) {
    const accountId = this.getAccountId(headers);
    await this.planEnforcementService.enforceAction(accountId, 'templates', 1);
    const result = await this.templatesService.createTemplate(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'templates', 1);
    return result;
  }

  @Get('library')
  async getTemplateLibrary(@Headers() headers: any) {
    return this.templatesService.getTemplateLibrary(this.getAccountId(headers));
  }

  @Post('sync')
  async syncTemplates(@Headers() headers: any) {
    return this.templatesService.syncTemplates(this.getAccountId(headers));
  }

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Headers() headers: any,
    @UploadedFile() file: any
  ) {
    return this.templatesService.uploadMedia(this.getAccountId(headers), file);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any, @Headers('x-hub-signature') signature?: string) {
    return this.templatesService.handleWebhook(payload, signature);
  }

  @Get(':id')
  async getTemplateById(
    @Param('id') id: string,
    @Headers() headers: any
  ) {
    return this.templatesService.getTemplateById(this.getAccountId(headers), id);
  }

  @Delete(':id')
  async deleteTemplate(
    @Param('id') id: string,
    @Headers() headers: any
  ) {
    const accountId = this.getAccountId(headers);
    const result = await this.templatesService.deleteTemplate(accountId, id);
    await this.planEnforcementService.decrementUsage(accountId, 'templates', 1);
    return result;
  }

  @Get(':id/insights')
  async getTemplateInsights(
    @Param('id') id: string,
    @Headers() headers: any
  ) {
    return this.templatesService.getTemplateInsights(this.getAccountId(headers), id);
  }
}
