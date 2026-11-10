/**
 * Fetch the local Google Merchant feed and check item count, zero prices,
 * absolute https images, and JSON-LD offer prices.
 *
 * Uses the same Product.find select + map as the feed route
 * (`mapMerchantFeedDocs` / `pickMerchantFeedFields`), not the public API mapping.
 *
 *   pnpm verify:merchant-feed
 *   BASE_URL=http://127.0.0.1:3000 pnpm verify:merchant-feed
 *
 * If the Next route cannot load Mongo, pass PRODUCTS_JSON pointing at a
 * products payload (or the script will try the public catalogue API).
 */
import { createServer } from 'node:http'
import { generateProductSchema } from '../src/lib/seo'
import {
  MERCHANT_EXCLUDED_HANDLES,
  MERCHANT_FEED_PATH,
  isMerchantFeedExcluded,
  merchantHandlingDays,
  productsToMerchantItems,
  renderGoogleMerchantRss,
} from '../src/lib/merchant-catalog'
import { mapMerchantFeedDocs, pickMerchantFeedFields } from '../src/lib/merchant-feed-query'

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')

type FeedItem = {
  id: string
  title: string
  link: string
  imageLink: string
  additionalImages: string[]
  price: number
  priceText: string
  itemGroupId: string
  minHandling: string
  maxHandling: string
}

function inner(block: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i')
  const match = block.match(re)
  return match ? match[1].trim() : ''
}

function allInner(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi')
  return [...block.matchAll(re)].map((match) => match[1].trim())
}

function parsePrice(text: string): number {
  const n = Number(String(text).replace(/AUD/i, '').trim())
  return Number.isFinite(n) ? n : NaN
}

function parseItems(xml: string): FeedItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1]
    const priceText = inner(block, 'g:price')
    return {
      id: inner(block, 'g:id'),
      title: inner(block, 'g:title') || inner(block, 'title'),
      link: inner(block, 'g:link') || inner(block, 'link'),
      imageLink: inner(block, 'g:image_link'),
      additionalImages: allInner(block, 'g:additional_image_link'),
      price: parsePrice(priceText),
      priceText,
      itemGroupId: inner(block, 'g:item_group_id'),
      minHandling: inner(block, 'g:min_handling_time'),
      maxHandling: inner(block, 'g:max_handling_time'),
    }
  })
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function handleFromLink(link: string): string {
  const match = decodeXml(link).match(/\/products\/([^/?#]+)/)
  return match ? decodeXml(match[1]) : ''
}

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  const res = await fetch(url, { redirect: 'follow' })
  return { status: res.status, text: await res.text() }
}

async function loadProducts(): Promise<any[]> {
  if (process.env.PRODUCTS_JSON) {
    const { readFileSync } = await import('node:fs')
    const raw = JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'))
    return raw.data || raw.products || raw
  }
  const url = process.env.PRODUCTS_API || 'https://thecupcakedesire.com.au/api/products?all=true'
  const res = await fetchText(url)
  if (res.status !== 200) throw new Error(`Products API ${url} returned HTTP ${res.status}`)
  const raw = JSON.parse(res.text)
  return raw.data || raw.products || []
}

/** Same select + enrich path as `src/app/feeds/google-merchant.xml/route.ts`. */
function productsViaRouteQuery(docs: any[]) {
  return mapMerchantFeedDocs(docs.map((doc) => pickMerchantFeedFields(doc)))
}

function serveXml(xml: string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' })
      res.end(xml)
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({
        url: `http://127.0.0.1:${port}${MERCHANT_FEED_PATH}`,
        close: () =>
          new Promise((done) => {
            server.close(() => done())
          }),
      })
    })
  })
}

function schemaMatches(products: any[], items: FeedItem[]): string[] {
  const mismatches: string[] = []
  const byHandle = new Map<string, FeedItem[]>()
  for (const item of items) {
    const handle = handleFromLink(item.link)
    const list = byHandle.get(handle) || []
    list.push(item)
    byHandle.set(handle, list)
  }
  for (const product of products) {
    if (isMerchantFeedExcluded(product)) continue
    const group = byHandle.get(product.handle) || []
    if (!group.length) continue
    const schema = generateProductSchema({
      ...product,
      leadTimeCategory: product.productCategory,
    })
    const feedMin = Math.min(...group.map((item) => item.price))
    const feedMax = Math.max(...group.map((item) => item.price))
    const schemaPrice = schema.offers ? Number(schema.offers.price) : NaN
    const schemaHigh = schema.offers?.highPrice != null ? Number(schema.offers.highPrice) : schemaPrice
    if (!schema.offers) {
      mismatches.push(`${product.handle} has feed rows but no JSON-LD offers`)
      continue
    }
    if (Math.abs(schemaPrice - feedMin) > 0.001) {
      mismatches.push(`${product.handle} schema price ${schemaPrice} != feed min ${feedMin}`)
    }
    if (Math.abs(schemaHigh - feedMax) > 0.001) {
      mismatches.push(`${product.handle} schema high ${schemaHigh} != feed max ${feedMax}`)
    }
    const schemaHandling = schema.offers.shippingDetails?.deliveryTime?.handlingTime?.minValue
    const catalogHandling = merchantHandlingDays(product).min
    if (schemaHandling !== catalogHandling) {
      mismatches.push(`${product.handle} schema handling ${schemaHandling} != catalog ${catalogHandling}`)
    }
    for (const item of group) {
      if (Number(item.minHandling) !== catalogHandling || Number(item.maxHandling) !== catalogHandling) {
        mismatches.push(
          `${product.handle} feed handling ${item.minHandling}-${item.maxHandling} != catalog ${catalogHandling}`
        )
      }
    }
  }
  return mismatches
}

function handlingDistribution(products: any[]) {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
  for (const product of products) {
    if (isMerchantFeedExcluded(product)) continue
    const days = merchantHandlingDays(product).min
    dist[days] = (dist[days] || 0) + 1
  }
  return dist
}

async function main() {
  const routeUrl = `${BASE}${MERCHANT_FEED_PATH}`
  let routeStatus = 0
  let routeXml = ''
  try {
    const routeRes = await fetchText(routeUrl)
    routeStatus = routeRes.status
    routeXml = routeRes.text
  } catch (error) {
    console.error('[verify] Next route not reachable:', error instanceof Error ? error.message : error)
  }

  const rawDocs = await loadProducts()
  const products = productsViaRouteQuery(rawDocs)
  const generatedXml = renderGoogleMerchantRss(productsToMerchantItems(products))
  const local = await serveXml(generatedXml)
  const fetched = await fetchText(local.url)
  await local.close()

  const xml = parseItems(routeXml).length ? routeXml : fetched.text
  const source = parseItems(routeXml).length ? 'next-route' : 'local-generated-from-route-query'
  const items = parseItems(xml)

  if (!xml.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
    throw new Error('Feed is not RSS 2.0 with the g namespace')
  }
  if (/pickup/i.test(xml)) {
    throw new Error('Feed advertises pickup')
  }

  const zeroPrice = items.filter((item) => !item.price || item.price <= 0)
  const badImages = items.filter((item) => {
    const urls = [item.imageLink, ...item.additionalImages].map(decodeXml)
    return urls.some((url) => !url.startsWith('https://'))
  })
  const excludedInFeed = items.filter((item) =>
    MERCHANT_EXCLUDED_HANDLES.some((handle) => decodeXml(item.link).includes(`/products/${handle}`))
  )
  const mismatches = schemaMatches(products, items)
  const ids = items.map((item) => item.id)
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
  const skuLikeIds = ids.filter((id) => /^CCD-/i.test(id))
  const sample = items
    .filter((item) =>
      ['standard-cupcake-box-3', 'chocolate-chocolate-round-cake', 'deluxe-box-of-12'].some((handle) =>
        decodeXml(item.link).endsWith(`/products/${handle}`)
      )
    )
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: decodeXml(item.title),
      price: item.priceText,
      image: decodeXml(item.imageLink),
      link: decodeXml(item.link),
      itemGroupId: item.itemGroupId || null,
      handling: `${item.minHandling}-${item.maxHandling}`,
    }))

  const report = {
    nextRouteUrl: routeUrl,
    nextRouteStatus: routeStatus,
    xmlSource: source,
    itemCount: items.length,
    productUrlCount: new Set(items.map((item) => decodeXml(item.link))).size,
    handlingDistribution: handlingDistribution(products),
    zeroPriceCount: zeroPrice.length,
    relativeOrHttpImageCount: badImages.length,
    duplicateIdCount: duplicateIds.length,
    skuLikeIdCount: skuLikeIds.length,
    excludedInFeed: excludedInFeed.map((item) => item.link),
    excludedHandles: [
      ...MERCHANT_EXCLUDED_HANDLES,
      'gift-voucher-25',
      'gift-voucher-50',
      'gift-voucher-100',
      'make-your-own-cupcake-box',
    ],
    mismatchCount: mismatches.length,
    mismatches: mismatches.slice(0, 20),
    sample,
  }

  console.log(JSON.stringify(report, null, 2))

  const failures: string[] = []
  if (!items.length) failures.push('Feed has 0 items')
  if (zeroPrice.length) failures.push(`${zeroPrice.length} items have price 0`)
  if (badImages.length) failures.push(`${badImages.length} items have a non-https image`)
  if (excludedInFeed.length) failures.push('Excluded quote-only products are in the feed')
  if (mismatches.length) failures.push(`${mismatches.length} schema/feed price mismatches`)
  if (duplicateIds.length) failures.push(`${duplicateIds.length} duplicate g:id values`)
  if (skuLikeIds.length) failures.push('Feed g:id still uses SKU values')
  if (failures.length) {
    throw new Error(failures.join('; '))
  }
  console.log(`OK ${items.length} items, schema prices match feed prices`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
