import { OG_SIZE, renderDefaultOgImage } from '@/lib/og/default-og-image'

// Fallback share image inherited by every page that doesn't set its own.
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'The Cupcake Desire — cupcakes delivered across Melbourne'

export default function OpengraphImage() {
  return renderDefaultOgImage()
}
