import { NextRequest, NextResponse } from 'next/server'
import { logErrorToDatabase, extractErrorDetails } from '@/utils/errorLogger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context } = body

    // Extract error details
    const errorData = extractErrorDetails(error, {
      ...context,
      source: 'api',
    })

    // Add request information
    errorData.requestMethod = request.method
    errorData.requestUrl = request.url
    errorData.userAgent = request.headers.get('user-agent') || undefined
    errorData.ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined

    // Log to database (best-effort — never fail the caller when MongoDB is down)
    try {
      await logErrorToDatabase(errorData)
    } catch (logError) {
      console.error('Failed to log error via API (database unavailable):', logError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Error logged successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Failed to log error via API:', error)
    return NextResponse.json(
      {
        success: true,
        message: 'Error received',
      },
      { status: 200 }
    )
  }
}
