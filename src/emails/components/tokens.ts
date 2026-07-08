/**
 * Design tokens for The Cupcake Desire email templates.
 *
 * Hex values (no oklch/lab) for max email-client compatibility.
 */

// Matches the storefront "bake" palette (see src/styles/tailwind.css).
export const colors = {
  brand: '#2e1f15', // cocoa — buttons, primary accents
  brandHover: '#241811', // darker cocoa
  brandLight: '#fbf3e8', // cream — soft accent background

  accent: '#d97185', // rose-accent — links / highlights

  text: '#2e1f15', // cocoa — headings
  textMuted: '#5a4634', // cocoa-soft — body
  textSubtle: '#8b7359', // taupe — captions

  bg: '#fffbf6', // ivory — content card
  bgPage: '#fbf3e8', // cream — outer canvas
  bgSection: '#f4e9d6', // cream-deep — panels

  border: '#ead9c1', // line
  borderStrong: '#d8c4a4',

  success: '#3f7d5f',
  successBg: '#eef6f0',
  warning: '#b4791f',
  warningBg: '#f7edd9',
  danger: '#b4444f',
  dangerBg: '#f8e9ea',
} as const

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
} as const

export const brand = {
  name: 'The Cupcake Desire',
  // Absolute HTTPS URL (email clients can't load relative/local paths). Point
  // this at the deployed logo once live; the header also renders a text wordmark
  // so the brand always shows even if the image is blocked.
  logoUrl: 'https://thecupcakedesire.com.au/images/Cupcake-Logo.png',
  siteUrl: 'https://thecupcakedesire.com.au',
  supportEmail: 'info@thecupcakedesire.com',
  address: '352 Princes Hwy, Narre Warren, Victoria 3805, Australia',
  instagram: 'https://www.instagram.com/thecupcakedesire',
} as const
