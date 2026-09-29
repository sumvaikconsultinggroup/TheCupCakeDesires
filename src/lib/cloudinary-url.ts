/**
 * Cloudinary delivery helpers for raw <img> tags (e.g. the hero slider, which
 * can't use next/image inside the carousel). Inserts f_auto,q_auto and a width
 * so each device gets a right-sized AVIF/WebP instead of the full original.
 */
const UPLOAD = '/image/upload/'

export function isCloudinaryUrl(src: string) {
  return src.includes('res.cloudinary.com') && src.includes(UPLOAD)
}

export function cloudinaryUrl(src: string, width: number) {
  if (!isCloudinaryUrl(src)) return src
  return src.replace(UPLOAD, `${UPLOAD}f_auto,q_auto,c_limit,w_${width}/`)
}

/** srcSet for a full-bleed image; returns undefined for non-Cloudinary sources. */
export function cloudinarySrcSet(src: string, widths = [480, 768, 1080, 1440, 1920]) {
  if (!isCloudinaryUrl(src)) return undefined
  return widths.map((w) => `${cloudinaryUrl(src, w)} ${w}w`).join(', ')
}
