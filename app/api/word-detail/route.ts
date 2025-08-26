import { NextRequest, NextResponse } from 'next/server';

// API密钥从环境变量获取，不暴露给前端
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { word, pos, sentence, furigana, romaji, model = MODEL_NAME, apiUrl, useStream = false, learningMode = 'intermediate' } = await req.json();
    
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

    if (!word || !pos || !sentence) {
      return NextResponse.json(
        { error: { message: '缺少必要的参数' } },
        { status: 400 }
      );
    }

    // 构建上下文信息
    let contextWordInfo = `单词 "${word}" (词性: ${pos}`;
    if (furigana) contextWordInfo += `, 读音: ${furigana}`;
    if (romaji) contextWordInfo += `, 罗马音: ${romaji}`;
    contextWordInfo += `)`;

    // 根据学习模式构建不同的提示
    let detailPrompt = '';
    
    if (learningMode === 'beginner') {
      detailPrompt = `在日语句子 "${sentence}" 的上下文中，${contextWordInfo} 的具体含义是什么？请提供基础学习者需要的信息，以严格的JSON对象格式返回，不要包含任何markdown或其他非JSON字符：

{
  "originalWord": "${word}",
  "chineseTranslation": "精确的中文翻译",
  "pos": "${pos}",
  "furigana": "${furigana || ''}",
  "romaji": "${romaji || ''}",
  "dictionaryForm": "辞书形（如果适用）",
  "explanation": "简单易懂的中文解释",
  "jlptLevel": "JLPT等级（N1, N2, N3, N4, N5之一）",
  "frequency": "使用频率（Very High, High, Medium, Low之一）"
}`;
    } else if (learningMode === 'intermediate') {
      detailPrompt = `在日语句子 "${sentence}" 的上下文中，${contextWordInfo} 的具体含义是什么？请提供中级学习者需要的信息，以严格的JSON对象格式返回，不要包含任何markdown或其他非JSON字符：

{
  "originalWord": "${word}",
  "chineseTranslation": "精确的中文翻译",
  "pos": "${pos}",
  "furigana": "${furigana || ''}",
  "romaji": "${romaji || ''}",
  "dictionaryForm": "辞书形（如果适用）",
  "explanation": "详细的中文解释（使用【】高亮关键术语）",
  "jlptLevel": "JLPT等级（N1, N2, N3, N4, N5之一）",
  "frequency": "使用频率（Very High, High, Medium, Low之一）",
  "usageExamples": ["例句1：日文 → 中文翻译", "例句2：日文 → 中文翻译"],
  "grammarNotes": "语法使用说明",
  "culturalNotes": "文化背景说明（如果适用）"
}`;
    } else { // advanced
      detailPrompt = `在日语句子 "${sentence}" 的上下文中，${contextWordInfo} 的具体含义是什么？请提供高级学习者需要的完整信息，以严格的JSON对象格式返回，不要包含任何markdown或其他非JSON字符：

{
  "originalWord": "${word}",
  "chineseTranslation": "精确的中文翻译",
  "pos": "${pos}",
  "furigana": "${furigana || ''}",
  "romaji": "${romaji || ''}",
  "dictionaryForm": "辞书形（如果适用）",
  "explanation": "详尽的中文解释（包含语法、词形变化规则、助词用法，使用【】高亮关键术语和 \\n 换行）",
  "jlptLevel": "JLPT等级（N1, N2, N3, N4, N5之一）",
  "frequency": "使用频率（Very High, High, Medium, Low之一）",
  "usageExamples": ["例句1：日文 → 中文翻译", "例句2：日文 → 中文翻译", "例句3：日文 → 中文翻译"],
  "grammarNotes": "详细语法使用说明",
  "culturalNotes": "文化背景说明（如果适用）",
  "etymology": "词源说明（如果适用）"
}`;
    }

    const payload = {
      model: model,
      reasoning_effort: "none",
      messages: [{ role: "user", content: detailPrompt }],
      stream: useStream
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
      console.error('AI API error (Word Detail):', data);
      return NextResponse.json(
        { error: data.error || { message: '获取词汇详情时出错' } },
        { status: response.status }
      );
    }

    // 如果是流式请求，直接返回流式响应
    if (useStream && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // 非流式请求，返回完整响应
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error (Word Detail):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
}