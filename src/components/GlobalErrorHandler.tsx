'use client'

import { useEffect } from 'react'
import { extractErrorDetails, isIgnorableClientError, logError } from '@/utils/errorLogger'

/**
 * Global error handler component that catches unhandled errors and promise rejections
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const errorData = extractErrorDetails(event.error || new Error(event.message), {
        source: 'global-error-handler',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })

      if (typeof window !== 'undefined') {
        errorData.route = window.location.pathname
        errorData.userAgent = navigator.userAgent
      }

      if (isIgnorableClientError(errorData)) return

      // logError already POSTs to /api/errors/log on the client — do not fetch twice.
      logError(errorData)
    }

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorData = extractErrorDetails(event.reason, {
        source: 'unhandled-promise-rejection',
      })

      if (typeof window !== 'undefined') {
        errorData.route = window.location.pathname
        errorData.userAgent = navigator.userAgent
      }

      if (isIgnorableClientError(errorData)) return

      logError(errorData)
    }

    // Add event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
