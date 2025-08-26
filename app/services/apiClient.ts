import { handleApiResponse, createApiError, logError } from '../utils/errorHandler';
import { processStreamResponse, createGeminiStreamProcessor } from '../utils/streamUtils';

export interface ApiClientConfig {
  baseUrl?: string;
  apiKey?: string;
  defaultHeaders?: HeadersInit;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '/api',
      apiKey: config.apiKey,
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
    };
  }

  private getHeaders(additionalHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = { 
      ...this.config.defaultHeaders as Record<string, string>, 
      ...additionalHeaders as Record<string, string> 
    };
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }

  private getUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl || '/api';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  async post<T = unknown>(
    endpoint: string,
    body: unknown,
    options: {
      headers?: HeadersInit;
      apiKey?: string;
      apiUrl?: string;
    } = {}
  ): Promise<T> {
    try {
      const url = options.apiUrl ? 
        `${options.apiUrl}${endpoint}` : 
        this.getUrl(endpoint);
      
      const headers = this.getHeaders(options.headers);
      if (options.apiKey) {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      return await handleApiResponse(response) as T;
    } catch (error) {
      logError(error, `POST ${endpoint}`);
      throw createApiError(error, `请求失败: ${endpoint}`);
    }
  }

  async postStream(
    endpoint: string,
    body: unknown,
    onContent: (content: string) => void,
    onDone: () => void,
    onError: (error: Error) => void,
    options: {
      headers?: HeadersInit;
      apiKey?: string;
      apiUrl?: string;
    } = {}
  ): Promise<void> {
    try {
      const url = options.apiUrl ? 
        `${options.apiUrl}${endpoint}` : 
        this.getUrl(endpoint);
      
      const headers = this.getHeaders(options.headers);
      if (options.apiKey) {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...(body as Record<string, unknown>), stream: true }),
      });

      const processor = createGeminiStreamProcessor(onContent, onDone, onError);
      await processStreamResponse(response, processor);
    } catch (error) {
      logError(error, `POST Stream ${endpoint}`);
      onError(createApiError(error, `流式请求失败: ${endpoint}`));
    }
  }

  async get<T = unknown>(
    endpoint: string,
    options: {
      headers?: HeadersInit;
      apiKey?: string;
      apiUrl?: string;
    } = {}
  ): Promise<T> {
    try {
      const url = options.apiUrl ? 
        `${options.apiUrl}${endpoint}` : 
        this.getUrl(endpoint);
      
      const headers = this.getHeaders(options.headers);
      if (options.apiKey) {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return await handleApiResponse(response) as T;
    } catch (error) {
      logError(error, `GET ${endpoint}`);
      throw createApiError(error, `请求失败: ${endpoint}`);
    }
  }

  // Factory method to create a client with specific configuration
  static create(config: ApiClientConfig): ApiClient {
    return new ApiClient(config);
  }

  // Create a new client with updated configuration
  withConfig(config: Partial<ApiClientConfig>): ApiClient {
    return new ApiClient({ ...this.config, ...config });
  }
}

// Default client instance
export const defaultApiClient = new ApiClient();