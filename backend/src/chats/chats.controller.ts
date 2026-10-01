import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ChatsService } from './chats.service.js';

@Controller('api/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get('conversations')
  async getConversations(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    return this.chatsService.getConversations(accountId);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.chatsService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Param('id') id: string, @Body() payload: any) {
    return this.chatsService.sendMessage(id, payload);
  }

  @Post('conversations/:id/assign')
  async assignConversation(@Headers() headers: any, @Param('id') id: string) {
    const accountId = this.getAccountId(headers);
    // Since we don't have full auth, we'll assign it to the 'accountId' or a generic agent ID
    return this.chatsService.assignConversation(id, accountId);
  }

  @Post('start-single')
  async startSingleChat(@Headers() headers: any, @Body() payload: any) {
    const accountId = this.getAccountId(headers);
    return this.chatsService.startSingleChat(accountId, payload);
  }

  @Post('start-bulk')
  async startBulkChat(@Headers() headers: any, @Body() payload: { mode: string, template_id?: string, rows: any[] }) {
    const accountId = this.getAccountId(headers);
    return this.chatsService.startBulkChat(accountId, payload);
  }

  @Get('start-bulk/:id')
  async getBulkJobProgress(@Param('id') id: string) {
    return this.chatsService.getBulkJobProgress(id);
  }
}
