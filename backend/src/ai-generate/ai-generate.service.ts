import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { AiProviderAdapter } from './adapters/ai-provider.interface.js';
import { OpenAiAdapter } from './adapters/openai.adapter.js';
import { StabilityAdapter } from './adapters/stability.adapter.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';

@Injectable()
export class AiGenerateService {
  private adapters: Record<string, AiProviderAdapter> = {
    openai: new OpenAiAdapter(),
    anthropic: {
      generateText: async () => { throw new BadRequestException('Anthropic text generation not yet fully configured.'); },
      generateImage: async () => { throw new BadRequestException('Anthropic does not support image generation.'); }
    },
    stability: new StabilityAdapter(),
    gemini: new GeminiAdapter(),
    custom: new OpenAiAdapter(),
  };

  constructor(private readonly supabase: SupabaseService) {}

  getProviders(type: string) {
    const allProviders = [
      { id: 'openai', name: 'OpenAI (GPT-4 / DALL-E)' },
      { id: 'anthropic', name: 'Anthropic (Claude)' },
      { id: 'stability', name: 'Stability AI' },
      { id: 'gemini', name: 'Google Gemini' },
      { id: 'custom', name: 'Custom OpenAI-Compatible' }
    ];
    if (type === 'image') {
      return allProviders.filter(p => p.id === 'openai' || p.id === 'stability' || p.id === 'custom' || p.id === 'gemini');
    }
    return allProviders.filter(p => p.id !== 'stability');
  }

  async getSavedKeys(accountId: string, userId: string) {
    const client = this.supabase.getClient();
    const { data } = await client.from('user_ai_provider_keys').select('id, provider').eq('user_id', userId);
    return data || [];
  }

  async deleteKey(accountId: string, userId: string, provider: string) {
    const client = this.supabase.getClient();
    await client.from('user_ai_provider_keys').delete().eq('user_id', userId).eq('provider', provider);
    return { success: true };
  }

  private async getApiKey(accountId: string, userId: string, payload: any): Promise<{ key: string, endpoint?: string }> {
    if (payload.use_saved) {
      const client = this.supabase.getClient();
      const { data } = await client.from('user_ai_provider_keys')
        .select('encrypted_api_key, custom_endpoint_url')
        .eq('user_id', userId).eq('provider', payload.provider).single();
      
      if (!data) throw new BadRequestException('Saved key not found');
      // In a real app we would decrypt here. We assume it's just the key for now.
      return { key: data.encrypted_api_key, endpoint: data.custom_endpoint_url };
    }
    
    if (!payload.api_key) throw new BadRequestException('API key required');
    
    if (payload.remember_key) {
      const client = this.supabase.getClient();
      // Upsert the key
      await client.from('user_ai_provider_keys').upsert({
        account_id: accountId,
        user_id: userId,
        provider: payload.provider,
        encrypted_api_key: payload.api_key, // encrypt before save in real app
        custom_endpoint_url: payload.custom_endpoint_url || null,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id,provider' });
    }
    return { key: payload.api_key, endpoint: payload.custom_endpoint_url };
  }

  async generateText(accountId: string, userId: string, payload: any) {
    const { key, endpoint } = await this.getApiKey(accountId, userId, payload);
    const adapter = this.adapters[payload.provider] || this.adapters['custom'];
    
    const result = await adapter.generateText(payload.prompt, { apiKey: key, endpointUrl: endpoint });
    return { result };
  }

  async generateImage(accountId: string, userId: string, payload: any) {
    const { key, endpoint } = await this.getApiKey(accountId, userId, payload);
    const adapter = this.adapters[payload.provider] || this.adapters['custom'];
    
    const result = await adapter.generateImage(payload.prompt, { 
      apiKey: key, 
      endpointUrl: endpoint, 
      aspectRatio: payload.size,
      referenceImage: payload.reference_image
    });
    return { image_reference: result }; // this is a temp url
  }

  async useImage(accountId: string, imageReference: string) {
    // In reality this would download from imageReference and upload to Meta's Resumable Upload API
    // and return the file handle. We'll simulate returning a handle for testing.
    return { handle: 'mock-ai-generated-image-handle-1234', preview_url: imageReference };
  }
}
