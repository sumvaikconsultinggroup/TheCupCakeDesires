'use client'

import { useEffect } from 'react'
import { logError, extractErrorDetails } from '@/utils/errorLogger'

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

      logError(errorData)

      // Also log via API
      if (typeof window !== 'undefined') {
        fetch('/api/errors/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              message: event.message,
              stack: event.error?.stack,
            },
            context: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              route: window.location.pathname,
            },
          }),
        }).catch(() => {
          // Silently fail
        })
      }
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

      logError(errorData)

      // Also log via API
      if (typeof window !== 'undefined') {
        fetch('/api/errors/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              message: event.reason?.message || String(event.reason),
              stack: event.reason?.stack,
            },
            context: {
              route: window.location.pathname,
              type: 'unhandled-promise-rejection',
            },
          }),
        }).catch(() => {
          // Silently fail
        })
      }
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
