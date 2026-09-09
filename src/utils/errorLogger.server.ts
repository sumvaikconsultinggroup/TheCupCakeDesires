import { v4 as uuidv4 } from 'uuid'
import { isIgnorableClientError, type ErrorLogData } from './errorLogger'

/**
 * Persist an error to Mongo. Import this only from server code (API routes,
 * server actions) — never from `'use client'` modules.
 */
export async function logErrorToDatabase(errorData: ErrorLogData): Promise<void> {
  if (isIgnorableClientError(errorData)) return
  if (typeof window !== 'undefined') return

  try {
    const mongoose = (await import('mongoose')).default
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      const cached = (globalThis as { mongoose?: { lastFailAt?: number } }).mongoose
      if (cached?.lastFailAt && Date.now() - cached.lastFailAt < 20000) return
    }

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
    console.error('Failed to log error to database:', logError)
    console.error('Original error:', errorData)
  }
}
