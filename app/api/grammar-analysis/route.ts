import { NextRequest, NextResponse } from 'next/server';

// API密钥从环境变量获取，不暴露给前端
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { sentence, tokens, model = MODEL_NAME, apiUrl, stream = false } = await req.json();
    
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

    if (!sentence || !tokens) {
      return NextResponse.json(
        { error: { message: '缺少必要的句子和词法分析数据' } },
        { status: 400 }
      );
    }

    // 构建多句子语法分析请求
    const grammarPrompt = `你是一个专业的日语语法分析专家。请对以下日语文本进行深度语法结构分析。

原文：${sentence}

词法分析结果：
${JSON.stringify(tokens, null, 2)}

请首先识别文本中的每个句子（以句号、问号、感叹号或换行符分隔），然后对每个句子分别进行详细分析。

请以以下JSON格式返回：

{
  "text_overview": {
    "total_sentences": 句子数量,
    "overall_complexity": "整体复杂度(简单/中等/复杂)",
    "text_type": "文本类型(日常对话/正式文件/文学作品等)",
    "overall_politeness_level": "整体敬语级别"
  },
  "sentences": [
    {
      "sentence_text": "单个句子文本",
      "sentence_tokens": [该句子的词元数组],
      "sentence_structure": {
        "main_clause": {
          "subject": { "tokens": [], "description": "主语及其修饰成分", "grammatical_role": "句子的主题" },
          "predicate": { "tokens": [], "description": "谓语动词或形容词", "grammatical_role": "对主语的陈述" },
          "object": { "tokens": [], "description": "宾语（如果有）", "grammatical_role": "动作的对象" }
        },
        "modifiers": [
          { "type": "修饰类型", "modifier_tokens": [], "modified_tokens": [], "description": "修饰关系说明" }
        ],
        "particles_analysis": [
          { "particle": "助词", "function": "功能", "scope": "作用范围", "detailed_explanation": "详细说明" }
        ]
      },
      "grammatical_patterns": [
        { "pattern": "语法模式", "tokens": [], "explanation": "模式说明" }
      ],
      "dependency_relations": [
        { "governor": "支配词", "dependent": "从属词", "relation": "关系类型", "explanation": "关系说明" }
      ],
      "sentence_type": {
        "type": "句子类型",
        "politeness_level": "敬语级别",
        "formality": "正式度",
        "explanation": "句式特点"
      }
    }
  ],
  "cross_sentence_analysis": {
    "discourse_markers": [
      { "marker": "连接词", "function": "功能", "explanation": "说明" }
    ],
    "topic_flow": "话题迁移分析",
    "coherence_analysis": "连贯性分析"
  },
  "learning_notes": {
    "key_grammar_points": ["重要语法点"],
    "difficulty_level": "N5/N4/N3/N2/N1",
    "common_patterns": ["常见句型"],
    "learning_tips": "整体学习建议",
    "sentence_by_sentence_tips": [
      { "sentence_index": 0, "specific_tips": ["针对第一句的学习要点"] }
    ]
  }
}

分析要求：
1. **句子分割**：根据标点符号和换行符将文本分解为独立的句子
2. **逐句分析**：对每个句子分别进行详细的语法结构分析
3. **主谓宾识别**：识别每个句子的主谓宾关系，包括隐含的主语
4. **助词分析**：详细说明每个助词在各自句子中的功能
5. **跨句分析**：如果有多个句子，分析句子间的关系和连贯性
6. **学习指导**：提供针对每个句子的具体学习要点
7. **难度评估**：评估整体和各句子的难度级别

请确保分析准确、详细，适合中文母语的日语学习者理解。对于多句子文本，请特别注意分析句子间的逻辑关系和话题迁移。`;

    const payload = {
      model: model,
      reasoning_effort: "medium",
      messages: [{ role: "user", content: grammarPrompt }],
      stream: stream
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
      console.error('AI API error (Grammar Analysis):', data);
      return NextResponse.json(
        { error: data.error || { message: '语法分析请求时出错' } },
        { status: response.status }
      );
    }

    // 如果是流式输出
    if (stream) {
      // 将流式响应传回客户端
      const readableStream = response.body;
      if (!readableStream) {
        return NextResponse.json(
          { error: { message: '流式响应创建失败' } },
          { status: 500 }
        );
      }

      // 创建一个新的流式响应
      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // 非流式输出，按原来方式处理
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Server error (Grammar Analysis):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
}