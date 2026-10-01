import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service.js';
import { PlanEnforcementService } from '../billing/plan-enforcement.service.js';

@Controller('api/contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly planEnforcementService: PlanEnforcementService
  ) {}

  private getAccountId(headers: any): string {
    const accountId = headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
    return accountId;
  }

  @Get()
  async getContacts(
    @Headers() headers: any,
    @Query('query') query?: string,
    @Query('tags') tags?: string
  ) {
    const accountId = this.getAccountId(headers);
    const parsedTags = tags ? tags.split(',') : [];
    return this.contactsService.getContacts(accountId, query, parsedTags);
  }

  @Post()
  async addContact(@Headers() headers: any, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    await this.planEnforcementService.enforceAction(accountId, 'contacts', 1);
    const result = await this.contactsService.addContact(accountId, payload);
    await this.planEnforcementService.incrementUsage(accountId, 'contacts', 1);
    return result;
  }

  @Patch(':id')
  async updateContact(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    return this.contactsService.updateContact(accountId, id, payload);
  }

  @Delete(':id')
  async deleteContact(@Headers() headers: any, @Param('id') id: string) {
    const accountId = this.getAccountId(headers);
    const result = await this.contactsService.deleteContact(accountId, id);
    await this.planEnforcementService.decrementUsage(accountId, 'contacts', 1);
    return result;
  }

  @Post('import')
  async importContacts(@Headers() headers: any, @Body() payload: { rows: any[] }) {
    const accountId = this.getAccountId(headers);
    if (!payload.rows) {
      throw new BadRequestException('Rows required');
    }
    await this.planEnforcementService.enforceAction(accountId, 'contacts', payload.rows.length);
    const result = await this.contactsService.importContacts(accountId, payload.rows);
    await this.planEnforcementService.incrementUsage(accountId, 'contacts', payload.rows.length);
    return result;
  }
}
