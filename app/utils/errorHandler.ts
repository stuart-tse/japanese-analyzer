export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiError(
  error: unknown,
  defaultMessage: string = '未知错误'
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, undefined, error);
  }

  if (typeof error === 'string') {
    return new ApiError(error);
  }

  return new ApiError(defaultMessage, undefined, error);
}

export async function handleApiResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    let errorMessage = response.statusText || '请求失败';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch {
      // Ignore JSON parsing errors for error response
    }
    
    throw new ApiError(
      `${errorMessage} (${response.status})`,
      response.status
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('响应格式错误', response.status, error);
  }
}

export function logError(error: unknown, context: string): void {
  if (error instanceof ApiError) {
    console.error(`API Error in ${context}:`, {
      message: error.message,
      statusCode: error.statusCode,
      originalError: error.originalError,
    });
  } else {
    console.error(`Error in ${context}:`, error);
  }
}