/**
 * Google Merchant Center catalogue mapping.
 *
 * Reads product prices, min-order quantity, and deliveryCharge / delivery
 * zones. Does not change checkout, pricing, or delivery logic.
 */

import { BRAND_NAME } from '@/lib/brand'
import { isEnquiryOnlyProduct } from '@/lib/enquiry-only-products'
import { sha1Hex } from '@/lib/sha1'
import { absoluteUrl, getSiteUrl } from '@/lib/site-url'
import { CAKE_CATEGORIES, leadDaysForItems } from '@/utils/deliveryArea'
import { calculateDeliveryCharge } from '@/utils/deliveryCharge'
import { listDeliveryZones } from '@/utils/deliveryZones'

/** Google Merchant Center g:id max length. */
export const MERCHANT_ID_MAX = 50
const MERCHANT_ID_HASH_LEN = 8

export const MERCHANT_FEED_PATH = '/feeds/google-merchant.xml'
export const MERCHANT_BRAND = 'The Cupcake Desire'
export const MERCHANT_CURRENCY = 'AUD'

/** Quote-only or unpriced product pages that must not appear as Shopping offers. */
export const MERCHANT_EXCLUDED_HANDLES = [
  'wedding-cupcake-tier',
  'custom-birthday-cake',
  'sorry-cupcakes-3-cupcakes',
] as const

const EXCLUDED_HANDLE_SET = new Set<string>(MERCHANT_EXCLUDED_HANDLES)

export const GPC_CUPCAKES = 'Food, Beverages & Tobacco > Food Items > Bakery > Cupcakes'
export const GPC_CAKES = 'Food, Beverages & Tobacco > Food Items > Bakery > Cakes & Dessert Bars'
export const GPC_BAKERY = 'Food, Beverages & Tobacco > Food Items > Bakery'

export const MERCHANT_TRANSIT = { min: 0, max: 1 } as const

export type MerchantVariantInput = {
  option1Value?: string
  option2Value?: string
  option3Value?: string
  sku?: string
  price?: number
  inventoryQty?: number
  image?: string
}

export type MerchantProductInput = {
  _id?: string
  handle: string
  title: string
  bodyHtml?: string
  description?: string
  vendor?: string
  productCategory?: string
  type?: string
  tags?: string[]
  minOrderQty?: number
  giftCard?: boolean
  options?: Array<{ name?: string; values?: string[] }>
  variants?: MerchantVariantInput[]
  images?: Array<{ src?: string }>
}

export type MerchantFeedItem = {
  id: string
  itemGroupId?: string
  title: string
  description: string
  link: string
  canonicalLink?: string
  imageLink: string
  additionalImageLinks: string[]
  availability: 'in_stock' | 'out_of_stock'
  price: number
  priceFormatted: string
  condition: 'new'
  brand: string
  identifierExists: 'no'
  googleProductCategory: string
  productType: string
  size?: string
  flavor?: string
  shipsFromCountry: 'AU'
  minHandlingTime: number
  maxHandlingTime: number
  minTransitTime: number
  maxTransitTime: number
  shipping: Array<{ country: 'AU'; postalCode: string; priceFormatted: string }>
}

export function effectiveMinOrderQty(product: { handle?: string | null; minOrderQty?: number } | null | undefined): number {
  const qty = Math.max(1, Math.floor(Number(product?.minOrderQty) || 1))
  if (qty > 1) return qty
  const handle = String(product?.handle || '').toLowerCase()
  if (/cupcake-box-3$/.test(handle) || /-3-cupcakes$/.test(handle) || /box-3$/.test(handle)) return 3
  return 1
}

export function minimumPayablePrice(unitPrice: number | string | null | undefined, minOrderQty?: number): number {
  const unit = typeof unitPrice === 'number' ? unitPrice : Number(unitPrice)
  if (!Number.isFinite(unit) || unit <= 0) return 0
  const qty = Math.max(1, Math.floor(Number(minOrderQty) || 1))
  return Math.round(unit * qty * 100) / 100
}

export function payableVariantPrices(
  variants: Array<{ price?: number }> | undefined,
  minOrderQty?: number
): number[] {
  return (variants || [])
    .map((variant) => minimumPayablePrice(variant.price, minOrderQty))
    .filter((price) => price > 0)
}

export function formatMerchantPrice(amount: number): string {
  return `${amount.toFixed(2)} ${MERCHANT_CURRENCY}`
}

export function isMerchantOfferExcluded(handle?: string | null): boolean {
  if (!handle) return false
  const h = handle.trim().toLowerCase()
  if (EXCLUDED_HANDLE_SET.has(h)) return true
  return isEnquiryOnlyProduct(h)
}

export function isMerchantFeedExcluded(
  product: { handle?: string | null; giftCard?: boolean } | null | undefined
): boolean {
  if (!product?.handle) return true
  const h = product.handle.trim().toLowerCase()
  if (isMerchantOfferExcluded(h)) return true
  if (product.giftCard) return true
  if (h === 'make-your-own-cupcake-box') return true
  if (h.startsWith('gift-voucher')) return true
  return false
}

const CAKE_CATEGORY_SET = new Set(CAKE_CATEGORIES.map((c) => c.toLowerCase()))

export function isMerchantCake(product: {
  productCategory?: string | null
  handle?: string | null
  title?: string | null
}): boolean {
  const category = String(product.productCategory || '').trim().toLowerCase()
  if (category && CAKE_CATEGORY_SET.has(category)) return true
  if (category.includes('cake') && !category.includes('cupcake')) return true

  const handle = String(product.handle || '').toLowerCase()
  const title = String(product.title || '').toLowerCase()
  const hay = `${handle} ${title}`.replace(/cupcakes?/g, ' ')
  if (/\bcakes?\b/.test(hay)) return true
  if (/(?:^|-)(?:round-cake|dress-cake|drip-cake|birthday-cake)/.test(handle)) return true
  return false
}

/** Checkout lead time for one of this product: cakes 3, exactly one box 1, others 2, unknown 3. */
export function merchantHandlingDays(product: {
  productCategory?: string | null
  minOrderQty?: number
}): { min: number; max: number } {
  const days = leadDaysForItems([
    {
      category: product.productCategory,
      quantity: Math.max(1, Math.floor(Number(product.minOrderQty) || 1)),
    },
  ])
  return { min: days, max: days }
}

export function googleProductCategoryFor(product: {
  productCategory?: string | null
  handle?: string | null
  title?: string | null
}): string {
  if (isMerchantCake(product)) return GPC_CAKES
  const hay = `${product.productCategory || ''} ${product.handle || ''} ${product.title || ''}`.toLowerCase()
  if (hay.includes('macaron')) return GPC_BAKERY
  return GPC_CUPCAKES
}

export function merchantAbsoluteUrl(src: string | null | undefined): string {
  const raw = String(src || '').trim()
  if (!raw) return ''
  if (raw.startsWith('//')) return `https:${raw}`
  if (/^https:\/\//i.test(raw)) return raw
  if (/^http:\/\//i.test(raw)) return `https://${raw.slice('http://'.length)}`
  return absoluteUrl(raw.startsWith('/') ? raw : `/${raw}`)
}

function isUsableProductImage(src: string): boolean {
  const lower = src.toLowerCase()
  if (!lower) return false
  if (lower.includes('cupcake-logo')) return false
  if (lower.includes('/og-image')) return false
  return true
}

export function merchantAbsoluteImageUrls(images?: Array<{ src?: string } | string> | null): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const image of images || []) {
    const src = typeof image === 'string' ? image : image?.src
    const abs = merchantAbsoluteUrl(src)
    if (!abs || !isUsableProductImage(abs) || seen.has(abs)) continue
    seen.add(abs)
    out.push(abs)
  }
  return out
}

export function metroMelbournePostalCodes(): string[] {
  return listDeliveryZones()
    .map((zone) => zone.postcode)
    .sort()
}

/** Consecutive serviceable postcodes compacted into Google postal_code ranges. */
export function compactPostcodes(codes: string[]): string[] {
  const nums = [...new Set(codes.map((c) => Number(c)).filter((n) => Number.isFinite(n)))].sort((a, b) => a - b)
  if (!nums.length) return []
  const ranges: string[] = []
  let start = nums[0]
  let prev = nums[0]
  const pad = (n: number) => String(n).padStart(4, '0')
  const flush = () => {
    ranges.push(start === prev ? pad(start) : `${pad(start)}-${pad(prev)}`)
  }
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i]
    if (n === prev + 1) {
      prev = n
      continue
    }
    flush()
    start = n
    prev = n
  }
  flush()
  return ranges
}

export function merchantShippingRate(minPayable: number): {
  '@type': 'MonetaryAmount'
  currency: 'AUD'
  value?: string | number
  minValue?: number
  maxValue?: number
} {
  const amounts = listDeliveryZones().map(
    (zone) => calculateDeliveryCharge(minPayable, false, zone.postcode).amount
  )
  const min = amounts.length ? Math.min(...amounts) : 0
  const max = amounts.length ? Math.max(...amounts) : 0
  if (min === max) {
    return { '@type': 'MonetaryAmount', value: min, currency: MERCHANT_CURRENCY }
  }
  return { '@type': 'MonetaryAmount', minValue: min, maxValue: max, currency: MERCHANT_CURRENCY }
}

export function merchantShippingRows(minPayable: number): Array<{
  country: 'AU'
  postalCode: string
  priceFormatted: string
}> {
  const byFee = new Map<number, string[]>()
  for (const zone of listDeliveryZones()) {
    const amount = calculateDeliveryCharge(minPayable, false, zone.postcode).amount
    const list = byFee.get(amount) || []
    list.push(zone.postcode)
    byFee.set(amount, list)
  }
  const rows: Array<{ country: 'AU'; postalCode: string; priceFormatted: string }> = []
  for (const [amount, codes] of [...byFee.entries()].sort((a, b) => a[0] - b[0])) {
    const priceFormatted = formatMerchantPrice(amount)
    for (const postalCode of compactPostcodes(codes)) {
      rows.push({ country: 'AU', postalCode, priceFormatted })
    }
  }
  return rows
}

function stripHtml(html: string): string {
  return (
    html
      ?.replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim() || ''
  )
}

/** Feed titles and descriptions only. Leave PDP and DB copy unchanged. */
export function feedPlainText(text: string): string {
  return text
    .replace(/\u2014/g, ',')
    .replace(/\u2013/g, ',')
    .replace(/\u2015/g, ',')
    .replace(/&mdash;/gi, ',')
    .replace(/&ndash;/gi, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function optionLabel(value?: string | null): string {
  const v = String(value || '').trim()
  if (!v) return ''
  if (/^default$/i.test(v)) return ''
  return v
}

function looksLikeSize(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^(standard|assorted)$/i.test(v)) return false
  if (/^\d+\s*"$/.test(v)) return true
  return /(\d+\s*(?:"|inch|in)\b)|box of\s*\d+|\d+\s*minis?/i.test(v)
}

function hasSizeOption(product: MerchantProductInput): boolean {
  return (product.options || []).some((option) => /size/i.test(String(option?.name || '')))
}

function variantSizeFlavor(product: MerchantProductInput, variant: MerchantVariantInput): {
  size?: string
  flavor?: string
} {
  const o1 = optionLabel(variant.option1Value)
  const o2 = optionLabel(variant.option2Value)
  const optionNames = (product.options || []).map((option) => String(option?.name || '').toLowerCase())
  const o1IsSize = optionNames[0]?.includes('size') || looksLikeSize(o1)
  const o1IsFlavor = optionNames[0]?.includes('flavour') || optionNames[0]?.includes('flavor')
  if (o1IsSize) return { size: o1 || undefined, flavor: o2 || undefined }
  if (o1IsFlavor) return { flavor: o1 || undefined, size: o2 && looksLikeSize(o2) ? o2 : undefined }
  if (looksLikeSize(o2)) return { size: o2, flavor: o1 || undefined }
  return { flavor: o1 || undefined, size: o2 || undefined }
}

/** One feed row per size (or per distinct price). Same-price flavour-only products stay one row. */
function variantsForFeed(product: MerchantProductInput, variants: MerchantVariantInput[], minQty: number): MerchantVariantInput[] {
  if (variants.length <= 1) return variants

  const sized = variants.map((variant) => optionLabel(variant.option1Value)).filter((label) => {
    if (hasSizeOption(product)) return Boolean(label)
    return looksLikeSize(label)
  })
  const uniqueSizes = new Set(sized)
  if (uniqueSizes.size > 1) {
    const bySize = new Map<string, MerchantVariantInput>()
    for (const variant of variants) {
      const size = optionLabel(variant.option1Value) || 'Default'
      const prev = bySize.get(size)
      if (!prev || minimumPayablePrice(variant.price, minQty) < minimumPayablePrice(prev.price, minQty)) {
        bySize.set(size, variant)
      }
    }
    return [...bySize.values()]
  }

  const prices = new Set(variants.map((variant) => minimumPayablePrice(variant.price, minQty)))
  if (prices.size > 1) return variants
  return [variants[0]]
}

function variantTitle(productTitle: string, variant: MerchantVariantInput): string {
  const extras = [optionLabel(variant.option1Value), optionLabel(variant.option2Value)].filter(Boolean)
  const missing = extras.filter((bit) => !productTitle.toLowerCase().includes(bit.toLowerCase()))
  if (!missing.length) return productTitle
  return `${productTitle} ${missing.join(' ')}`
}

function slugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function variantKey(variant: MerchantVariantInput, index: number): string {
  const bits = [optionLabel(variant.option1Value), optionLabel(variant.option2Value), optionLabel(variant.option3Value)]
    .filter(Boolean)
    .map(slugPart)
    .filter(Boolean)
  return bits.length ? bits.join('_') : `v${index + 1}`
}

function fullMerchantItemKey(handle: string, variant: MerchantVariantInput, index: number, grouped: boolean): string {
  if (!grouped) return handle
  return `${handle}__${variantKey(variant, index)}`
}

/**
 * Feed g:id. Keys already at 50 characters or fewer stay as-is.
 * Longer keys become truncatedHandle + __ + 8 hex of sha1(full key).
 */
export function merchantFeedItemId(
  handle: string,
  variant: MerchantVariantInput,
  index: number,
  grouped: boolean
): string {
  const fullKey = fullMerchantItemKey(handle, variant, index, grouped)
  if (fullKey.length <= MERCHANT_ID_MAX) return fullKey
  const hash = sha1Hex(fullKey).slice(0, MERCHANT_ID_HASH_LEN)
  const suffix = `__${hash}`
  const truncatedHandle = handle.slice(0, Math.max(1, MERCHANT_ID_MAX - suffix.length))
  return `${truncatedHandle}${suffix}`.slice(0, MERCHANT_ID_MAX)
}

function uniqueId(base: string, used: Set<string>): string {
  if (base.length <= MERCHANT_ID_MAX && !used.has(base)) {
    used.add(base)
    return base
  }
  let n = 2
  while (true) {
    const suffix = `_${n}`
    const id = `${base.slice(0, Math.max(1, MERCHANT_ID_MAX - suffix.length))}${suffix}`
    if (!used.has(id)) {
      used.add(id)
      return id
    }
    n += 1
  }
}

function inStockFor(variant: MerchantVariantInput): boolean {
  return (variant.inventoryQty ?? 10) > 0
}

export function productsToMerchantItems(products: MerchantProductInput[]): MerchantFeedItem[] {
  const usedIds = new Set<string>()
  const items: MerchantFeedItem[] = []

  for (const product of products) {
    if (isMerchantFeedExcluded(product)) continue

    const handle = String(product.handle || '').trim()
    if (!handle) continue

    const minQty = effectiveMinOrderQty(product)
    const variants = (product.variants || []).filter((variant) => minimumPayablePrice(variant.price, minQty) > 0)
    if (!variants.length) continue

    const images = merchantAbsoluteImageUrls([
      ...variants.map((variant) => variant.image).filter(Boolean).map((src) => ({ src })),
      ...(product.images || []),
    ])
    if (!images.length) continue

    const handling = merchantHandlingDays(product)
    const googleProductCategory = googleProductCategoryFor(product)
    const description = feedPlainText(
      stripHtml(product.bodyHtml || product.description || '') || `${product.title} baked to order in Narre Warren.`
    )
    const link = absoluteUrl(`/products/${handle}`)
    const feedVariants = variantsForFeed(product, variants, minQty)
    const grouped = feedVariants.length > 1
    const collapsedSamePrice = feedVariants.length === 1 && variants.length > 1

    for (let index = 0; index < feedVariants.length; index++) {
      const variant = feedVariants[index]
      const price = minimumPayablePrice(variant.price, minQty)
      const imageLink = merchantAbsoluteUrl(variant.image) || images[0]
      const additionalImageLinks = images.filter((src) => src !== imageLink).slice(0, 10)
      const sizeKey = optionLabel(variant.option1Value)
      const flavorsAtSize = variants.filter((row) => optionLabel(row.option1Value) === sizeKey).length
      const hideFlavor = collapsedSamePrice || (grouped && flavorsAtSize > 1)
      const { size, flavor } = hideFlavor
        ? { size: variantSizeFlavor(product, variant).size, flavor: undefined }
        : variantSizeFlavor(product, variant)
      const rawTitle =
        hideFlavor && !size
          ? product.title
          : variantTitle(product.title, { ...variant, option2Value: hideFlavor ? undefined : variant.option2Value })
      const title = feedPlainText(rawTitle)
      const typeParts = [product.productCategory || product.type || 'Cupcakes', size].filter(Boolean)

      items.push({
        id: uniqueId(merchantFeedItemId(handle, variant, index, grouped), usedIds),
        itemGroupId: grouped ? handle : undefined,
        title,
        description,
        link,
        canonicalLink: grouped ? link : undefined,
        imageLink,
        additionalImageLinks,
        availability: inStockFor(variant) ? 'in_stock' : 'out_of_stock',
        price,
        priceFormatted: formatMerchantPrice(price),
        condition: 'new',
        brand: MERCHANT_BRAND,
        identifierExists: 'no',
        googleProductCategory,
        productType: typeParts.join(' > '),
        size: size || undefined,
        flavor: flavor || undefined,
        shipsFromCountry: 'AU',
        minHandlingTime: handling.min,
        maxHandlingTime: handling.max,
        minTransitTime: MERCHANT_TRANSIT.min,
        maxTransitTime: MERCHANT_TRANSIT.max,
        shipping: merchantShippingRows(price),
      })
    }
  }

  return items
}

function xmlText(value: string | number): string {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function itemXml(item: MerchantFeedItem): string {
  const extraImages = item.additionalImageLinks
    .map((src) => `      <g:additional_image_link>${xmlText(src)}</g:additional_image_link>`)
    .join('\n')
  const shipping = item.shipping
    .map(
      (row) => `      <g:shipping>
        <g:country>${row.country}</g:country>
        <g:postal_code>${xmlText(row.postalCode)}</g:postal_code>
        <g:price>${xmlText(row.priceFormatted)}</g:price>
      </g:shipping>`
    )
    .join('\n')

  return `    <item>
      <title>${xmlText(item.title)}</title>
      <link>${xmlText(item.link)}</link>
      <description>${xmlText(item.description)}</description>
      <g:id>${xmlText(item.id)}</g:id>
      ${item.itemGroupId ? `<g:item_group_id>${xmlText(item.itemGroupId)}</g:item_group_id>` : ''}
      <g:title>${xmlText(item.title)}</g:title>
      <g:description>${xmlText(item.description)}</g:description>
      <g:link>${xmlText(item.link)}</g:link>
      ${item.canonicalLink ? `<g:canonical_link>${xmlText(item.canonicalLink)}</g:canonical_link>` : ''}
      <g:image_link>${xmlText(item.imageLink)}</g:image_link>
${extraImages}
      <g:availability>${item.availability}</g:availability>
      <g:price>${xmlText(item.priceFormatted)}</g:price>
      <g:condition>${item.condition}</g:condition>
      <g:brand>${xmlText(item.brand)}</g:brand>
      <g:identifier_exists>${item.identifierExists}</g:identifier_exists>
      <g:google_product_category>${xmlText(item.googleProductCategory)}</g:google_product_category>
      <g:product_type>${xmlText(item.productType)}</g:product_type>
      ${item.size ? `<g:size>${xmlText(item.size)}</g:size>` : ''}
      ${item.flavor ? `<g:flavor>${xmlText(item.flavor)}</g:flavor>` : ''}
      <g:ships_from_country>${item.shipsFromCountry}</g:ships_from_country>
      <g:min_handling_time>${item.minHandlingTime}</g:min_handling_time>
      <g:max_handling_time>${item.maxHandlingTime}</g:max_handling_time>
      <g:min_transit_time>${item.minTransitTime}</g:min_transit_time>
      <g:max_transit_time>${item.maxTransitTime}</g:max_transit_time>
${shipping}
    </item>`
}

export function emptyMerchantRss(): string {
  return renderGoogleMerchantRss([])
}

export function renderGoogleMerchantRss(items: MerchantFeedItem[]): string {
  const site = getSiteUrl()
  const body = items.map(itemXml).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlText(BRAND_NAME)}</title>
    <link>${xmlText(site)}</link>
    <description>Google Merchant Center product feed for Australia free listings. Metro Melbourne delivery only. Order by noon Melbourne time on weekdays.</description>
${body}
  </channel>
</rss>
`
}
