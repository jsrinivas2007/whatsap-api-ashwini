import { AiProviderAdapter, AiGenerateOptions, AiImageOptions } from './ai-provider.interface.js';
import { BadRequestException } from '@nestjs/common';

export class OpenAiAdapter implements AiProviderAdapter {
  async generateText(prompt: string, options: AiGenerateOptions): Promise<string> {
    const endpoint = options.endpointUrl || 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new BadRequestException(data.error?.message || 'OpenAI Text Generation failed');
    }
    return data.choices[0].message.content;
  }

  async generateImage(prompt: string, options: AiImageOptions): Promise<string> {
    if (options.referenceImage) {
      throw new BadRequestException('OpenAI DALL-E 3 does not support reference-image guided generation in this mode.');
    }

    const endpoint = options.endpointUrl || 'https://api.openai.com/v1/images/generations';
    let size = '1024x1024';
    if (options.aspectRatio === '16:9') size = '1024x1792'; // DALL-E 3 approximation, actually DALL-E 3 supports standard sizes, let's stick to 1024x1024 for 1:1

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: options.aspectRatio === '16:9' ? '1024x1792' : '1024x1024'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new BadRequestException(data.error?.message || 'OpenAI Image Generation failed');
    }
    return data.data[0].url;
  }
}
