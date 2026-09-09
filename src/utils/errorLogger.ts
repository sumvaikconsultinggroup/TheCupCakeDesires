export interface ErrorLogData {
  level?: 'error' | 'warning' | 'info' | 'critical'
  message: string
  stack?: string
  component?: string
  route?: string
  userId?: string
  userEmail?: string
  userAgent?: string
  ipAddress?: string
  requestMethod?: string
  requestUrl?: string
  requestBody?: Record<string, any>
  responseStatus?: number
  context?: Record<string, any>
}

/** Browser-extension and other client noise that must never hit Mongo. */
export function isIgnorableClientError(errorData: Partial<ErrorLogData> | Record<string, any> | null | undefined): boolean {
  if (!errorData) return false
  const context = (errorData as ErrorLogData).context || {}
  const haystack = [
    errorData.message,
    errorData.stack,
    (errorData as ErrorLogData).component,
    context.filename,
    context.stack,
    context.message,
    typeof context.rawError === 'object' && context.rawError
      ? JSON.stringify(context.rawError)
      : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes('chrome-extension://') ||
    haystack.includes('moz-extension://') ||
    haystack.includes('safari-extension://') ||
    haystack.includes('safari-web-extension://')
  )
}

/**
 * Logs errors via API route (client-side).
 * Server-side DB persistence lives in `errorLogger.server.ts` so webpack
 * never traces Mongo/`dns` into client components that import this file.
 */
async function logErrorViaAPI(errorData: ErrorLogData): Promise<void> {
  try {
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          message: errorData.message,
          stack: errorData.stack,
        },
        context: errorData,
      }),
    })
  } catch (apiError) {
    // Silently fail if API logging fails
    console.error('Failed to log error via API:', apiError)
  }
}

/**
 * Logs errors without blocking (fire and forget)
 * Works on both client and server side
 */
export function logError(errorData: ErrorLogData): void {
  if (isIgnorableClientError(errorData)) return

  if (typeof window !== 'undefined') {
    logErrorViaAPI(errorData).catch(() => {
      // Silently fail
    })
    return
  }

  // Server callers that need Mongo should import `logErrorToDatabase`
  // from `errorLogger.server.ts` so this client-safe module stays free of `dns`.
  console.error(errorData.message, errorData)
}

/**
 * Helper to extract user-friendly error messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }

    // Authentication errors (avoid matching substrings like "author" in React error dumps)
    if (
      message.includes('unauthorized') ||
      /\bunauthorized\b/.test(message) ||
      /\b401\b/.test(message) ||
      message.includes('not authenticated') ||
      message.includes('please log in') ||
      /\bauth(entication|orization)?\s+(error|failed|required)\b/.test(message)
    ) {
      return 'You are not authorized to perform this action. Please log in and try again.'
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'The information you provided is invalid. Please check and try again.'
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource could not be found.'
    }

    // Server errors
    if (message.includes('server') || message.includes('500')) {
      return 'Something went wrong on our end. Our team has been notified and we are working on fixing it.'
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.'
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many requests. Please wait a moment and try again.'
    }

    // Generic error fallback
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
}

/**
 * Extract error details for logging
 */
export function extractErrorDetails(error: unknown, context?: Record<string, any>): ErrorLogData {
  const errorData: ErrorLogData = {
    message: 'Unknown error',
    level: 'error',
    context,
  }

  if (error instanceof Error) {
    errorData.message = error.message
    errorData.stack = error.stack
  } else if (typeof error === 'string') {
    errorData.message = error
  } else if (error && typeof error === 'object') {
    errorData.message = JSON.stringify(error)
    errorData.context = { ...context, rawError: error }
  }

  return errorData
}
