/**
 * Single Content-Security-Policy used by middleware (page routes) and
 * next.config headers (routes the middleware matcher skips).
 *
 * Google tag hosts follow Google's CSP guide for GTM + GA4 + Google Ads:
 * GA4 beacons go to regional hosts (e.g. region1.google-analytics.com), and
 * Google Signals / Ads use country-specific google.<tld> hosts that cannot be
 * wildcarded, so www.google.com.au is listed explicitly.
 */

const GOOGLE_TAG_SCRIPT = [
  'https://www.googletagmanager.com',
  'https://*.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://www.googleadservices.com',
  'https://googleads.g.doubleclick.net',
  'https://www.google.com',
  'https://tagassistant.google.com',
]

const GOOGLE_TAG_CONNECT = [
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.g.doubleclick.net',
  'https://*.google.com',
  'https://www.google.com.au',
  'https://pagead2.googlesyndication.com',
  'https://www.googleadservices.com',
]

const GOOGLE_TAG_IMG = [
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.g.doubleclick.net',
  'https://*.google.com',
  'https://www.google.com.au',
  'https://www.googleadservices.com',
  'https://ssl.gstatic.com',
  'https://www.gstatic.com',
]

const GOOGLE_TAG_FRAME = [
  'https://www.googletagmanager.com',
  'https://td.doubleclick.net',
  'https://tagassistant.google.com',
  'https://www.google.com',
  'https://maps.google.com',
]

const CLERK = ['https://*.clerk.accounts.dev', 'https://*.clerk.dev', 'https://*.clerk.com']

const directives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://cdn.shopify.com',
    ...CLERK,
    'https://challenges.cloudflare.com',
    ...GOOGLE_TAG_SCRIPT,
  ],
  'connect-src': [
    "'self'",
    'https://cdn.shopify.com',
    'https://res.cloudinary.com',
    ...CLERK,
    'https://api.clerk.dev',
    'https://clerk.telemetry.com',
    ...GOOGLE_TAG_CONNECT,
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://img.clerk.com',
    'https://images.unsplash.com',
    'https://unsplash.com',
    'https://images.pexels.com',
    'https://res.cloudinary.com',
    'https://cdn.shopify.com',
    'https://thecupcakedesire.com.au',
    'https://www.youtube.com',
    ...GOOGLE_TAG_IMG,
  ],
  'frame-src': [
    "'self'",
    'https://challenges.cloudflare.com',
    ...CLERK,
    'https://www.youtube.com',
    ...GOOGLE_TAG_FRAME,
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'media-src': ["'self'", 'https://res.cloudinary.com'],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ['*'],
  'frame-ancestors': ["'self'"],
}

export const CONTENT_SECURITY_POLICY = Object.entries(directives)
  .map(([name, values]) => `${name} ${[...new Set(values)].join(' ')}`)
  .join('; ')
