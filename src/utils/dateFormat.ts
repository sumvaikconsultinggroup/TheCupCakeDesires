/**
 * Utility functions for formatting dates in AEDT (Australian Eastern Daylight Time / Melbourne).
 * Function names are kept as `formatIST*` for backwards compatibility — they now
 * format in Melbourne time.
 */

const IST_TIMEZONE = 'Australia/Melbourne'
const IST_LOCALE = 'en-AU'

/**
 * Format date and time in Melbourne time (AEDT).
 */
export function formatIST(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    ...options,
  })
}

/**
 * Format date only in Melbourne time (AEDT).
 */
export function formatISTDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    ...options,
  })
}

/**
 * Format time only in Melbourne time (AEDT).
 */
export function formatISTTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    ...options,
  })
}

/**
 * Melbourne timezone options for date-fns formatInTimeZone (still exported as
 * IST_TIMEZONE_OPTIONS for backwards compatibility).
 */
export const IST_TIMEZONE_OPTIONS = {
  timeZone: IST_TIMEZONE,
}
