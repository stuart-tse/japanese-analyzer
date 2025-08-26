import { ApiClient, defaultApiClient } from './apiClient';
import { TokenData, MODEL_NAME, DEFAULT_API_URL } from './api';

export interface AnalysisServiceConfig {
  apiKey?: string;
  apiUrl?: string;
  client?: ApiClient;
}

export class AnalysisService {
  private client: ApiClient;
  private config: AnalysisServiceConfig;

  constructor(config: AnalysisServiceConfig = {}) {
    this.config = config;
    this.client = config.client || defaultApiClient.withConfig({
      apiKey: config.apiKey,
      baseUrl: config.apiUrl,
    });
  }

  private createAnalysisPrompt(sentence: string): string {
    return `请对以下日语句子进行详细的词法分析，并以JSON数组格式返回结果。每个对象应包含以下字段："word", "pos", "furigana", "romaji"。

请特别注意以下分析要求：
1. 将助动词与对应动词正确结合。如"食べた"应作为一个单词，而不是分开为"食べ"和"た"。
2. 正确识别动词的时态变化，如"いた"是"いる"的过去时，应作为一个完整单词处理。
3. 合理处理助词，应当与前后词汇适当分离。
4. 避免过度分词，特别是对于构成一个语法或语义单位的组合。
5. 对于复合词，如"持って行く"，根据语义和使用习惯确定是作为一个词还是分开处理。
6. 重要：如果待解析的句子中包含换行符，请在对应的位置输出一个JSON对象：{"word": "\\n", "pos": "改行", "furigana": "", "romaji": ""}.
7. 如果有空格，请输出：{"word": " ", "pos": "空格", "furigana": "", "romaji": ""}.

确保输出是严格的JSON格式，不包含任何markdown或其他非JSON字符。

待解析句子： "${sentence}"`;
  }

  async analyze(sentence: string): Promise<TokenData[]> {
    if (!sentence) {
      throw new Error('缺少句子');
    }

    const response = await this.client.post('/analyze', {
      prompt: this.createAnalysisPrompt(sentence),
      model: MODEL_NAME,
      apiUrl: this.config.apiUrl !== DEFAULT_API_URL ? this.config.apiUrl : undefined,
    }, {
      apiKey: this.config.apiKey,
      apiUrl: this.config.apiUrl,
    });

    return this.parseAnalysisResponse(response as Record<string, unknown>);
  }

  async analyzeStream(
    sentence: string,
    onChunk: (chunk: string, isDone: boolean) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!sentence) {
      onError(new Error('缺少句子'));
      return;
    }

    let rawContent = '';

    await this.client.postStream(
      '/analyze',
      {
        prompt: this.createAnalysisPrompt(sentence),
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

  private parseAnalysisResponse(response: Record<string, unknown>): TokenData[] {
    const choices = response.choices as Array<{ message?: { content?: string } }> | undefined;
    if (choices?.[0]?.message?.content) {
      let responseContent = choices[0].message.content;
      
      try {
        // Extract from markdown code blocks
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch?.[1]) {
          responseContent = jsonMatch[1];
        }
        
        // Clean up backticks and find JSON
        responseContent = responseContent.replace(/[`]/g, '').trim();
        
        if (!responseContent.startsWith('[') && !responseContent.startsWith('{')) {
          const jsonStart = responseContent.search(/[\[\{]/);
          if (jsonStart !== -1) {
            responseContent = responseContent.substring(jsonStart);
          }
        }
        
        return JSON.parse(responseContent) as TokenData[];
      } catch (e) {
        console.error("Failed to parse JSON from analysis response:", e, responseContent);
        throw new Error('解析结果JSON格式错误');
      }
    } else {
      console.error('Unexpected API response structure (Analysis):', response);
      throw new Error('解析结果格式错误，请重试');
    }
  }

  // Factory method to create with specific configuration
  static create(config: AnalysisServiceConfig): AnalysisService {
    return new AnalysisService(config);
  }
}