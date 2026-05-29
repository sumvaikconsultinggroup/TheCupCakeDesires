/**
 * Application Logger
 * 
 * Centralized logging system that stores logs in MongoDB
 * and also outputs to console for development
 */

import connectDb from '@/lib/mongodb'
import mongoose from 'mongoose'

// Lazy load Log model to prevent circular dependencies and ensure it's available
let Log = null
function getLogModel() {
  try {
    if (!Log && mongoose.models.Log) {
      Log = mongoose.models.Log
    }
    return Log
  } catch (e) {
    return null
  }
}

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
}

/**
 * Log categories
 */
export const LogCategory = {
  ORDER: 'order',
  PAYMENT: 'payment',
  PRODUCT: 'product',
  USER: 'user',
  SECURITY: 'security',
  API: 'api',
  DATABASE: 'database',
  EMAIL: 'email',
  SHIPMENT: 'shipment',
  SYSTEM: 'system',
  VALIDATION: 'validation',
  PRICE: 'price',
}

/**
 * Get request metadata from a request object
 */
function getRequestMetadata(request) {
  const metadata = {}
  
  if (request) {
    try {
      if (request.url) {
        const url = new URL(request.url)
        metadata.url = request.url
        metadata.method = request.method || 'GET'
        metadata.ip = request.headers?.get('x-forwarded-for') || 
                     request.headers?.get('x-real-ip') || 
                     'unknown'
        metadata.userAgent = request.headers?.get('user-agent') || 'unknown'
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }
  
  return metadata
}

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Main logging function
 */
async function log(level, category, message, details = {}, options = {}) {
  const {
    userId,
    orderId,
    requestId,
    request,
    error,
    tags = [],
    skipConsole = false,
  } = options

  // Prepare log data
  const logData = {
    level,
    category,
    message,
    details: {
      ...details,
      ...(error && {
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack,
      }),
    },
    userId,
    orderId,
    requestId: requestId || generateRequestId(),
    tags: Array.isArray(tags) ? tags : [tags],
    ...getRequestMetadata(request),
  }

  // Console output (always in development, errors/warnings in production)
  if (!skipConsole) {
    const consoleMethod = level === 'error' || level === 'critical' ? 'error' :
                         level === 'warn' ? 'warn' :
                         level === 'debug' ? 'debug' : 'log'
    
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
    }[level] || '📝'

    const color = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      critical: '\x1b[35m', // Magenta
    }[level] || '\x1b[0m'

    const reset = '\x1b[0m'

    if (process.env.NODE_ENV === 'development' || level === 'error' || level === 'critical' || level === 'warn') {
      console[consoleMethod](
        `${color}${emoji} [${level.toUpperCase()}] [${category}]${reset}`,
        message,
        details && Object.keys(details).length > 0 ? details : '',
        error ? `\nError: ${error.message}\n${error.stack}` : ''
      )
    }
  }

  // Store in database (async, don't block - fire and forget)
  // Return a promise that resolves immediately but logs in background
  return new Promise((resolve) => {
    // Use setImmediate to ensure this doesn't block the main thread
    setImmediate(async () => {
      try {
        await connectDb()
        // Lazy load Log model
        const LogModel = getLogModel()
        if (LogModel) {
          await LogModel.create(logData)
        }
    } catch (dbError) {
      // Silently fail - logging should never break the application
      // Errors are handled gracefully without console output
    }
    })
    // Resolve immediately so caller doesn't wait
    resolve()
  })
}

/**
 * Logger API
 */
export const logger = {
  /**
   * Debug logs (development only)
   */
  debug: (category, message, details, options) => {
    if (process.env.NODE_ENV === 'development') {
      return log(LogLevel.DEBUG, category, message, details, options)
    }
  },

  /**
   * Info logs
   */
  info: (category, message, details, options) => {
    return log(LogLevel.INFO, category, message, details, options)
  },

  /**
   * Warning logs
   */
  warn: (category, message, details, options) => {
    return log(LogLevel.WARN, category, message, details, options)
  },

  /**
   * Error logs
   */
  error: (category, message, errorOrDetails, options = {}) => {
    const details = errorOrDetails instanceof Error 
      ? {} 
      : errorOrDetails || {}
    const error = errorOrDetails instanceof Error 
      ? errorOrDetails 
      : null
    
    return log(LogLevel.ERROR, category, message, details, { ...options, error })
  },

  /**
   * Critical logs (requires immediate attention)
   */
  critical: (category, message, errorOrDetails, options = {}) => {
    const details = errorOrDetails instanceof Error 
      ? {} 
      : errorOrDetails || {}
    const error = errorOrDetails instanceof Error 
      ? errorOrDetails 
      : null
    
    return log(LogLevel.CRITICAL, category, message, details, { ...options, error })
  },

  /**
   * Log order-related events
   */
  order: {
    created: (orderId, details, options) => {
      return log(LogLevel.INFO, LogCategory.ORDER, 'Order created', details, {
        ...options,
        orderId,
        tags: ['order-created'],
      })
    },
    
    priceIssue: (orderId, details, options) => {
      return log(LogLevel.CRITICAL, LogCategory.PRICE, 'Order price issue detected', details, {
        ...options,
        orderId,
        tags: ['price-issue', 'zero-price', 'critical'],
      })
    },
    
    validationFailed: (orderId, reason, details, options) => {
      return log(LogLevel.WARN, LogCategory.VALIDATION, `Order validation failed: ${reason}`, details, {
        ...options,
        orderId,
        tags: ['validation-failed'],
      })
    },
    
    paymentFailed: (orderId, reason, details, options) => {
      return log(LogLevel.ERROR, LogCategory.PAYMENT, `Payment failed: ${reason}`, details, {
        ...options,
        orderId,
        tags: ['payment-failed'],
      })
    },
  },

  /**
   * Log security events
   */
  security: {
    unauthorizedAccess: (message, details, options) => {
      return log(LogLevel.WARN, LogCategory.SECURITY, message, details, {
        ...options,
        tags: ['unauthorized', 'security'],
      })
    },
    
    originBlocked: (origin, details, options) => {
      return log(LogLevel.WARN, LogCategory.SECURITY, `Unauthorized origin blocked: ${origin}`, details, {
        ...options,
        tags: ['origin-blocked', 'security'],
      })
    },
    
    priceManipulation: (orderId, details, options) => {
      return log(LogLevel.CRITICAL, LogCategory.SECURITY, 'Potential price manipulation detected', details, {
        ...options,
        orderId,
        tags: ['price-manipulation', 'security', 'critical'],
      })
    },
  },
}

export default logger
