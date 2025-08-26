// API与分析相关的服务函数

export interface TokenData {
  word: string;
  pos: string;
  furigana?: string;
  romaji?: string;
  colorClass?: string; // For grammar-based color assignment
}

// Japanese Grammar Color Theme Interface
export interface JapaneseColorTheme {
  noun: string;       // 名詞 - Dark Charcoal #42433B
  verb: string;       // 動詞 - Primary Red #DF3307
  adjective: string;  // 形容詞 - Warm Brown #8F7E74
  particle: string;   // 助詞 - Warm Brown #8F7E74
  adverb: string;     // 副詞 - Cool Blue-Gray #9FAEB3
  auxiliary: string;  // 助動詞 - Primary Red #DF3307
  other: string;      // その他 - Cool Blue-Gray #9FAEB3
  background: string; // 背景 - Light Beige #DAC8C0
}

// Default Japanese Color Theme
export const DEFAULT_JAPANESE_COLORS: JapaneseColorTheme = {
  noun: '#42433B',       // Dark Charcoal
  verb: '#DF3307',       // Primary Red
  adjective: '#8F7E74',  // Warm Brown
  particle: '#8F7E74',   // Warm Brown
  adverb: '#9FAEB3',     // Cool Blue-Gray
  auxiliary: '#DF3307',  // Primary Red
  other: '#9FAEB3',      // Cool Blue-Gray
  background: '#DAC8C0', // Light Beige
};

// Grammar POS mapping to color theme keys
export const POS_TO_COLOR_KEY: Record<string, keyof JapaneseColorTheme> = {
  '名詞': 'noun',
  '動詞': 'verb',
  '形容詞': 'adjective',
  '助詞': 'particle',
  '副詞': 'adverb',
  '助動詞': 'auxiliary',
  '接続詞': 'other',
  '感動詞': 'other',
  '連体詞': 'other',
  '代名詞': 'noun',
  '形状詞': 'adjective',
  '記号': 'other',
  '接頭辞': 'other',
  '接尾辞': 'other',
  'フィラー': 'other',
  'その他': 'other',
  'default': 'other'
};

export interface WordDetail {
  originalWord: string;
  chineseTranslation: string;
  pos: string;
  furigana?: string;
  romaji?: string;
  dictionaryForm?: string;
  explanation: string;
  colorClass?: string; // For grammar-based color assignment
  
  // Additional fields for enhanced word detail panel
  jlptLevel?: string; // JLPT level (N1, N2, N3, N4, N5)
  frequency?: string; // Frequency level (Very High, High, Medium, Low)
  usageExamples?: string[]; // Usage examples array
  grammarNotes?: string; // Grammar usage notes
  culturalNotes?: string; // Cultural context information
  etymology?: string; // Etymology and historical information
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 默认API地址 - 使用本地API路由
export const DEFAULT_API_URL = "/api";
export const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

// 获取API请求URL
export function getApiEndpoint(endpoint: string): string {
  return `${DEFAULT_API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
}

// 构建请求头
function getHeaders(userApiKey?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  // 如果用户提供了自定义API密钥，则添加到请求头
  if (userApiKey) {
    headers['Authorization'] = `Bearer ${userApiKey}`;
  }
  
  return headers;
}

// 分析日语句子
export async function analyzeSentence(
  sentence: string,
  userApiKey?: string,
  userApiUrl?: string
): Promise<TokenData[]> {
  if (!sentence) {
    throw new Error('缺少句子');
  }

  try {
    const apiUrl = getApiEndpoint('/analyze');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        prompt: `请对以下日语句子进行详细的词法分析，并以JSON数组格式返回结果。每个对象应包含以下字段："word", "pos", "furigana", "romaji"。

请特别注意以下分析要求：
1. 将助动词与对应动词正确结合。如"食べた"应作为一个单词，而不是分开为"食べ"和"た"。
2. 正确识别动词的时态变化，如"いた"是"いる"的过去时，应作为一个完整单词处理。
3. 合理处理助词，应当与前后词汇适当分离。
4. 避免过度分词，特别是对于构成一个语法或语义单位的组合。
5. 对于复合词，如"持って行く"，根据语义和使用习惯确定是作为一个词还是分开处理。
6. 重要：如果待解析的句子中包含换行符，请在对应的位置输出一个JSON对象：{"word": "\n", "pos": "改行", "furigana": "", "romaji": ""}.
7. 如果有空格，请输出：{"word": " ", "pos": "空格", "furigana": "", "romaji": ""}.

确保输出是严格的JSON格式，不包含任何markdown或其他非JSON字符。

待解析句子： "${sentence}"`, 
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Analysis):', errorData);
      throw new Error(`解析失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }
    
    const result = await response.json();

    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      let responseContent = result.choices[0].message.content;
      try {
        // First try to extract from markdown code blocks
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          responseContent = jsonMatch[1];
        }
        
        // Clean up any potential backticks or other problematic characters
        responseContent = responseContent.replace(/[`]/g, '').trim();
        
        // If the content doesn't start with '[' or '{', try to find the JSON part
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
      console.error('Unexpected API response structure (Analysis):', result);
      throw new Error('解析结果格式错误，请重试');
    }
  } catch (error) {
    console.error('Error analyzing sentence:', error);
    throw error;
  }
}

// 流式分析日语句子
export async function streamAnalyzeSentence(
  sentence: string,
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  userApiKey?: string,
  userApiUrl?: string
): Promise<void> {
  if (!sentence) {
    onError(new Error('缺少句子'));
    return;
  }

  try {
    const apiUrl = getApiEndpoint('/analyze');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        prompt: `请对以下日语句子进行详细的词法分析，并以JSON数组格式返回结果。每个对象应包含以下字段："word", "pos", "furigana", "romaji"。

请特别注意以下分析要求：
1. 将助动词与对应动词正确结合。如"食べた"应作为一个单词，而不是分开为"食べ"和"た"。
2. 正确识别动词的时态变化，如"いた"是"いる"的过去时，应作为一个完整单词处理。
3. 合理处理助词，应当与前后词汇适当分离。
4. 避免过度分词，特别是对于构成一个语法或语义单位的组合。
5. 对于复合词，如"持って行く"，根据语义和使用习惯确定是作为一个词还是分开处理。
6. 重要：如果待解析的句子中包含换行符，请在对应的位置输出一个JSON对象：{"word": "\n", "pos": "改行", "furigana": "", "romaji": ""}.
7. 如果有空格，请输出：{"word": " ", "pos": "空格", "furigana": "", "romaji": ""}.

确保输出是严格的JSON格式，不包含任何markdown或其他非JSON字符。

待解析句子： "${sentence}"`, 
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Analysis):', errorData);
      onError(new Error(`流式解析失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率，提高性能
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 16; // 16ms - 1帧更新，更流畅
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      if (isComplete) {
        // 最终结果不需要防抖
        onChunk(content, true);
        return;
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, false);
      }, updateDebounceTime);
    };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理buffer中所有完整的行
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下一次处理
        buffer = lines.pop() || '';
        
        let hasNewContent = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              // 最终结果
              onChunk(rawContent, true);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                rawContent += content;
                hasNewContent = true;
              }
            } catch (e) {
              console.warn('Failed to parse streaming JSON chunk:', e, data);
            }
          }
        }
        
        // 只有在内容有更新时才触发更新
        if (hasNewContent) {
          debouncedUpdate(rawContent, false);
        }
      }
    }
    
    // 处理最后可能剩余的数据
    if (buffer.trim() !== '') {
      if (buffer.startsWith('data: ')) {
        const data = buffer.substring(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              const content = parsed.choices[0].delta.content;
              rawContent += content;
            }
          } catch (e) {
            console.warn('Failed to parse final streaming JSON chunk:', e, data);
          }
        }
      }
    }
    
    // 最终结果
    onChunk(rawContent, true);
  } catch (error) {
    console.error('Error in stream analyzing sentence:', error);
    onError(error instanceof Error ? error : new Error('未知错误'));
  }
}

// 流式翻译文本
export async function streamTranslateText(
  japaneseText: string,
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  userApiKey?: string,
  userApiUrl?: string
): Promise<void> {
  try {
    const apiUrl = getApiEndpoint('/translate');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        text: japaneseText,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Translation):', errorData);
      onError(new Error(`流式翻译失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率，提高性能
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 16; // 16ms - 1帧更新，更流畅
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      if (isComplete) {
        // 最终结果不需要防抖
        onChunk(content, true);
        return;
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, false);
      }, updateDebounceTime);
    };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理buffer中所有完整的行
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下一次处理
        buffer = lines.pop() || '';
        
        let hasNewContent = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              // 最终结果
              onChunk(rawContent, true);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                rawContent += content;
                hasNewContent = true;
              }
            } catch (e) {
              console.warn('Failed to parse streaming JSON chunk:', e, data);
            }
          }
        }
        
        // 只有在内容有更新时才触发更新
        if (hasNewContent) {
          debouncedUpdate(rawContent, false);
        }
      }
    }
    
    // 处理最后可能剩余的数据
    if (buffer.trim() !== '') {
      if (buffer.startsWith('data: ')) {
        const data = buffer.substring(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              const content = parsed.choices[0].delta.content;
              rawContent += content;
            }
          } catch (e) {
            console.warn('Failed to parse final streaming JSON chunk:', e, data);
          }
        }
      }
    }
    
    // 最终结果
    onChunk(rawContent, true);
  } catch (error) {
    console.error('Error in stream translating text:', error);
    onError(error instanceof Error ? error : new Error('未知错误'));
  }
}

// 获取词汇详情
export async function getWordDetails(
  word: string, 
  pos: string, 
  sentence: string, 
  furigana?: string, 
  romaji?: string,
  userApiKey?: string,
  userApiUrl?: string,
  learningMode?: string
): Promise<WordDetail> {
  try {
    const apiUrl = getApiEndpoint('/word-detail');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        word, 
        pos, 
        sentence, 
        furigana, 
        romaji,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        learningMode: learningMode || 'intermediate'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Word Detail):', errorData);
      throw new Error(`查询释义失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      let responseContent = result.choices[0].message.content;
      try {
        // First try to extract from markdown code blocks
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          responseContent = jsonMatch[1];
        }
        
        // Clean up any potential backticks or other problematic characters
        responseContent = responseContent.replace(/[`]/g, '').trim();
        
        // If the content doesn't start with '[' or '{', try to find the JSON part
        if (!responseContent.startsWith('[') && !responseContent.startsWith('{')) {
          const jsonStart = responseContent.search(/[\[\{]/);
          if (jsonStart !== -1) {
            responseContent = responseContent.substring(jsonStart);
          }
        }
        
        return JSON.parse(responseContent) as WordDetail;
      } catch (e) {
        console.error("Failed to parse JSON from word detail response:", e, responseContent);
        throw new Error('释义结果JSON格式错误');
      }
    } else {
      console.error('Unexpected API response structure (Word Detail):', result);
      throw new Error('释义结果格式错误');
    }
  }
  catch (error) {
    console.error('Error fetching word details:', error);
    throw error;
  }
}

// 流式词汇详情查询函数
export async function streamWordDetails(
  word: string,
  pos: string,
  sentence: string,
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  furigana?: string,
  romaji?: string,
  userApiKey?: string,
  userApiUrl?: string,
  learningMode?: string
): Promise<void> {
  try {
    const apiUrl = getApiEndpoint('/word-detail');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        word, 
        pos, 
        sentence, 
        furigana, 
        romaji,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        useStream: true,
        learningMode: learningMode || 'intermediate'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Word Detail):', errorData);
      onError(new Error(`流式查询释义失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 30; // 30ms - 更快的响应
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      if (isComplete) {
        // 最终结果不需要防抖
        onChunk(content, true);
        return;
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, false);
      }, updateDebounceTime);
    };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理buffer中所有完整的行
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下一次处理
        buffer = lines.pop() || '';
        
        let hasNewContent = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              done = true;
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                rawContent += parsed.choices[0].delta.content;
                hasNewContent = true;
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              console.warn('解析流式数据时出错:', e, data);
            }
          }
        }
        
        if (hasNewContent) {
          debouncedUpdate(rawContent, false);
        }
      }
    }
    
    // 发送最终内容
    debouncedUpdate(rawContent, true);
    
  } catch (error) {
    console.error('Stream Word Detail error:', error);
    onError(error instanceof Error ? error : new Error('流式查询词汇详情时出错'));
  }
}

// 翻译文本
export async function translateText(
  japaneseText: string,
  userApiKey?: string,
  userApiUrl?: string
): Promise<string> {
  try {
    const apiUrl = getApiEndpoint('/translate');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        text: japaneseText,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Translation):', errorData);
      throw new Error(`翻译失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      return result.choices[0].message.content.trim();
    } else {
      console.error('Unexpected API response structure (Translation):', result);
      throw new Error('翻译结果格式错误');
    }
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

// 从图片提取文本
export async function extractTextFromImage(
  imageData: string, 
  prompt?: string,
  userApiKey?: string,
  userApiUrl?: string
): Promise<string> {
  try {
    const apiUrl = getApiEndpoint('/image-to-text');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        imageData, 
        prompt,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Image to Text):', errorData);
      throw new Error(`图片文字提取失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }

    const result = await response.json();
    
    // Handle both Gemini native format and OpenAI-compatible format
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
      // Gemini native format
      return result.candidates[0].content.parts[0].text.trim();
    } else if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      // OpenAI-compatible format
      return result.choices[0].message.content.trim();
    } else {
      console.error('Unexpected API response structure (Image to Text):', result);
      throw new Error('图片文字提取结果格式错误');
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

// 从图片提取文本 - 流式版本
export async function streamExtractTextFromImage(
  imageData: string, 
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  prompt?: string,
  userApiKey?: string,
  userApiUrl?: string
): Promise<void> {
  try {
    const apiUrl = getApiEndpoint('/image-to-text');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        imageData, 
        prompt,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Image to Text):', errorData);
      onError(new Error(`流式图片文字提取失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率，提高性能
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 16; // 16ms - 1帧更新，更流畅
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      if (isComplete) {
        // 最终结果不需要防抖
        onChunk(content, true);
        return;
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, false);
      }, updateDebounceTime);
    };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理buffer中所有完整的行
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下一次处理
        buffer = lines.pop() || '';
        
        let hasNewContent = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              // 最终结果
              onChunk(rawContent, true);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              let content = '';
              
              // Handle both Gemini native format and OpenAI-compatible format for image extraction
              if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts && parsed.candidates[0].content.parts[0]) {
                // Gemini native streaming format
                content = parsed.candidates[0].content.parts[0].text || '';
              } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                // OpenAI-compatible streaming format
                content = parsed.choices[0].delta.content;
              }
              
              if (content) {
                rawContent += content;
                hasNewContent = true;
              }
            } catch (e) {
              console.warn('Failed to parse streaming JSON chunk:', e, data);
            }
          }
        }
        
        // 只有在内容有更新时才触发更新
        if (hasNewContent) {
          debouncedUpdate(rawContent, false);
        }
      }
    }
    
    // 处理最后可能剩余的数据
    if (buffer.trim() !== '') {
      if (buffer.startsWith('data: ')) {
        const data = buffer.substring(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            let content = '';
            
            // Handle both Gemini native format and OpenAI-compatible format for final chunk
            if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts && parsed.candidates[0].content.parts[0]) {
              // Gemini native streaming format
              content = parsed.candidates[0].content.parts[0].text || '';
            } else if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
              // OpenAI-compatible streaming format
              content = parsed.choices[0].delta.content;
            }
            
            if (content) {
              rawContent += content;
            }
          } catch (e) {
            console.warn('Failed to parse final streaming JSON chunk:', e, data);
          }
        }
      }
    }
    
    // 最终结果
    onChunk(rawContent, true);
  } catch (error) {
    console.error('Error in stream extracting text from image:', error);
    onError(error instanceof Error ? error : new Error('未知错误'));
  }
}

// 使用Gemini TTS合成语音
export async function synthesizeSpeech(
  text: string,
  provider: 'edge' | 'gemini' = 'edge',
  options: { gender?: 'male' | 'female'; voice?: string; rate?: number; pitch?: number } = {},
  userApiKey?: string
): Promise<{ audio: string; mimeType: string }> {
  const apiUrl = getApiEndpoint('/tts');
  const headers = getHeaders(userApiKey);

  const { gender = 'female', voice = 'Kore', rate = 0, pitch = 0 } = options;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      text, 
      provider,
      gender,
      voice,
      rate,
      pitch
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'TTS 请求失败');
  }

  return response.json();
}

// 聊天API - 流式版本
export async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  userApiKey?: string
): Promise<void> {
  try {
    const apiUrl = getApiEndpoint('/chat');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        messages,
        useStream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Chat):', errorData);
      onError(new Error(`聊天失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 30; // 30ms - 更快的响应
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      if (isComplete) {
        // 最终结果不需要防抖
        onChunk(content, true);
        return;
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, false);
      }, updateDebounceTime);
    };

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 处理buffer中所有完整的行
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到下一次处理
        buffer = lines.pop() || '';
        
        let hasNewContent = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              done = true;
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const delta = parsed.choices[0].delta;
                
                // 处理常规内容
                if (delta.content) {
                  rawContent += delta.content;
                  hasNewContent = true;
                }
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              console.warn('解析聊天流式数据时出错:', e, data);
            }
          }
        }
        
        if (hasNewContent) {
          debouncedUpdate(rawContent, false);
        }
      }
    }
    
    // 发送最终内容
    debouncedUpdate(rawContent, true);
    
  } catch (error) {
    console.error('Stream Chat error:', error);
    onError(error instanceof Error ? error : new Error('聊天时出错'));
  }
}

// 聊天API - 非流式版本
export async function sendChat(
  messages: ChatMessage[],
  userApiKey?: string
): Promise<string> {
  try {
    const apiUrl = getApiEndpoint('/chat');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        messages,
        useStream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Chat):', errorData);
      throw new Error(`聊天失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }

    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      return result.choices[0].message.content.trim();
    } else {
      console.error('Unexpected API response structure (Chat):', result);
      throw new Error('聊天结果格式错误');
    }
  } catch (error) {
    console.error('Error sending chat:', error);
    throw error;
  }
}

// 单个句子的语法分析数据接口
export interface SentenceGrammarAnalysis {
  sentence_text: string;
  sentence_tokens: TokenData[];
  sentence_structure: {
    main_clause: {
      subject?: { tokens: TokenData[]; description: string; grammatical_role: string; };
      predicate?: { tokens: TokenData[]; description: string; grammatical_role: string; };
      object?: { tokens: TokenData[]; description: string; grammatical_role: string; };
    };
    modifiers: Array<{
      type: string;
      modifier_tokens: TokenData[];
      modified_tokens: TokenData[];
      description: string;
    }>;
    particles_analysis: Array<{
      particle: string;
      function: string;
      scope: string;
      detailed_explanation: string;
    }>;
  };
  grammatical_patterns: Array<{
    pattern: string;
    tokens: TokenData[];
    explanation: string;
  }>;
  dependency_relations: Array<{
    governor: string;
    dependent: string;
    relation: string;
    explanation: string;
  }>;
  sentence_type: {
    type: string;
    politeness_level: string;
    formality: string;
    explanation: string;
  };
}

// 多句子语法分析数据接口
export interface GrammarAnalysis {
  text_overview: {
    total_sentences: number;
    overall_complexity: string;
    text_type: string;
    overall_politeness_level: string;
  };
  sentences: SentenceGrammarAnalysis[];
  cross_sentence_analysis?: {
    discourse_markers: Array<{
      marker: string;
      function: string;
      explanation: string;
    }>;
    topic_flow: string;
    coherence_analysis: string;
  };
  learning_notes: {
    key_grammar_points: string[];
    difficulty_level: string;
    common_patterns: string[];
    learning_tips: string;
    sentence_by_sentence_tips: Array<{
      sentence_index: number;
      specific_tips: string[];
    }>;
  };
}

// 语法分析函数
export async function analyzeGrammar(
  sentence: string,
  tokens: TokenData[],
  userApiKey?: string,
  userApiUrl?: string
): Promise<GrammarAnalysis> {
  if (!sentence || !tokens) {
    throw new Error('缺少句子或词法分析数据');
  }

  try {
    const apiUrl = getApiEndpoint('/grammar-analysis');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        sentence,
        tokens,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Grammar Analysis):', errorData);
      throw new Error(`语法分析失败：${errorData.error?.message || response.statusText || '未知错误'}`);
    }
    
    const result = await response.json();

    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      let responseContent = result.choices[0].message.content;
      try {
        // First try to extract from markdown code blocks
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          responseContent = jsonMatch[1];
        }
        
        // Clean up any potential backticks or other problematic characters
        responseContent = responseContent.replace(/[`]/g, '').trim();
        
        // If the content doesn't start with '[' or '{', try to find the JSON part
        if (!responseContent.startsWith('[') && !responseContent.startsWith('{')) {
          const jsonStart = responseContent.search(/[\[\{]/);
          if (jsonStart !== -1) {
            responseContent = responseContent.substring(jsonStart);
          }
        }
        
        return JSON.parse(responseContent) as GrammarAnalysis;
      } catch (e) {
        console.error("Failed to parse JSON from grammar analysis response:", e, responseContent);
        throw new Error('语法分析结果JSON格式错误');
      }
    } else {
      console.error('Unexpected API response structure (Grammar Analysis):', result);
      throw new Error('语法分析结果格式错误，请重试');
    }
  } catch (error) {
    console.error('Error analyzing grammar:', error);
    throw error;
  }
}

// 流式语法分析函数
export async function streamGrammarAnalysis(
  sentence: string,
  tokens: TokenData[],
  onChunk: (chunk: string, isDone: boolean) => void,
  onError: (error: Error) => void,
  userApiKey?: string,
  userApiUrl?: string
): Promise<void> {
  if (!sentence || !tokens) {
    onError(new Error('缺少句子或词法分析数据'));
    return;
  }

  try {
    const apiUrl = getApiEndpoint('/grammar-analysis');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        sentence,
        tokens,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error (Stream Grammar Analysis):', errorData);
      onError(new Error(`流式语法分析失败：${errorData.error?.message || response.statusText || '未知错误'}`));
      return;
    }
    
    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('无法创建流式读取器'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let rawContent = '';
    let done = false;
    
    // 添加防抖，减少UI更新频率，提高性能
    let updateTimeout: NodeJS.Timeout | null = null;
    const updateDebounceTime = 100; // 100ms防抖
    
    const debouncedUpdate = (content: string, isComplete: boolean) => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      updateTimeout = setTimeout(() => {
        onChunk(content, isComplete);
      }, isComplete ? 0 : updateDebounceTime);
    };

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        
        // 处理SSE格式的数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              done = true;
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                rawContent += parsed.choices[0].delta.content;
                debouncedUpdate(rawContent, false);
              }
            } catch {
              // 忽略解析错误，继续处理
            }
          }
        }
      }
    }
    
    // 发送最终内容
    debouncedUpdate(rawContent, true);
    
  } catch (error) {
    console.error('Stream Grammar Analysis error:', error);
    onError(error instanceof Error ? error : new Error('语法分析时出错'));
  }
}

// 翻译单个词汇
export async function translateToken(
  token: TokenData,
  userApiKey?: string,
  userApiUrl?: string
): Promise<string> {
  try {
    console.log(`Starting translation for token: "${token.word}" (${token.pos})`);
    
    const apiUrl = getApiEndpoint('/analyze');
    const headers = getHeaders(userApiKey);
    
    // 构建简单的翻译请求，专门针对单个词汇
    const translationPrompt = `将日语词汇"${token.word}"翻译成中文。只回答中文翻译，不要添加其他内容。`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: translationPrompt,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API Error translating "${token.word}":`, errorData);
      return `${token.word}(翻译失败)`;
    }
    
    const result = await response.json();

    if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
      let translation = result.choices[0].message.content.trim();
      
      console.log(`Token translation for "${token.word}": "${translation}"`);
      
      // 清理翻译结果，移除不必要的格式和标点
      translation = translation.replace(/[。！？、，]/g, '');
      translation = translation.replace(/["'「」『』]/g, '');
      translation = translation.trim();
      
      console.log(`Cleaned translation for "${token.word}": "${translation}"`);
      
      // 如果翻译结果为空或包含日文字符（仅检测假名），返回标记
      if (!translation || /[\u3040-\u309F\u30A0-\u30FF]/.test(translation)) {
        console.log(`Translation rejected for "${token.word}": empty or contains Japanese kana`);
        return `${token.word}(待翻译)`;
      }
      
      return translation;
    } else {
      console.error('Unexpected API response structure (Token Translation):', result);
      return `${token.word}(翻译失败)`;
    }
  } catch (error) {
    console.error('Error translating token:', error);
    return `${token.word}(翻译错误)`;
  }
}

// 批量翻译词汇
export async function batchTranslateTokens(
  tokens: TokenData[],
  userApiKey?: string,
  userApiUrl?: string
): Promise<Record<string, string>> {
  try {
    console.log(`Starting batch translation for ${tokens.length} tokens`);
    
    const apiUrl = getApiEndpoint('/batch-translate');
    const headers = getHeaders(userApiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tokens,
        model: MODEL_NAME,
        apiUrl: userApiUrl !== DEFAULT_API_URL ? userApiUrl : undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Batch translation API error:', errorData);
      
      // 返回错误标记的字典
      const errorDict: Record<string, string> = {};
      tokens.forEach(token => {
        if (token.pos !== '改行' && token.pos !== '空格') {
          errorDict[token.word] = `${token.word}(批量翻译失败)`;
        }
      });
      return errorDict;
    }
    
    const result = await response.json();
    
    if (result.translations) {
      console.log(`Batch translation completed: ${result.successful}/${result.processed} tokens`);
      return result.translations;
    } else {
      console.error('Unexpected batch translation response:', result);
      
      // 返回错误标记的字典
      const errorDict: Record<string, string> = {};
      tokens.forEach(token => {
        if (token.pos !== '改行' && token.pos !== '空格') {
          errorDict[token.word] = `${token.word}(响应错误)`;
        }
      });
      return errorDict;
    }
  } catch (error) {
    console.error('Error in batch translation:', error);
    
    // 返回错误标记的字典
    const errorDict: Record<string, string> = {};
    tokens.forEach(token => {
      if (token.pos !== '改行' && token.pos !== '空格') {
        errorDict[token.word] = `${token.word}(网络错误)`;
      }
    });
    return errorDict;
  }
}