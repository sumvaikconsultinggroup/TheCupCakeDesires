import { renderDefaultOgImage } from '@/lib/og/default-og-image'

// Served at /og-image.png — the default share image referenced site-wide.
export const dynamic = 'force-static'

export function GET() {
  return renderDefaultOgImage()
}
