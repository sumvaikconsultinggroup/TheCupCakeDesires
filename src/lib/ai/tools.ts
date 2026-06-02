/**
 * Tools the storefront assistant can call.
 * Each tool has a JSON schema (so OpenAI knows how to call it) and a handler
 * (which runs server-side and returns data the model can use).
 *
 * Accuracy goal: the model should never name a product that didn't come
 * back from one of these handlers. Everything it surfaces in chat is read
 * straight out of MongoDB.
 */
import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import type OpenAI from 'openai'

/* ─── Public product shape the AI hands back to the frontend ─── */
export interface AssistantProduct {
  id: string
  handle: string
  title: string
  price: number
  compareAtPrice?: number
  image?: string
  category?: string
  shortDescription?: string
  inStock: boolean
  isVegan?: boolean
  isEggless?: boolean
  isGlutenFree?: boolean
}

/* ─── Helpers ─── */

const STOPWORDS = new Set([
  'a','an','the','and','or','of','for','to','in','on','with','please',
  'do','you','have','any','some','me','i','want','need','show','give',
  'looking','look','around','about','find','suggest','recommend','can','could',
  'whats','what','is','are','my','our','your','it','its','this','that','these','those',
  'something','anything','box','boxes','pack','packs','please',
])

function tokenize(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function minVariantPrice(p: any): number {
  const prices: number[] = (p.variants || [])
    .map((v: any) => v?.price)
    .filter((n: any) => typeof n === 'number' && n > 0)
  return prices.length ? Math.min(...prices) : 0
}

function hasStock(p: any): boolean {
  return (p.variants || []).some(
    (v: any) => typeof v?.inventoryQty === 'number' && v.inventoryQty > 0
  )
}

function serializeProduct(p: any): AssistantProduct {
  const variant = p.variants?.[0]
  return {
    id: String(p._id),
    handle: p.handle,
    title: p.title,
    price: minVariantPrice(p) || variant?.price || 0,
    compareAtPrice: variant?.compareAtPrice,
    image: p.images?.[0]?.src,
    category: p.productCategory,
    shortDescription:
      p.description ||
      (p.bodyHtml ? String(p.bodyHtml).replace(/<[^>]*>/g, '').trim().slice(0, 160) : ''),
    inStock: hasStock(p),
    isVegan: p.isVegan,
    isEggless: p.isEggless,
    isGlutenFree: p.isGlutenFree,
  }
}

function scoreProduct(p: any, tokens: string[]): number {
  if (tokens.length === 0) return 0
  const title = String(p.title || '').toLowerCase()
  const category = String(p.productCategory || '').toLowerCase()
  const tags = (p.tags || []).map((t: any) => String(t).toLowerCase())
  const flavours = (p.flavours || []).map((f: any) => String(f).toLowerCase())
  const desc = String(p.description || '').toLowerCase()
  const body = String(p.bodyHtml || '').toLowerCase().replace(/<[^>]*>/g, ' ')

  let score = 0
  for (const tok of tokens) {
    if (title.includes(tok)) score += 6
    if (flavours.some((f: string) => f.includes(tok))) score += 5
    if (tags.some((t: string) => t.includes(tok))) score += 3
    if (category.includes(tok)) score += 2
    if (desc.includes(tok)) score += 1
    if (body.includes(tok)) score += 1
  }
  // Bonus for in-stock — never hide them, but rank above sold-out.
  if (hasStock(p)) score += 0.5
  return score
}

/* ─── Tool: search_products ─── */
export const searchProductsTool: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_products',
    description:
      'Search the CupCake Desires catalogue. Use this whenever the customer asks about cakes, cupcakes, macarons, gift boxes, flavours, or wants recommendations. Returns products with images, prices and handles, ranked by relevance. Pass focused keywords (flavour, occasion, format) — not the whole sentence.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Focused keywords from the customer\'s ask — flavours, occasions, formats. Examples: "salted caramel", "red velvet eggless", "birthday box", "matcha macaron". Avoid filler words like "do you have" or "show me".',
        },
        category: {
          type: 'string',
          description:
            'Narrow by product category. Known values include: "Cupcake Boxes", "Cakes", "Macarons", "Themed Boxes", "Gift Voucher". Only set this if the customer specifically asks for that format.',
        },
        dietary: {
          type: 'string',
          enum: ['eggless', 'vegan', 'gluten-free'],
          description: 'Strict dietary filter — only set when the customer explicitly asks for it.',
        },
        priceMin: {
          type: 'number',
          description: 'Minimum price in AUD. Use only when the customer mentions a price.',
        },
        priceMax: {
          type: 'number',
          description: 'Maximum price in AUD. Use when the customer says e.g. "under $50".',
        },
        inStockOnly: {
          type: 'boolean',
          description: 'Default true. Set false only if the customer wants to see everything including sold-out items.',
        },
        limit: {
          type: 'integer',
          description: 'Max results (1–8). Default 4.',
          minimum: 1,
          maximum: 8,
        },
      },
    },
  },
}

export async function handleSearchProducts(args: {
  query?: string
  category?: string
  dietary?: 'eggless' | 'vegan' | 'gluten-free'
  priceMin?: number
  priceMax?: number
  inStockOnly?: boolean
  limit?: number
}): Promise<{
  products: AssistantProduct[]
  total: number
  matchedTokens?: string[]
  fallbackUsed?: 'dropped_category' | 'dropped_price' | 'dropped_query' | 'dropped_dietary'
  fallbackNotice?: string
}> {
  await connectDb()

  const limit = Math.min(Math.max(args.limit ?? 4, 1), 8)
  const inStockOnly = args.inStockOnly !== false
  const tokens = args.query ? tokenize(args.query) : []

  const buildFilter = (opts: typeof args, useTokens: string[]) => {
    const filter: any = { isDeleted: false, published: true, status: 'active' }
    if (opts.category) {
      filter.productCategory = { $regex: escapeRegex(opts.category), $options: 'i' }
    }
    if (opts.dietary === 'eggless') filter.isEggless = true
    if (opts.dietary === 'vegan') filter.isVegan = true
    if (opts.dietary === 'gluten-free') filter.isGlutenFree = true

    if (useTokens.length > 0) {
      filter.$and = useTokens.map((tok) => {
        const rx = { $regex: escapeRegex(tok), $options: 'i' }
        return {
          $or: [
            { title: rx },
            { description: rx },
            { bodyHtml: rx },
            { tags: rx },
            { flavours: rx },
            { productCategory: rx },
            { handle: rx },
          ],
        }
      })
    }
    return filter
  }

  // Pull a fat candidate pool, then score + slice client-side so we can
  // rank by relevance instead of just updatedAt.
  const runSearch = async (opts: typeof args, useTokens: string[]) => {
    const filter = buildFilter(opts, useTokens)
    const candidatePoolSize = useTokens.length > 0 ? Math.max(limit * 6, 24) : limit * 3
    const docs = await Product.find(filter)
      .sort({ updatedAt: -1 })
      .limit(candidatePoolSize)
      .lean()
    const total = await Product.countDocuments(filter)

    let ranked = docs as any[]
    if (useTokens.length > 0) {
      ranked = [...docs as any[]]
        .map((d) => ({ d, s: scoreProduct(d, useTokens) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((r) => r.d)
    }

    // Price filter happens here because variant prices are arrays.
    if (typeof opts.priceMin === 'number' || typeof opts.priceMax === 'number') {
      ranked = ranked.filter((d) => {
        const p = minVariantPrice(d)
        if (typeof opts.priceMin === 'number' && p < opts.priceMin) return false
        if (typeof opts.priceMax === 'number' && p > opts.priceMax) return false
        return true
      })
    }

    if (inStockOnly) {
      const inStock = ranked.filter((d) => hasStock(d))
      // Only collapse to in-stock if at least one remains — otherwise we'd
      // strand the customer with "nothing" when there are sold-out matches.
      if (inStock.length > 0) ranked = inStock
    }

    return { docs: ranked.slice(0, limit), total: ranked.length || total }
  }

  // 1) Strict pass: all filters + all tokens
  let { docs, total } = await runSearch(args, tokens)
  let fallbackUsed: 'dropped_category' | 'dropped_price' | 'dropped_query' | 'dropped_dietary' | undefined
  let fallbackNotice: string | undefined

  // 2) Drop price range if too narrow
  if (docs.length === 0 && (args.priceMin != null || args.priceMax != null)) {
    const broadened = await runSearch(
      { ...args, priceMin: undefined, priceMax: undefined },
      tokens
    )
    if (broadened.docs.length > 0) {
      docs = broadened.docs
      total = broadened.total
      fallbackUsed = 'dropped_price'
      fallbackNotice = 'No matches inside that price range — showing the closest options.'
    }
  }

  // 3) Drop category but keep tokens + dietary
  if (docs.length === 0 && args.category) {
    const broadened = await runSearch({ ...args, category: undefined }, tokens)
    if (broadened.docs.length > 0) {
      docs = broadened.docs
      total = broadened.total
      fallbackUsed = 'dropped_category'
      fallbackNotice = `No matches in "${args.category}". Broadened to the full catalogue${
        args.dietary ? ` (still ${args.dietary})` : ''
      }.`
    }
  }

  // 4) Drop hardest token first (try with N-1 tokens, then N-2, etc.)
  if (docs.length === 0 && tokens.length > 1) {
    for (let drop = 1; drop < tokens.length && docs.length === 0; drop++) {
      const fewer = tokens.slice(0, tokens.length - drop)
      const broadened = await runSearch({ ...args, category: undefined }, fewer)
      if (broadened.docs.length > 0) {
        docs = broadened.docs
        total = broadened.total
        fallbackUsed = 'dropped_query'
        fallbackNotice = `Couldn't match every word — best matches for "${fewer.join(' ')}".`
        break
      }
    }
  }

  // 5) Drop dietary filter as a last resort — flag it loudly so the model
  //    can warn the customer it's not actually eggless/vegan/gluten-free.
  if (docs.length === 0 && args.dietary) {
    const broadened = await runSearch(
      { ...args, dietary: undefined, category: undefined },
      tokens
    )
    if (broadened.docs.length > 0) {
      docs = broadened.docs
      total = broadened.total
      fallbackUsed = 'dropped_dietary'
      fallbackNotice = `We don't currently stock a ${args.dietary} match for that. Showing the closest non-${args.dietary} options — these are NOT ${args.dietary}.`
    }
  }

  return {
    products: docs.map(serializeProduct),
    total,
    matchedTokens: tokens.length > 0 ? tokens : undefined,
    fallbackUsed,
    fallbackNotice,
  }
}

/* ─── Tool: browse_collection ─── */
export const browseCollectionTool: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'browse_collection',
    description:
      'Return products inside a specific collection by handle. Use this when the customer asks for a known collection by name — e.g. "bestsellers", "signatures", "eggless", "vegan", "minis", "macarons", "cakes", "birthday-cupcakes", "wedding-cakes", "corporate-cupcakes". Prefer this over search_products when the request maps to a collection.',
    parameters: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'The collection handle (kebab-case). Examples: "bestsellers", "signatures", "eggless", "vegan", "macarons", "minis", "birthday-cupcakes".',
        },
        limit: {
          type: 'integer',
          description: 'Max results (1–8). Default 5.',
          minimum: 1,
          maximum: 8,
        },
      },
      required: ['handle'],
    },
  },
}

export async function handleBrowseCollection(args: {
  handle: string
  limit?: number
}): Promise<{
  collection?: { handle: string; title: string; description?: string }
  products: AssistantProduct[]
  total: number
  notice?: string
}> {
  await connectDb()
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 8)
  const handle = (args.handle || '').toLowerCase().trim()
  if (!handle) {
    return { products: [], total: 0, notice: 'No collection handle provided.' }
  }

  const col: any = await Collection.findOne({
    handle,
    isDeleted: false,
    published: true,
  }).lean()

  if (!col) {
    return {
      products: [],
      total: 0,
      notice: `No collection found for "${handle}".`,
    }
  }

  let docs: any[] = []
  const baseFilter = { isDeleted: false, published: true, status: 'active' as const }

  if (col.productHandles?.length > 0) {
    docs = await Product.find({
      ...baseFilter,
      handle: { $in: col.productHandles },
    })
      .limit(limit * 3)
      .lean()
  } else {
    // Fall back to tag/handle match for automated collections.
    docs = await Product.find({
      ...baseFilter,
      $or: [{ tags: handle }, { handle: { $regex: escapeRegex(handle), $options: 'i' } }],
    })
      .limit(limit * 3)
      .lean()
  }

  // Prefer in-stock for the customer view.
  const inStock = docs.filter((d) => hasStock(d))
  const ranked = (inStock.length > 0 ? inStock : docs).slice(0, limit)

  return {
    collection: {
      handle: col.handle,
      title: col.title,
      description: col.description,
    },
    products: ranked.map(serializeProduct),
    total: docs.length,
  }
}

/* ─── Tool: get_product_details ─── */
export const getProductDetailsTool: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_product_details',
    description:
      'Get full details about a single product when the customer asks "what\'s in it?", "what flavours come in this?", "is it eggless?", or any follow-up about a specific product they already saw. Pass the product handle from a previous search result.',
    parameters: {
      type: 'object',
      properties: {
        handle: {
          type: 'string',
          description: 'The product handle from a previous search result.',
        },
      },
      required: ['handle'],
    },
  },
}

export async function handleGetProductDetails(args: {
  handle: string
}): Promise<{
  product?: AssistantProduct & {
    flavours?: string[]
    ingredients?: string
    variantOptions?: { name: string; price: number; inStock: boolean }[]
    fullDescription?: string
  }
  notice?: string
}> {
  await connectDb()
  const handle = (args.handle || '').toLowerCase().trim()
  if (!handle) return { notice: 'No product handle provided.' }

  const p: any = await Product.findOne({
    handle,
    isDeleted: false,
    published: true,
    status: 'active',
  }).lean()

  if (!p) return { notice: `No product found for handle "${handle}".` }

  const base = serializeProduct(p)
  const variantOptions = (p.variants || []).map((v: any) => ({
    name: [v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ') || 'Default',
    price: v.price,
    inStock: (v.inventoryQty || 0) > 0,
  }))
  const fullDescription =
    p.description ||
    (p.bodyHtml ? String(p.bodyHtml).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '')

  return {
    product: {
      ...base,
      flavours: p.flavours,
      ingredients: p.ingredients,
      variantOptions,
      fullDescription,
    },
  }
}

/* ─── Tool: get_catalogue_map ─── */
export const getCatalogueMapTool: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_catalogue_map',
    description:
      'Return the live shape of the catalogue — product categories with counts, dietary-flag counts, and published collection handles. Call this once when the customer is browsing without a clear direction, or when you need to confirm something exists before recommending it.',
    parameters: { type: 'object', properties: {} },
  },
}

export async function handleGetCatalogueMap(): Promise<{
  categories: { name: string; count: number }[]
  dietary: { eggless: number; vegan: number; glutenFree: number }
  collections: { handle: string; title: string; productCount: number }[]
  totalProducts: number
}> {
  await connectDb()
  const baseMatch = { isDeleted: false, published: true, status: 'active' as const }

  const [categories, eggless, vegan, glutenFree, totalProducts, cols] = await Promise.all([
    Product.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$productCategory', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
    ]),
    Product.countDocuments({ ...baseMatch, isEggless: true }),
    Product.countDocuments({ ...baseMatch, isVegan: true }),
    Product.countDocuments({ ...baseMatch, isGlutenFree: true }),
    Product.countDocuments(baseMatch),
    Collection.find({ isDeleted: false, published: true })
      .select('handle title productHandles')
      .lean(),
  ])

  return {
    categories: categories.map((row: any) => ({ name: row._id, count: row.count })),
    dietary: { eggless, vegan, glutenFree },
    collections: (cols as any[]).map((c) => ({
      handle: c.handle,
      title: c.title,
      productCount: (c.productHandles || []).length,
    })),
    totalProducts,
  }
}

/* ─── Backwards-compat: keep get_categories so existing transcripts work ─── */
export const getCategoriesTool: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_categories',
    description:
      'List product categories with item counts. Prefer get_catalogue_map for richer browse-time context.',
    parameters: { type: 'object', properties: {} },
  },
}

export async function handleGetCategories(): Promise<
  { name: string; count: number }[]
> {
  const map = await handleGetCatalogueMap()
  return map.categories
}

/* ─── Tool registry ─── */
export const allTools: OpenAI.Chat.ChatCompletionTool[] = [
  searchProductsTool,
  browseCollectionTool,
  getProductDetailsTool,
  getCatalogueMapTool,
  getCategoriesTool,
]

export async function executeTool(
  name: string,
  args: any
): Promise<{ result: any; products?: AssistantProduct[] }> {
  switch (name) {
    case 'search_products': {
      const out = await handleSearchProducts(args)
      return { result: out, products: out.products }
    }
    case 'browse_collection': {
      const out = await handleBrowseCollection(args)
      return { result: out, products: out.products }
    }
    case 'get_product_details': {
      const out = await handleGetProductDetails(args)
      return { result: out, products: out.product ? [out.product] : undefined }
    }
    case 'get_catalogue_map': {
      const result = await handleGetCatalogueMap()
      return { result }
    }
    case 'get_categories': {
      const result = await handleGetCategories()
      return { result }
    }
    default:
      return { result: { error: `Unknown tool: ${name}` } }
  }
}
