import { NextRequest, NextResponse } from 'next/server';

// API密钥从环境变量获取，不暴露给前端
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

interface TokenData {
  word: string;
  pos: string;
  furigana?: string;
  romaji?: string;
}

interface TokenTranslationResult {
  [word: string]: string;
}

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { tokens, model = MODEL_NAME, apiUrl } = await req.json();
    
    // 从请求头中获取用户提供的API密钥（如果有）
    const authHeader = req.headers.get('Authorization');
    const userApiKey = authHeader ? authHeader.replace('Bearer ', '') : '';
    
    // 优先使用用户API密钥，如果没有则使用环境变量中的密钥
    const effectiveApiKey = userApiKey || API_KEY;
    
    // 优先使用用户提供的API URL，否则使用环境变量中的URL
    const effectiveApiUrl = apiUrl || API_URL;
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: { message: '未提供API密钥，请在设置中配置API密钥或联系管理员配置服务器密钥' } },
        { status: 500 }
      );
    }

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: { message: '缺少词汇列表' } },
        { status: 400 }
      );
    }

    // 过滤掉布局词汇（换行、空格等）
    const contentTokens = tokens.filter((token: TokenData) => 
      token.pos !== '改行' && token.pos !== '空格'
    );

    if (contentTokens.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    // 构建批量翻译请求
    const tokenList = contentTokens.map((token: TokenData, index: number) => 
      `${index + 1}. ${token.word} (${token.pos}${token.furigana ? `, 读音: ${token.furigana}` : ''})`
    ).join('\n');

    const batchPrompt = `请将以下日语词汇批量翻译成简体中文。请按照以下JSON格式返回，不要添加任何markdown或其他格式：

日语词汇列表：
${tokenList}

请返回以下JSON格式的翻译结果：
{
  "${contentTokens[0]?.word}": "中文翻译",
  "${contentTokens[1]?.word}": "中文翻译",
  ...
}

要求：
1. 只返回纯JSON对象，不要任何markdown格式
2. 每个词汇提供准确的中文翻译
3. 保持原始日语词汇作为键名
4. 翻译要简洁准确，不要添加解释`;

    const payload = {
      model: model,
      reasoning_effort: "none",
      messages: [{ role: "user", content: batchPrompt }]
    };

    // 发送到实际的AI API
    const response = await fetch(effectiveApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('AI API error (Batch Translation):', data);
      return NextResponse.json(
        { error: data.error || { message: '批量翻译请求时出错' } },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      let responseContent = data.choices[0].message.content.trim();
      
      try {
        // 尝试提取JSON内容
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          responseContent = jsonMatch[1];
        }
        
        // 清理可能的格式问题
        responseContent = responseContent.replace(/[`]/g, '').trim();
        
        // 如果不以{开头，尝试找到JSON部分
        if (!responseContent.startsWith('{')) {
          const jsonStart = responseContent.indexOf('{');
          const jsonEnd = responseContent.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            responseContent = responseContent.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        const translations: TokenTranslationResult = JSON.parse(responseContent);
        
        // 验证翻译结果
        const validatedTranslations: TokenTranslationResult = {};
        for (const token of contentTokens) {
          const translation = translations[token.word];
          if (translation && typeof translation === 'string') {
            // 清理翻译结果
            let cleanTranslation = translation.trim();
            cleanTranslation = cleanTranslation.replace(/[。！？、，]/g, '');
            cleanTranslation = cleanTranslation.replace(/["'「」『』]/g, '');
            cleanTranslation = cleanTranslation.trim();
            
            // 验证不是空或包含日文假名
            if (cleanTranslation && !/[\u3040-\u309F\u30A0-\u30FF]/.test(cleanTranslation)) {
              validatedTranslations[token.word] = cleanTranslation;
            } else {
              validatedTranslations[token.word] = `${token.word}(待翻译)`;
            }
          } else {
            validatedTranslations[token.word] = `${token.word}(未找到)`;
          }
        }
        
        return NextResponse.json({ 
          translations: validatedTranslations,
          processed: contentTokens.length,
          successful: Object.keys(validatedTranslations).length
        });
        
      } catch (parseError) {
        console.error('Failed to parse batch translation JSON:', parseError, responseContent);
        return NextResponse.json(
          { error: { message: '批量翻译结果解析失败' } },
          { status: 500 }
        );
      }
    } else {
      console.error('Unexpected API response structure (Batch Translation):', data);
      return NextResponse.json(
        { error: { message: '批量翻译响应格式错误' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error (Batch Translation):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
}