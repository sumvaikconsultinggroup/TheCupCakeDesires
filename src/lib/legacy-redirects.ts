import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'

/**
 * Resolves URLs from the old WordPress / WooCommerce site (still in Google's
 * index) to the closest page on the current storefront, so their rankings
 * pass through a permanent redirect instead of dying on a 404.
 *
 * Exact matches live in next.config.mjs; this handles everything else under
 * /product/*, /shop/*, /product-category/* and /event/*.
 */

const FALLBACK = '/collections/all-items'

/** Old WooCommerce category slugs → current collection / landing page. */
const CATEGORY_ALIASES: Record<string, string> = {
  'standard-cupcake': '/collections/standard-cupcakes',
  'standard-cupcakes': '/collections/standard-cupcakes',
  'deluxe-cupcake': '/collections/deluxe-cupcakes',
  'deluxe-cupcakes': '/collections/deluxe-cupcakes',
  'mini-cupcake': '/collections/mini-cupcakes',
  'mini-cupcakes': '/collections/mini-cupcakes',
  macaron: '/collections/macarons',
  macarons: '/collections/macarons',
  cake: '/collections/cakes',
  cakes: '/collections/cakes',
  'gift-voucher': '/gift-voucher',
  'gift-vouchers': '/gift-voucher',
  'red-velvet-cupcakes': '/collections/all-cupcakes',
  'vegan-gluten-free-cupcakes': '/gluten-free-cupcakes',
  'gluten-free-cupcakes': '/gluten-free-cupcakes',
  'vegan-cupcakes': '/vegan-cupcakes',
  'eggless-cupcakes': '/eggless-cupcakes',
  'vegan-cakes': '/vegan-cakes',
  'corporate-cupcakes': '/corporate',
  'logo-cupcakes': '/corporate',
  'branded-cupcakes': '/branded-cupcakes-melbourne',
  uncategorized: FALLBACK,
}

const STOP = new Set(['box', 'of', 'the', 'and', 'n', 'cupcake', 'cupcakes', 'inch', 'round', '2', '3'])

function tokens(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .map((t) => (t === 'you' ? 'u' : t))
    .filter(Boolean)
}

/** Best product for an old product slug, or null when nothing is a confident match. */
async function matchProduct(slug: string): Promise<string | null> {
  const exact = (await Product.findOne({ handle: slug, isDeleted: { $ne: true } })
    .select('handle')
    .lean()) as { handle: string } | null
  if (exact) return `/products/${exact.handle}`

  const want = tokens(slug).filter((t) => !STOP.has(t) && !/^\d+$/.test(t))
  if (want.length === 0) return null
  const wantsCake = /cake(?!s?$)|round|\d+-inch|^\d+-/.test(slug) && !/cupcake/.test(slug)
  const wantsMini = /mini/.test(slug)
  const numbers = tokens(slug).filter((t) => /^\d+$/.test(t) && t !== '3')

  const products = (await Product.find({ isDeleted: { $ne: true }, published: true, status: 'active' })
    .select('handle title')
    .lean()) as unknown as { handle: string; title: string }[]

  let best: { handle: string; score: number } | null = null
  for (const p of products) {
    const have = new Set([...tokens(p.handle), ...tokens(p.title)])
    const hits = want.filter((t) => have.has(t)).length
    if (hits < want.length) continue // every meaningful word must match
    let score = hits * 10 - have.size // fewer extra words = closer match
    if (wantsCake === /round-cake|cake$/.test(p.handle)) score += 5
    if (wantsMini === /mini/.test(p.handle)) score += 3
    if (/-3-cupcakes$/.test(p.handle) && !wantsCake && !wantsMini) score += 2
    // Same words in the same order ("vanilla-chocolate" ≠ "chocolate-vanilla").
    if (p.handle.includes(slug.replace(/^(\d+-)+/, ''))) score += 8
    // Same pack size / cake size ("box-of-24" → a 24 box, not a 12).
    score += 3 * numbers.filter((n) => tokens(p.handle).includes(n)).length
    if (!best || score > best.score) best = { handle: p.handle, score }
  }
  return best ? `/products/${best.handle}` : null
}

async function collectionExists(handle: string) {
  return Boolean(
    await Collection.exists({ handle, isDeleted: { $ne: true }, published: true })
  )
}

/** Where an old URL should permanently redirect to. */
export async function resolveLegacyPath(prefix: string, segments: string[]): Promise<string> {
  const parts = segments.map((s) => decodeURIComponent(s).toLowerCase().trim()).filter(Boolean)
  const last = parts[parts.length - 1] || ''
  await connectDb()

  if (prefix === 'event') {
    if (last && (await collectionExists(last))) return `/collections/${last}`
    return '/cupcake-builder'
  }

  // /shop/<category>/<product> or /product/<product> → the product first.
  if (prefix === 'product' || parts.length > 1) {
    const product = last ? await matchProduct(last) : null
    if (product) return product
  }

  // Category archives: /shop/<cat>, /product-category/<cat>, or a product's category.
  for (const cat of [...parts].reverse()) {
    if (CATEGORY_ALIASES[cat]) return CATEGORY_ALIASES[cat]
    if (await collectionExists(cat)) return `/collections/${cat}`
  }

  if (prefix !== 'product' && parts.length === 1) {
    const product = await matchProduct(last)
    if (product) return product
  }
  return FALLBACK
}
