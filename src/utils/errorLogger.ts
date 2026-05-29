import { v4 as uuidv4 } from 'uuid'

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

/**
 * Logs errors to the database (server-side only)
 * This function should only be called from server-side code (API routes, server actions)
 */
export async function logErrorToDatabase(errorData: ErrorLogData): Promise<void> {
  // Only import mongoose models on server-side
  if (typeof window !== 'undefined') {
    // Client-side: use API route instead
    return logErrorViaAPI(errorData)
  }

  try {
    // Dynamic import for server-side only
    const ErrorLog = (await import('@/models/ErrorLog')).default
    const connectDb = (await import('@/lib/mongodb')).default

    await connectDb()

    const errorId = `ERR-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
    const environment =
      (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'production'

    await ErrorLog.create({
      errorId,
      level: errorData.level || 'error',
      message: errorData.message,
      stack: errorData.stack,
      component: errorData.component,
      route: errorData.route,
      userId: errorData.userId,
      userEmail: errorData.userEmail,
      userAgent: errorData.userAgent,
      ipAddress: errorData.ipAddress,
      requestMethod: errorData.requestMethod,
      requestUrl: errorData.requestUrl,
      requestBody: errorData.requestBody,
      responseStatus: errorData.responseStatus,
      environment,
      context: errorData.context,
      resolved: false,
    })
  } catch (logError) {
    // Fallback to console if database logging fails
    console.error('Failed to log error to database:', logError)
    console.error('Original error:', errorData)
  }
}

/**
 * Logs errors via API route (client-side)
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
  // Check if we're on client-side
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    logErrorViaAPI(errorData).catch(() => {
      // Silently fail
    })
  } else {
    // Server-side: use direct database logging
    logErrorToDatabase(errorData).catch((err) => {
      console.error('Error logging failed:', err)
    })
  }
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

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('auth')) {
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
