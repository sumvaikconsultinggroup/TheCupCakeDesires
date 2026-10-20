/**
 * Origin Validation Utility
 * 
 * Validates that API requests come from approved origins/URLs
 * Prevents unauthorized access to API endpoints
 */

/**
 * Get the base domain (without www) from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string|null} - The base domain without www
 */
function getBaseDomain(url) {
  try {
    const urlObj = new URL(url)
    let host = urlObj.host.toLowerCase()
    
    // Remove www. prefix if present
    if (host.startsWith('www.')) {
      host = host.substring(4)
    }
    
    return `${urlObj.protocol}//${host}`
  } catch (e) {
    return null
  }
}

/**
 * Get allowed origins from environment variables
 * Supports multiple origins separated by commas
 * Automatically includes both www and non-www versions
 */
function getAllowedOrigins() {
  const origins = []
  
  // Primary base URL - automatically add both www and non-www versions
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.trim()
    origins.push(baseUrl)
    
    try {
      const urlObj = new URL(baseUrl)
      const host = urlObj.host.toLowerCase()
      
      // If base URL doesn't have www, add www version
      if (!host.startsWith('www.')) {
        const wwwUrl = `${urlObj.protocol}//www.${host}`
        origins.push(wwwUrl)
      } else {
        // If base URL has www, add non-www version
        const nonWwwHost = host.substring(4) // Remove 'www.'
        const nonWwwUrl = `${urlObj.protocol}//${nonWwwHost}`
        origins.push(nonWwwUrl)
      }
    } catch (e) {
      // Invalid URL, just use the original
    }
  }
  
  // Additional allowed origins from environment variable
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    origins.push(...additionalOrigins)
    
    // For each additional origin, also add www/non-www version
    additionalOrigins.forEach(origin => {
      try {
        const urlObj = new URL(origin)
        const host = urlObj.host.toLowerCase()
        
        if (!host.startsWith('www.')) {
          const wwwUrl = `${urlObj.protocol}//www.${host}`
          if (!origins.includes(wwwUrl)) {
            origins.push(wwwUrl)
          }
        } else {
          const nonWwwHost = host.substring(4)
          const nonWwwUrl = `${urlObj.protocol}//${nonWwwHost}`
          if (!origins.includes(nonWwwUrl)) {
            origins.push(nonWwwUrl)
          }
        }
      } catch (e) {
        // Invalid URL, skip
      }
    })
  }
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://127.0.0.1:3000')
  }
  
  // Remove duplicates and empty values
  return [...new Set(origins.filter(Boolean))]
}

/**
 * Normalize origin URL for comparison
 * Removes trailing slashes and normalizes protocol
 */
function normalizeOrigin(origin) {
  if (!origin) return null
  
  // Remove trailing slash
  origin = origin.replace(/\/$/, '')
  
  // Ensure it starts with http:// or https://
  if (!origin.match(/^https?:\/\//)) {
    origin = `https://${origin}`
  }
  
  return origin.toLowerCase()
}

/**
 * Get base domain from a URL (without www)
 * @param {string} url - The URL to extract base domain from
 * @returns {string|null} - The base domain
 */
function getBaseDomainFromUrl(url) {
  try {
    const urlObj = new URL(url)
    let host = urlObj.host.toLowerCase()
    
    // Remove www. prefix if present
    if (host.startsWith('www.')) {
      host = host.substring(4)
    }
    
    return host
  } catch (e) {
    return null
  }
}

/**
 * Check if an origin is allowed
 * @param {string} origin - The origin to check
 * @returns {boolean} - True if origin is allowed
 */
export function isOriginAllowed(origin) {
  if (!origin) return false
  
  const allowedOrigins = getAllowedOrigins()
  const normalizedOrigin = normalizeOrigin(origin)
  
  // Check exact match
  if (allowedOrigins.some(allowed => normalizeOrigin(allowed) === normalizedOrigin)) {
    return true
  }
  
  // Check base domain match (www and non-www are treated as same)
  const originBaseDomain = getBaseDomainFromUrl(origin)
  if (originBaseDomain) {
    const baseDomainMatch = allowedOrigins.some(allowed => {
      const allowedBaseDomain = getBaseDomainFromUrl(allowed)
      return allowedBaseDomain === originBaseDomain
    })
    if (baseDomainMatch) return true
  }
  
  // Check if origin matches any allowed origin pattern (for subdomains)
  return allowedOrigins.some(allowed => {
    const normalizedAllowed = normalizeOrigin(allowed)
    
    // Exact match
    if (normalizedAllowed === normalizedOrigin) return true
    
    // Subdomain match (e.g., admin.example.com matches example.com)
    if (normalizedOrigin.endsWith(`.${normalizedAllowed}`)) return true
    
    return false
  })
}

/**
 * Get the origin from a request
 * Checks multiple headers to determine the origin
 */
export function getRequestOrigin(request) {
  // Check Origin header (for CORS requests)
  const origin = request.headers.get('origin')
  if (origin) return origin
  
  // Check Referer header (for same-origin requests)
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return `${url.protocol}//${url.host}`
    } catch (e) {
      // Invalid referer URL
    }
  }
  
  // Fallback to request URL origin
  try {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  } catch (e) {
    return null
  }
}

/**
 * Validate origin and return appropriate response if invalid
 * @param {Request} request - The incoming request
 * @returns {NextResponse|null} - Error response if invalid, null if valid
 */
export function validateOrigin(request) {
  const origin = getRequestOrigin(request)
  const allowedOrigins = getAllowedOrigins()
  
  // CRITICAL: Always allow same-origin requests (requests from the same host)
  // Browsers don't send Origin header for same-origin requests, so we check the request URL
  // Also handles www vs non-www as the same domain
  try {
    const requestUrl = new URL(request.url)
    const requestHost = requestUrl.host.toLowerCase()
    const requestBaseDomain = getBaseDomainFromUrl(request.url)
    
    // Check if request is from the same host (same-origin)
    // This handles cases where Origin header might be missing for same-origin requests
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (baseUrl && requestBaseDomain) {
      try {
        const baseUrlObj = new URL(baseUrl)
        const baseUrlBaseDomain = getBaseDomainFromUrl(baseUrl)
        
        // Same base domain (www and non-www treated as same) = same-origin request, always allow
        if (requestBaseDomain === baseUrlBaseDomain) {
          return null
        }
        
        // Also check exact host match (case-insensitive)
        if (requestHost === baseUrlObj.host.toLowerCase()) {
          return null
        }
      } catch (e) {
        // Invalid base URL, continue with other checks
      }
    }
    
    // Also check against allowed origins for same-host matches (including www/non-www)
    for (const allowedOrigin of allowedOrigins) {
      try {
        const allowedUrl = new URL(allowedOrigin)
        const allowedBaseDomain = getBaseDomainFromUrl(allowedOrigin)
        
        // Check base domain match (www and non-www treated as same)
        if (requestBaseDomain && allowedBaseDomain && requestBaseDomain === allowedBaseDomain) {
          return null
        }
        
        // Also check exact host match (case-insensitive)
        if (requestHost === allowedUrl.host.toLowerCase()) {
          return null
        }
      } catch (e) {
        // Invalid allowed origin URL, skip
      }
    }
  } catch (e) {
    // Invalid request URL, continue with origin validation
  }
  
  // In development mode, be more lenient
  if (process.env.NODE_ENV === 'development') {
    // If no allowed origins are configured, allow all requests in development
    if (allowedOrigins.length === 0) {
      return null
    }
    
    // Allow requests without origin in development
    if (!origin) {
      return null
    }
  }
  
  // Allow server-to-server requests (no origin/referer) if from same host
  if (!origin) {
    // For internal requests, check if it's from the same host
    try {
      const requestUrl = new URL(request.url)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      
      if (baseUrl) {
        const baseUrlObj = new URL(baseUrl)
        const requestBaseDomain = getBaseDomainFromUrl(request.url)
        const baseUrlBaseDomain = getBaseDomainFromUrl(baseUrl)
        
        // Same base domain (www and non-www treated as same) = internal request, allow it
        if (requestBaseDomain && baseUrlBaseDomain && requestBaseDomain === baseUrlBaseDomain) {
          return null
        }
        
        // Also check exact host match (case-insensitive)
        if (requestUrl.host.toLowerCase() === baseUrlObj.host.toLowerCase()) {
          return null
        }
      }
      
      // If no base URL configured and we're not in strict mode, allow it
      if (!baseUrl && process.env.NODE_ENV === 'development') {
        return null
      }
    } catch (e) {
      // Invalid URL, in development allow it, otherwise deny
      if (process.env.NODE_ENV === 'development') {
        return null
      }
    }
  }
  
  // If no allowed origins configured and we're in development, allow all
  if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'development') {
    return null
  }
  
  // If no allowed origins configured in production, allow same-origin only
  // This prevents breaking production if env vars aren't set properly
  if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
    // If we have a base URL, allow same-origin requests
    // Otherwise, allow to prevent breaking production (should be configured properly)
    try {
      const requestUrl = new URL(request.url)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      if (baseUrl) {
        const requestBaseDomain = getBaseDomainFromUrl(request.url)
        const baseUrlBaseDomain = getBaseDomainFromUrl(baseUrl)
        
        // Same base domain (www and non-www treated as same) = same-origin, allow it
        if (requestBaseDomain && baseUrlBaseDomain && requestBaseDomain === baseUrlBaseDomain) {
          return null
        }
        
        // Also check exact host match
        const baseUrlObj = new URL(baseUrl)
        if (requestUrl.host.toLowerCase() === baseUrlObj.host.toLowerCase()) {
          return null
        }
      }
      // If no base URL but we're in production, allow to prevent breaking
      // This is a safety fallback - proper configuration is recommended
      return null
    } catch (e) {
      // Allow to prevent breaking production
      return null
    }
  }
  
  // Validate origin
  if (!isOriginAllowed(origin)) {
    // Log security event (async, don't block) - fire and forget
    setImmediate(async () => {
      try {
        const { logger } = await import('@/lib/logger')
        logger.security.originBlocked(
          origin,
          {
            allowedOrigins,
            url: request.url,
            method: request.method,
            requestHost: request.url ? new URL(request.url).host : 'unknown',
          },
          { request }
        ).catch(() => {
          // Ignore logging errors to prevent blocking the request
        })
      } catch (e) {
        // Ignore import/logging errors - never break the request flow
      }
    })
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized origin',
        message: 'This API endpoint can only be accessed from approved domains.',
        debug: process.env.NODE_ENV === 'development' ? {
          origin,
          allowedOrigins,
          requestUrl: request.url,
        } : undefined,
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
  
  return null
}

/**
 * Create CORS headers for allowed origins
 */
export function getCorsHeaders(request) {
  const origin = getRequestOrigin(request)
  const allowedOrigins = getAllowedOrigins()
  
  // If origin is allowed, return it; otherwise return first allowed origin
  const allowedOrigin = isOriginAllowed(origin) ? origin : allowedOrigins[0] || '*'
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCorsPreflight(request) {
  const validationError = validateOrigin(request)
  if (validationError) {
    return validationError
  }
  
  const corsHeaders = getCorsHeaders(request)
  
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}
