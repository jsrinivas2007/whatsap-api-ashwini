export interface AiGenerateOptions {
  apiKey: string;
  endpointUrl?: string;
}

export interface AiImageOptions extends AiGenerateOptions {
  aspectRatio?: string;
  styleHint?: string;
  referenceImage?: string; // Base64 data URI
}

export interface AiProviderAdapter {
  generateText(prompt: string, options: AiGenerateOptions): Promise<string>;
  generateImage(prompt: string, options: AiImageOptions): Promise<string>; // URL to the image
}
