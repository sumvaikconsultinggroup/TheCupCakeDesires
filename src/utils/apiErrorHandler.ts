import { NextRequest, NextResponse } from 'next/server'
import { logErrorToDatabase, extractErrorDetails, getUserFriendlyErrorMessage } from './errorLogger'

/**
 * Wrapper for API route handlers to catch and log errors
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error: any) {
      // Extract error details
      const errorData = extractErrorDetails(error, {
        source: 'api-route',
        route: request.url,
      })

      // Add request information
      errorData.requestMethod = request.method
      errorData.requestUrl = request.url
      errorData.userAgent = request.headers.get('user-agent') || undefined
      errorData.ipAddress =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

      // Try to get request body if available
      try {
        const body = await request.clone().json().catch(() => null)
        if (body) {
          errorData.requestBody = body
        }
      } catch (e) {
        // Ignore body parsing errors
      }

      // Log to database
      await logErrorToDatabase(errorData)

      // Get user-friendly error message
      const userFriendlyMessage = getUserFriendlyErrorMessage(error)

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: userFriendlyMessage,
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
            stack: error.stack,
          }),
        },
        { status: error.statusCode || 500 }
      )
    }
  }
}

/**
 * Helper to create error responses
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details && { details }),
    },
    { status: statusCode }
  )
}
