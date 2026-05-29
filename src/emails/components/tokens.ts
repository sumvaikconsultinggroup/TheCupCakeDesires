/**
 * Design tokens for CupCake Desires email templates.
 *
 * Hex values (no oklch/lab) for max email-client compatibility.
 */

export const colors = {
  brand: '#1B198F',
  brandHover: '#15137a',
  brandLight: '#ECECF8',

  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#94A3B8',

  bg: '#FFFFFF',
  bgPage: '#F8FAFC',
  bgSection: '#F1F5F9',

  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
} as const

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
  name: 'CupCake Desires',
  logoUrl: 'https://cupcakedesires.com/logo.png',
  siteUrl: 'https://cupcakedesires.com',
  supportEmail: 'hello@cupcakedesires.com',
  address: '352 Princes Hwy, Narre Warren, Victoria 3805, Australia',
  instagram: 'https://www.instagram.com/cupcakedesires',
} as const
