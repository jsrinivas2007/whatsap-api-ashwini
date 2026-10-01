import { Controller, Get, Post, Body, Query, Param, Patch, Delete, Res } from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappQueueService } from '../whatsapp-queue/whatsapp-queue.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('api/v1')
export class StubsController {
  constructor(
    private readonly queueService: WhatsappQueueService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private managedContacts = [
    { id: 'contact-1', name: 'SINDHU', countryCode: '91', whatsapp: '9866011981', source: 'Excel Upload', tags: ['Hot Lead'], optedOut: false },
    { id: 'contact-2', name: 'srinivas', countryCode: '91', whatsapp: '9964011126', source: 'Chat', tags: ['No Response'], optedOut: false },
    { id: 'contact-3', name: 'Rahul Sharma', countryCode: '91', whatsapp: '9876543210', source: 'CSV Upload', tags: ['Hot Lead'], optedOut: false },
  ];

  @Get('campaigns')
  getCampaigns() {
    return { data: [{ id: 1, name: 'Diwali Sale', status: 'completed' }] };
  }

  @Post('campaigns')
  async createCampaign(@Body() body: any) {
    // Stub: Queue messages
    await this.queueService.queueTemplateMessage({ to: '1234567890', templateId: 'sale' });
    return { success: true, message: 'Campaign started' };
  }

  @Get('contacts')
  listManagedContacts(@Query('search') search?: string, @Query('page') page = '1', @Query('page_size') pageSize = '25') {
    const matches = this.managedContacts.filter((contact) => !search || `${contact.name} ${contact.countryCode}${contact.whatsapp}`.toLowerCase().includes(search.toLowerCase()));
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const currentPage = Math.max(1, Number(page) || 1);
    return { success: true, data: { contacts: matches.slice((currentPage - 1) * limit, currentPage * limit), total: matches.length, page: currentPage, pageSize: limit } };
  }

  @Post('contacts')
  createManagedContact(@Body() body: { name?: string; countryCode?: string; whatsapp?: string; tags?: string[] }) {
    const name = body.name?.trim();
    const countryCode = body.countryCode?.replace(/\D/g, '') || '';
    const whatsapp = body.whatsapp?.replace(/\D/g, '') || '';
    if (!name || !/^\d{1,4}$/.test(countryCode) || !/^\d{7,15}$/.test(whatsapp)) {
      return { success: false, code: 'INVALID_CONTACT', message: 'Name, country code, and a valid WhatsApp number are required.' };
    }
    if (this.managedContacts.some((contact) => `${contact.countryCode}${contact.whatsapp}` === `${countryCode}${whatsapp}`)) {
      return { success: false, code: 'DUPLICATE_CONTACT', message: 'A contact with this WhatsApp number already exists.' };
    }
    const contact = { id: `contact-${Date.now()}`, name, countryCode, whatsapp, source: 'Manual', tags: body.tags ?? [], optedOut: false };
    this.managedContacts.unshift(contact);
    return { success: true, data: contact };
  }

  @Patch('contacts/:id')
  updateManagedContact(@Param('id') id: string, @Body() body: Partial<{ name: string; countryCode: string; whatsapp: string; tags: string[]; optedOut: boolean }>) {
    const index = this.managedContacts.findIndex((contact) => contact.id === id);
    if (index < 0) return { success: false, code: 'CONTACT_NOT_FOUND', message: 'Contact not found.' };
    this.managedContacts[index] = { ...this.managedContacts[index], ...body, countryCode: body.countryCode?.replace(/\D/g, '') ?? this.managedContacts[index].countryCode, whatsapp: body.whatsapp?.replace(/\D/g, '') ?? this.managedContacts[index].whatsapp };
    return { success: true, data: this.managedContacts[index] };
  }

  @Delete('contacts/:id')
  deleteManagedContact(@Param('id') id: string) {
    const before = this.managedContacts.length;
    this.managedContacts = this.managedContacts.filter((contact) => contact.id !== id);
    return { success: before !== this.managedContacts.length, data: { id } };
  }

  @Get('tags')
  listTags() {
    return { success: true, data: ['Closed Lost', 'No Response', 'In Progress', 'Hot Lead', 'Closed Won'] };
  }

  @Post('tags')
  createTag(@Body() body: { name?: string }) {
    return { success: true, data: { id: `tag-${Date.now()}`, name: body.name?.trim() ?? '' } };
  }

  @Get('contacts/export')
  exportManagedContacts(@Res() response: Response) {
    const rows = ['Name,CountryCode,Whatsapp,Source,Tags,OptedOut', ...this.managedContacts.map((contact) => [contact.name, contact.countryCode, contact.whatsapp, contact.source, contact.tags.join('|'), contact.optedOut].join(','))];
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    response.send(rows.join('\n'));
  }

  @Get('contacts/import/sample')
  sampleContacts(@Res() response: Response) {
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="contacts-sample.csv"');
    response.send('Name,CountryCode,Whatsapp,City\nRahul Sharma,91,9876543210,Mumbai\nPriya Patel,91,9876543211,Hyderabad');
  }

  @Post('contacts/import')
  createImportJob(@Body() body: { fileName?: string }) {
    return { success: true, data: { jobId: `import-${Date.now()}`, status: 'queued', fileName: body.fileName ?? 'contacts.csv' } };
  }

  @Get('contacts/import/:jobId')
  getImportJob(@Param('jobId') jobId: string) {
    return { success: true, data: { jobId, status: 'completed', totalRows: 0, importedRows: 0, skippedRows: 0, failedRows: 0 } };
  }

  @Get('crm/contacts')
  getContacts(@Query('page') page = '1', @Query('limit') limit = '25', @Query('tag') tag?: string, @Query('search') search?: string, @Query('excludeOptedOut') excludeOptedOut = 'true') {
    const contacts = [
      { id: 'contact-1', name: 'Rahul Sharma', countryCode: '91', whatsapp: '9876543210', source: 'CSV Upload', tags: ['Hot Lead'], optedOut: false },
      { id: 'contact-2', name: 'Priya Patel', countryCode: '91', whatsapp: '9876543211', source: 'CSV Upload', tags: ['In Progress'], optedOut: false },
      { id: 'contact-3', name: 'Amit Kumar', countryCode: '91', whatsapp: '9876543212', source: 'Chat', tags: [], optedOut: false },
      { id: 'contact-4', name: 'SINDHU', countryCode: '91', whatsapp: '9866011981', source: 'Excel Upload', tags: ['Hot Lead'], optedOut: true },
      { id: 'contact-5', name: 'srinivas', countryCode: '91', whatsapp: '9964011126', source: 'Chat', tags: ['No Response'], optedOut: false },
    ].filter((contact) => (excludeOptedOut !== 'true' || !contact.optedOut) && (!tag || contact.tags.includes(tag)) && (!search || `${contact.name} ${contact.countryCode}${contact.whatsapp}`.toLowerCase().includes(search.toLowerCase())));
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
    return { success: true, data: { contacts: contacts.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: contacts.length, page: currentPage, limit: pageSize } };
  }

  @Get('contacts/lists')
  getContactLists() {
    return { success: true, data: [
      { id: 'all', name: 'All Contacts', totalContacts: 1250, source: 'All sources' },
      { id: 'admissions', name: 'Admissions 2026', totalContacts: 240, source: 'Import' },
      { id: 'parents', name: 'Parents', totalContacts: 180, source: 'Manual' },
      { id: 'leads', name: 'Interested Leads', totalContacts: 96, source: 'Chat' },
      { id: 'hot', name: 'Hot Leads', totalContacts: 24, source: 'Tag' },
    ] };
  }

  @Get('contacts/tags')
  getContactTags() {
    return { success: true, data: ['Closed Lost', 'No Response', 'In Progress', 'Hot Lead', 'Closed Won'] };
  }

  @Get('contacts/attributes')
  getContactAttributes() {
    return { success: true, data: ['Class', 'Course', 'Location', 'Source', 'Admission Status', 'Lead Status', 'Institution', 'City', 'State'] };
  }

  @Post('contacts/validate-import')
  validateContactImport(@Body() body: { rows?: Array<{ name?: string; countryCode?: string; whatsapp?: string }> }) {
    const rows = body.rows ?? [];
    const seen = new Set<string>();
    let invalid = 0;
    let duplicates = 0;
    for (const row of rows) {
      const countryCode = row.countryCode?.replace(/\D/g, '') ?? '';
      const whatsapp = row.whatsapp?.replace(/\D/g, '') ?? '';
      const normalized = `${countryCode}${whatsapp}`;
      if (!row.name?.trim() || row.name.trim().length > 120 || !/^\d{1,4}$/.test(countryCode) || !/^\d{7,15}$/.test(whatsapp)) {
        invalid += 1;
      } else if (seen.has(normalized)) {
        duplicates += 1;
      } else {
        seen.add(normalized);
      }
    }
    return { success: true, data: { total: rows.length, valid: rows.length - invalid - duplicates, invalid, duplicates, existing: 0 } };
  }

  @Get('inbox/conversations')
  getConversations() {
    return { data: [{ id: 1, customer: 'John Doe', lastMessage: 'Hello!' }] };
  }
}
