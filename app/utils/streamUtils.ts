export interface StreamProcessor {
  processLine: (line: string) => boolean;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export async function processStreamResponse(
  response: Response,
  processor: StreamProcessor
): Promise<void> {
  if (!response.ok) {
    const errorData = await response.json();
    processor.onError(new Error(errorData.error?.message || response.statusText || '未知错误'));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    processor.onError(new Error('无法创建流式读取器'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  try {
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const shouldContinue = processor.processLine(line);
          if (!shouldContinue) {
            done = true;
            break;
          }
        }
      }
    }

    if (buffer.trim() !== '') {
      processor.processLine(buffer);
    }

    processor.onComplete();
  } catch (error) {
    processor.onError(error instanceof Error ? error : new Error('流处理错误'));
  }
}

export function createGeminiStreamProcessor(
  onContent: (content: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): StreamProcessor {
  let rawContent = '';

  return {
    processLine: (line: string) => {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        
        if (data === '[DONE]') {
          onDone();
          return false;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.choices?.[0]?.delta?.content) {
            rawContent += parsed.choices[0].delta.content;
            onContent(rawContent);
          }
        } catch (e) {
          console.warn('解析流式JSON数据时出错:', e, data);
        }
      }
      return true;
    },
    onComplete: onDone,
    onError,
  };
}