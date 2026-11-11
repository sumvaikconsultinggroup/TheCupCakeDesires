/**
 * Checks and pricing for an order a staff member types in from a phone call or email.
 * The saved document is a normal Order — same items, delivery, tracking, and invoice fields
 * the website checkout writes.
 */

import { calculateDeliveryCharge } from '@/utils/deliveryCharge'
import { isRealCalendarDate, STANDARD_DELIVERY_SLOT } from '@/utils/deliveryArea'
import { isServiceablePostcode, normalisePostcode, normalizeShippingState } from '@/utils/deliveryZones'

export type ManualOrderSource = 'phone' | 'email'
export type OfflinePayMethod = 'cash' | 'bank_transfer' | 'card'

export interface ManualOrderItemInput {
  productId: string
  option1Value: string
  option2Value: string
  option3Value: string
  quantity: number
}

export interface ManualCatalogVariant {
  option1Value?: string
  option2Value?: string
  option3Value?: string
  price?: unknown
  inventoryPolicy?: string
  inventoryQty?: number
  image?: string
}

export interface ManualOrderInput {
  source: ManualOrderSource
  customer: { firstName: string; lastName: string; email: string; phone: string }
  address: { street: string; city: string; state: string; postalCode: string }
  deliveryDate: string
  deliverySlot: string
  note: string
  items: ManualOrderItemInput[]
  paymentCollected: boolean
  paymentMethod: OfflinePayMethod | ''
}

const AU_PHONE = /^(?:\+?61)?0?[2-578]\d{8}$/
const EMAIL = /^\S+@\S+\.\S+$/

export function melbourneDateISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function money(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown, max: number): string {
  return String(value ?? '')
    .trim()
    .slice(0, max)
}

export function validateManualOrderInput(
  raw: unknown,
  opts?: { today?: string }
): { ok: true; value: ManualOrderInput } | { ok: false; message: string } {
  const body = asRecord(raw)
  if (!body) return { ok: false, message: 'Order details are missing.' }

  const source = text(body.source, 20).toLowerCase()
  if (source !== 'phone' && source !== 'email') {
    return { ok: false, message: 'Choose phone or email for where this order came from.' }
  }

  const customer = asRecord(body.customer) || {}
  const firstName = text(customer.firstName, 80)
  const lastName = text(customer.lastName, 80)
  const email = text(customer.email, 160).toLowerCase()
  const phoneRaw = text(customer.phone, 30)
  const phoneDigits = phoneRaw.replace(/[\s-]/g, '')

  if (!firstName || !lastName) {
    return { ok: false, message: 'First name and last name are required.' }
  }
  if (!EMAIL.test(email)) {
    return { ok: false, message: 'A valid email is required so we can send tracking and the invoice.' }
  }
  if (!AU_PHONE.test(phoneDigits)) {
    return { ok: false, message: 'A valid Australian phone number is required.' }
  }

  const address = asRecord(body.address) || {}
  const street = text(address.street, 200)
  const city = text(address.city, 80)
  const state = normalizeShippingState(text(address.state, 40))
  const postalCode = normalisePostcode(text(address.postalCode, 8))

  if (!street || !city) {
    return { ok: false, message: 'Street and suburb are required.' }
  }
  if (!state) {
    return { ok: false, message: 'We only deliver in Victoria.' }
  }
  if (!postalCode || !isServiceablePostcode(postalCode)) {
    return {
      ok: false,
      message: postalCode
        ? `We don't deliver to ${postalCode} yet.`
        : 'Postal code must be 4 digits.',
    }
  }

  const deliveryDate = text(body.deliveryDate, 10)
  const today = opts?.today || melbourneDateISO()
  if (!isRealCalendarDate(deliveryDate)) {
    return { ok: false, message: 'Choose a valid delivery date.' }
  }
  if (deliveryDate < today) {
    return { ok: false, message: 'Delivery date cannot be in the past.' }
  }

  const slotRaw = text(body.deliverySlot, 60)
  const deliverySlot = slotRaw || STANDARD_DELIVERY_SLOT

  const note = text(body.note, 1000)

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, message: 'Add at least one product.' }
  }
  if (body.items.length > 30) {
    return { ok: false, message: 'An order can have at most 30 lines.' }
  }

  const items: ManualOrderItemInput[] = []
  for (const entry of body.items) {
    const line = asRecord(entry)
    if (!line) return { ok: false, message: 'One of the products is incomplete.' }
    const productId = text(line.productId, 40)
    const quantity = Number(line.quantity)
    if (!/^[a-f0-9]{24}$/i.test(productId)) {
      return { ok: false, message: 'One of the products is invalid.' }
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      return { ok: false, message: 'Quantity must be a whole number between 1 and 500.' }
    }
    items.push({
      productId,
      option1Value: text(line.option1Value, 120),
      option2Value: text(line.option2Value, 120),
      option3Value: text(line.option3Value, 120),
      quantity,
    })
  }

  const paymentCollected = body.paymentCollected === true
  const method = text(body.paymentMethod, 40).toLowerCase().replace(/\s+/g, '_')
  let paymentMethod: OfflinePayMethod | '' = ''
  if (paymentCollected) {
    if (method !== 'cash' && method !== 'bank_transfer' && method !== 'card') {
      return { ok: false, message: 'Choose how this order was paid: cash, bank transfer, or card.' }
    }
    paymentMethod = method
  }

  return {
    ok: true,
    value: {
      source,
      customer: { firstName, lastName, email, phone: phoneRaw },
      address: { street, city, state, postalCode },
      deliveryDate,
      deliverySlot,
      note,
      items,
      paymentCollected,
      paymentMethod,
    },
  }
}

function sameOption(stored: unknown, chosen: string): boolean {
  return String(stored ?? '') === chosen
}

/**
 * Pick the catalog variant the staff member selected, then apply the same
 * stock and price checks the website checkout uses.
 */
export function resolveManualVariant(
  variants: ManualCatalogVariant[],
  item: Pick<ManualOrderItemInput, 'option1Value' | 'option2Value' | 'option3Value' | 'quantity'>,
  productTitle: string
): { ok: true; variant: ManualCatalogVariant; price: number } | { ok: false; message: string } {
  if (!variants.length) {
    return { ok: false, message: `${productTitle} is not configured for sale.` }
  }

  let variant = variants.find(
    (entry) =>
      sameOption(entry.option1Value, item.option1Value) &&
      sameOption(entry.option2Value, item.option2Value) &&
      sameOption(entry.option3Value, item.option3Value)
  )
  if (!variant && variants.length === 1) variant = variants[0]
  if (!variant) {
    return { ok: false, message: `Choose a size for ${productTitle}.` }
  }

  const onHand = variant.inventoryQty
  if (variant.inventoryPolicy === 'deny' && typeof onHand === 'number' && onHand < item.quantity) {
    const label = [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' · ')
    return {
      ok: false,
      message: label
        ? `Not enough stock for ${productTitle} — ${label}.`
        : `Not enough stock for ${productTitle}.`,
    }
  }

  const price = variant.price
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return {
      ok: false,
      message: `${productTitle} has an invalid price. Set a valid price before saving this order.`,
    }
  }

  return { ok: true, variant, price }
}

export function priceManualOrder(
  lines: Array<{ price: number; quantity: number }>,
  postcode: string
): {
  subtotal: number
  shipping: number
  discount: number
  gstRate: number
  taxableValue: number
  taxes: number
  totalAmount: number
} {
  const subtotal = money(lines.reduce((sum, line) => sum + (Number(line.price) || 0) * line.quantity, 0))
  const shipping = calculateDeliveryCharge(subtotal, false, postcode).amount
  const gstRate = 10
  const taxableValue = money(subtotal / (1 + gstRate / 100))
  const taxes = money(subtotal - taxableValue)
  return {
    subtotal,
    shipping,
    discount: 0,
    gstRate,
    taxableValue,
    taxes,
    totalAmount: money(subtotal + shipping),
  }
}

export function generateOrderCode(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${timestamp}-${randomStr}`
}
