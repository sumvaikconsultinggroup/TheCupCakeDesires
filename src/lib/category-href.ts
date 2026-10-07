/**
 * Link target for a product's category. Product categories ("Cupcake Boxes",
 * "Themed Boxes", "Corporate"…) don't always match a collection handle, and
 * slugifying them blindly produced links to non-existent /collections/* pages
 * on every product page. Client-safe (no DB).
 */
const LIVE_COLLECTIONS = new Set([
  'standard-cupcakes', 'deluxe-cupcakes', 'mini-cupcakes', 'macarons', 'cakes', 'gift-voucher',
  'giant-cupcakes', 'deluxe-giant-cupcakes', 'special-occasion-cakes', 'dress-cakes', 'cake-slices',
  'birthday-cupcakes', 'wedding-cupcakes', 'anniversary-cupcakes', 'gender-reveal-cupcakes',
  'baby-girl-cupcakes', 'baby-boy-cupcakes', 'baby-neutral-cupcakes', 'valentines-day-cupcakes',
  'i-love-u-cupcakes', 'mothers-day-cupcakes', 'fathers-day-cupcakes', 'christmas-cupcakes',
  'easter-cupcakes', 'diwali-cupcakes', 'australia-day-cupcakes', 'sorry-cupcakes', 'thank-u-cupcakes',
  'all-cupcakes', 'all-items', 'bestsellers',
])

const CATEGORY_ALIASES: Record<string, string> = {
  'cupcake-boxes': '/collections/all-cupcakes',
  'themed-boxes': '/collections/all-cupcakes',
  'custom-cakes': '/collections/cakes',
  'round-cakes': '/collections/cakes',
  'standard-size-cake-slices': '/collections/cake-slices',
  'mini-cupcake': '/collections/mini-cupcakes',
  macaron: '/collections/macarons',
  corporate: '/corporate',
  event: '/cupcake-catering',
  'custom-orders': '/cupcake-builder',
  'gift-vouchers': '/gift-voucher',
}

export function categorySlug(category?: string) {
  return (category || '').toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function categoryHref(category?: string) {
  const slug = categorySlug(category)
  if (!slug) return '/collections/all-items'
  if (CATEGORY_ALIASES[slug]) return CATEGORY_ALIASES[slug]
  if (LIVE_COLLECTIONS.has(slug)) return `/collections/${slug}`
  return '/collections/all-items'
}
