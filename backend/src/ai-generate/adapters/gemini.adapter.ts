import { AiProviderAdapter, AiGenerateOptions, AiImageOptions } from './ai-provider.interface.js';
import { BadRequestException } from '@nestjs/common';

export class GeminiAdapter implements AiProviderAdapter {
  async generateText(prompt: string, options: AiGenerateOptions): Promise<string> {
    const endpoint = options.endpointUrl || `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${options.apiKey}`;
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new BadRequestException(data.error?.message || 'Gemini Text Generation failed');
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateImage(prompt: string, options: AiImageOptions): Promise<string> {
    // Standard Gemini API keys (AI Studio) do not yet natively support image generation (Imagen) directly.
    // Throw a clear message.
    throw new BadRequestException('Image Generation via Gemini (Imagen) requires Google Cloud Vertex AI integration which is not supported by standard AI Studio keys.');
  }
}
