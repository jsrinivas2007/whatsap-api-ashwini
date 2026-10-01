import { Controller, Get, Post, Delete, Body, Param, Headers, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AiGenerateService } from './ai-generate.service.js';

@Controller('api/ai-generate')
export class AiGenerateController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  private getUserId(headers: any): string {
    return headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get('providers')
  async getProviders(@Query('type') type: string) {
    return this.aiGenerateService.getProviders(type);
  }

  @Post('text')
  async generateText(@Headers() headers: any, @Body() payload: { provider: string; api_key?: string; use_saved?: boolean; prompt: string; custom_endpoint_url?: string; remember_key?: boolean }) {
    const accountId = this.getAccountId(headers);
    const userId = this.getUserId(headers);
    if (!payload.prompt || !payload.provider) throw new HttpException('Provider and prompt required', HttpStatus.BAD_REQUEST);
    return this.aiGenerateService.generateText(accountId, userId, payload);
  }

  @Post('image')
  async generateImage(@Headers() headers: any, @Body() payload: { provider: string; api_key?: string; use_saved?: boolean; prompt: string; custom_endpoint_url?: string; remember_key?: boolean; size?: string; style?: string; reference_image?: string }) {
    const accountId = this.getAccountId(headers);
    const userId = this.getUserId(headers);
    if (!payload.prompt || !payload.provider) throw new HttpException('Provider and prompt required', HttpStatus.BAD_REQUEST);
    return this.aiGenerateService.generateImage(accountId, userId, payload);
  }

  @Post('image/use')
  async useImage(@Headers() headers: any, @Body() payload: { image_reference: string }) {
    const accountId = this.getAccountId(headers);
    if (!payload.image_reference) throw new HttpException('Image reference required', HttpStatus.BAD_REQUEST);
    return this.aiGenerateService.useImage(accountId, payload.image_reference);
  }
}

@Controller('api/ai-provider-keys')
export class AiProviderKeysController {
  constructor(private readonly aiGenerateService: AiGenerateService) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  private getUserId(headers: any): string {
    return headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get()
  async getKeys(@Headers() headers: any) {
    return this.aiGenerateService.getSavedKeys(this.getAccountId(headers), this.getUserId(headers));
  }

  @Delete(':provider')
  async deleteKey(@Headers() headers: any, @Param('provider') provider: string) {
    return this.aiGenerateService.deleteKey(this.getAccountId(headers), this.getUserId(headers), provider);
  }
}
