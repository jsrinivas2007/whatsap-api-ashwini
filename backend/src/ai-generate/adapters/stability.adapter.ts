import { AiProviderAdapter, AiGenerateOptions, AiImageOptions } from './ai-provider.interface.js';
import { BadRequestException } from '@nestjs/common';

export class StabilityAdapter implements AiProviderAdapter {
  async generateText(prompt: string, _options: AiGenerateOptions): Promise<string> {
    throw new BadRequestException('Stability AI does not support text generation.');
  }

  async generateImage(prompt: string, options: AiImageOptions): Promise<string> {
    const isImageToImage = !!options.referenceImage;
    const endpoint = options.endpointUrl || (isImageToImage 
      ? 'https://api.stability.ai/v2beta/stable-image/generate/sd3'
      : 'https://api.stability.ai/v2beta/stable-image/generate/sd3');

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');

    if (isImageToImage && options.referenceImage) {
      // options.referenceImage is assumed to be base64 data URI
      const base64Data = options.referenceImage.split(',')[1];
      if (!base64Data) throw new BadRequestException('Invalid reference image format');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });
      formData.append('image', blob, 'reference.png');
      formData.append('mode', 'image-to-image');
      formData.append('strength', '0.5'); // typical default
    } else {
      if (options.aspectRatio) {
        formData.append('aspect_ratio', options.aspectRatio);
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        throw new BadRequestException(data.message || data.error?.message || 'Stability Image Generation failed');
      } catch {
        throw new BadRequestException(`Stability Image Generation failed: ${res.statusText}`);
      }
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  }
}
