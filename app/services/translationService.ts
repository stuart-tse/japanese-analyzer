import { ApiClient, defaultApiClient } from './apiClient';
import { MODEL_NAME, DEFAULT_API_URL } from './api';

export interface TranslationServiceConfig {
  apiKey?: string;
  apiUrl?: string;
  client?: ApiClient;
}

export class TranslationService {
  private client: ApiClient;
  private config: TranslationServiceConfig;

  constructor(config: TranslationServiceConfig = {}) {
    this.config = config;
    this.client = config.client || defaultApiClient.withConfig({
      apiKey: config.apiKey,
      baseUrl: config.apiUrl,
    });
  }

  async translate(japaneseText: string): Promise<string> {
    const response = await this.client.post('/translate', {
      text: japaneseText,
      model: MODEL_NAME,
      apiUrl: this.config.apiUrl !== DEFAULT_API_URL ? this.config.apiUrl : undefined,
    }, {
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
    });

    const choices = (response as Record<string, unknown>).choices as Array<{ message?: { content?: string } }> | undefined;
    if (choices?.[0]?.message?.content) {
      return choices[0].message.content.trim();
    } else {
      console.error('Unexpected API response structure (Translation):', response);
      throw new Error('翻译结果格式错误');
    }
  }

  async translateStream(
    japaneseText: string,
    onChunk: (chunk: string, isDone: boolean) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let rawContent = '';

    await this.client.postStream(
      '/translate',
      {
        text: japaneseText,
        model: MODEL_NAME,
        apiUrl: this.config.apiUrl !== DEFAULT_API_URL ? this.config.apiUrl : undefined,
      },
      (content) => {
        rawContent = content;
        onChunk(content, false);
      },
      () => {
        onChunk(rawContent, true);
      },
      onError,
      {
        apiKey: this.config.apiKey,
        apiUrl: this.config.apiUrl,
      }
    );
  }

  // Factory method
  static create(config: TranslationServiceConfig): TranslationService {
    return new TranslationService(config);
  }
}