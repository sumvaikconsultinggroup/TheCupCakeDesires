/**
 * Performance-optimized logger that disables console logs in production
 * and reduces logging overhead in development
 */

const isDev = process.env.NODE_ENV === 'development'
const enableLogs = isDev && process.env.ENABLE_LOGS !== 'false'

// Store original console methods
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn
const originalDebug = console.debug

// Create optimized logger functions
export const logger = {
  log: enableLogs
    ? (...args: any[]) => {
        // Throttle logs to prevent performance issues
        if (Math.random() > 0.1) return // Only log 10% of calls in dev
        originalLog(...args)
      }
    : () => {}, // No-op in production or when disabled

  error: (...args: any[]) => {
    // Always log errors
    originalError(...args)
  },

  warn: enableLogs
    ? (...args: any[]) => {
        originalWarn(...args)
      }
    : () => {},

  debug: enableLogs
    ? (...args: any[]) => {
        if (process.env.DEBUG === 'true') {
          originalDebug(...args)
        }
      }
    : () => {},
}

// Replace console methods in development (optional - can be enabled via env var)
if (isDev && process.env.OPTIMIZE_LOGS === 'true') {
  console.log = logger.log
  console.warn = logger.warn
  console.debug = logger.debug
  // Keep console.error as-is for error tracking
}
