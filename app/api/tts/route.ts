import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.API_KEY || '';
const TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
const MODEL_NAME = 'gemini-2.5-flash-preview-tts';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'Kore', model = MODEL_NAME } = await req.json();

    const authHeader = req.headers.get('Authorization');
    const userApiKey = authHeader ? authHeader.replace('Bearer ', '') : '';
    const effectiveApiKey = userApiKey || API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: { message: '未提供API密钥，请在设置中配置API密钥或联系管理员配置服务器密钥' } },
        { status: 500 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: { message: '缺少必要的文本内容' } },
        { status: 400 }
      );
    }

    const payload = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
        }
      },
      model
    };

    const response = await fetch(`${TTS_URL}?key=${effectiveApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('TTS API error:', data);
      return NextResponse.json(
        { error: data.error || { message: 'TTS 请求失败' } },
        { status: response.status }
      );
    }

    const result = await response.json();
    const inlineData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData) {
      return NextResponse.json(
        { error: { message: '无有效音频数据' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ audio: inlineData.data, mimeType: inlineData.mimeType });
  } catch (error) {
    console.error('Server error (TTS):', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : '服务器错误' } },
      { status: 500 }
    );
  }
}
