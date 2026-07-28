/**
 * The Cupcake Desire email service.
 *
 * All public exports preserve their original signatures. Internally every
 * send now goes through Resend (`src/lib/email/send.ts`) — no Nodemailer.
 *
 * The highest-volume customer emails (`OrderPlaced`, `OrderConfirmed`,
 * `OrderOutForDelivery`) plus the operations alert and the 3 cart-recovery
 * emails use polished React Email templates. The remaining `.hbs` templates
 * still compile via Handlebars and ship through Resend until migrated.
 *
 * The Cupcake Desire self-delivers in Melbourne — there's no courier, so the
 * legacy `OrderShipped` / "tracking number" email was removed and replaced
 * with `OrderOutForDelivery`.
 */
import fs from 'fs'
import path from 'path'

import handlebars from 'handlebars'
import * as React from 'react'

import { buildOrderAccessUrl } from '@/lib/order-access-token'

import type { OrderItem } from '@/emails/components/OrderItemsTable'
import { AbandonedCartH0Email } from '@/emails/templates/AbandonedCartH0Email'
import { AbandonedCartH24Email } from '@/emails/templates/AbandonedCartH24Email'
import { AbandonedCartH48Email } from '@/emails/templates/AbandonedCartH48Email'
import { OperationsNewOrderEmail } from '@/emails/templates/OperationsNewOrderEmail'
import { OrderConfirmedEmail } from '@/emails/templates/OrderConfirmedEmail'
import { OrderPlacedEmail } from '@/emails/templates/OrderPlacedEmail'
import { OrderOutForDeliveryEmail } from '@/emails/templates/OrderOutForDeliveryEmail'
import { sendEmail } from '@/lib/email/send'

// ---------- helpers --------------------------------------------------------

interface SendResult {
  success: boolean
  error?: string
}

interface RawHbsData {
  [key: string]: unknown
}

interface OrderItemRaw {
  productId?: string
  name?: string
  imageUrl?: string
  quantity?: number
  price?: number
  variants?: Array<{ name?: string; option?: string }>
}

interface OrderShape {
  orderId?: string
  createdAt?: string | Date
  totalAmount?: number
  subtotal?: number
  discount?: number
  shipping?: number
  tax?: number
  items?: OrderItemRaw[]
  customer?: {
    email?: string
    name?: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  user?: { email?: string; firstName?: string; lastName?: string }
  deliveryAddress?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    line2?: string
    city?: string
    state?: string
    zipcode?: string
    country?: string
  }
  shippingAddress?: {
    street?: string
    address?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  userEmail?: string
  billing_email?: string
  paymentDetails?: {
    paymentMethod?: string
    paymentStatus?: string
    status?: string
  }
  paymentMethod?: string
  deliveryDate?: string | Date
  deliverySlot?: string
  notes?: Array<{ content?: string; author?: string; isInternal?: boolean }>
  [key: string]: unknown
}

const FE = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://thecupcakedesire.com.au'
const ADMIN_BASE = process.env.NEXT_PUBLIC_ADMIN_URL || `${FE}/admin`

// Public tracking deep link — works for guests AND logged-in customers
// (the /track-order page auto-looks-up when both params are present).
const trackUrl = (orderId?: string, email?: string) =>
  `${FE}/track-order?orderId=${encodeURIComponent(orderId || '')}&email=${encodeURIComponent(email || '')}`

function pickEmail(order: OrderShape): string | undefined {
  return (
    order.customer?.email || order.user?.email || order.deliveryAddress?.email || order.userEmail || order.billing_email
  )
}

function pickName(order: OrderShape): string {
  return (
    order.customer?.name ||
    (order.customer?.firstName && order.customer?.lastName
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.customer?.firstName) ||
    (order.user?.firstName && order.user?.lastName
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.user?.firstName) ||
    order.deliveryAddress?.firstName ||
    'Customer'
  )
}

function mapItems(order: OrderShape): OrderItem[] {
  return (order.items || []).map((item) => {
    const variantLabel = (item.variants || [])
      .map((v) => v.option)
      .filter(Boolean)
      .join(' · ')
    return {
      name: item.name || 'Product',
      imageUrl: item.imageUrl,
      variantLabel: variantLabel || undefined,
      quantity: item.quantity || 1,
      unitPrice: item.price || 0,
      lineTotal: (item.price || 0) * (item.quantity || 1),
    }
  })
}

function mapShippingAddress(order: OrderShape) {
  const sa = order.shippingAddress
  const da = order.deliveryAddress
  if (!sa && !da) return undefined
  return {
    name: pickName(order),
    line1: sa?.street || sa?.address || da?.address,
    line2: sa?.line2 || da?.line2,
    city: sa?.city || da?.city,
    state: sa?.state || da?.state,
    postalCode: sa?.postalCode || da?.zipcode,
    country: sa?.country || da?.country || 'Australia',
    phone: order.customer?.phone || da?.phone,
  }
}

function formatOrderDate(d?: string | Date): string {
  if (!d) return new Date().toLocaleDateString('en-AU')
  return new Date(d).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function compileHbsTemplate(templateName: string, data: RawHbsData): string {
  const filePath = path.join(process.cwd(), 'src', 'emails', 'templates', `${templateName}.hbs`)
  const html = fs.readFileSync(filePath, 'utf-8')
  return handlebars.compile(html)(data)
}

async function sendHbs(args: {
  to: string
  subject: string
  template: string
  data: RawHbsData
  refId?: string
  refType?: string
}): Promise<SendResult> {
  try {
    const html = compileHbsTemplate(args.template, args.data)
    const wrapper = React.createElement('div', {
      dangerouslySetInnerHTML: { __html: html },
    })
    const res = await sendEmail({
      to: args.to,
      subject: args.subject,
      react: wrapper,
      templateId: args.template,
      refId: args.refId,
      refType: args.refType,
      tags: [
        {
          name: 'template',
          value: args.template.replace(/[^a-z0-9_-]/gi, '-'),
        },
      ],
    })
    return res.success ? { success: true } : { success: false, error: res.error }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error(`[email] hbs ${args.template} failed:`, error)
    return { success: false, error }
  }
}

// ---------- 1. Welcome -----------------------------------------------------
export const sendWelcomeEmail = async (user: { email: string; name: string }): Promise<SendResult> =>
  sendHbs({
    to: user.email,
    subject: 'Welcome to The Cupcake Desire!',
    template: 'welcome',
    data: {
      name: user.name,
      loginUrl: `${FE}/login`,
      homeUrl: FE,
    },
  })

// ---------- 2. Order Placed (React Email) ----------------------------------
export const sendOrderPlacedEmail = async (order: OrderShape): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  const orderId = order.orderId || ''
  const total = Number(order.totalAmount || 0)
  const subtotal = Number(order.subtotal ?? total)

  const res = await sendEmail({
    to,
    subject: `Order Received — ${orderId}`,
    templateId: 'OrderPlacedEmail',
    refId: orderId,
    refType: 'order',
    tags: [
      { name: 'template', value: 'OrderPlacedEmail' },
      {
        name: 'order_id',
        value: orderId.replace(/[^a-zA-Z0-9_-]/g, '-'),
      },
    ],
    idempotencyKey: orderId ? `order-placed-${orderId}` : undefined,
    react: React.createElement(OrderPlacedEmail, {
      recipientEmail: to,
      customerName: pickName(order),
      orderId,
      orderDate: formatOrderDate(order.createdAt),
      items: mapItems(order),
      subtotal,
      discount: Number(order.discount || 0),
      shipping: typeof order.shipping === 'number' ? order.shipping : undefined,
      tax: Number(order.tax || 0),
      total,
      paymentUrl: `${FE}/checkout/payment/${orderId}`,
      // Signed, per-order link so a guest with no account can open this exact
      // booking and cancel it. See lib/order-access-token.
      manageBookingUrl: orderId ? buildOrderAccessUrl(orderId) : undefined,
      shippingAddress: mapShippingAddress(order),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-AU', {
            timeZone: 'Australia/Melbourne',
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : undefined,
      deliveryWindow: order.deliverySlot || undefined,
      deliveryInstructions:
        order.notes?.find((n) => n.author === 'customer' && !n.isInternal)?.content || undefined,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

// ---------- 3. Order Confirmed (React Email) -------------------------------
export const sendOrderConfirmedEmail = async (order: OrderShape): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  const orderId = order.orderId || ''
  const total = Number(order.totalAmount || 0)
  const subtotal = Number(order.subtotal ?? total)

  const res = await sendEmail({
    to,
    subject: `Order Confirmed — ${orderId}`,
    templateId: 'OrderConfirmedEmail',
    refId: orderId,
    refType: 'order',
    tags: [
      { name: 'template', value: 'OrderConfirmedEmail' },
      {
        name: 'order_id',
        value: orderId.replace(/[^a-zA-Z0-9_-]/g, '-'),
      },
    ],
    idempotencyKey: orderId ? `order-confirmed-${orderId}` : undefined,
    react: React.createElement(OrderConfirmedEmail, {
      recipientEmail: to,
      customerName: pickName(order),
      orderId,
      orderDate: formatOrderDate(order.createdAt),
      items: mapItems(order),
      subtotal,
      discount: Number(order.discount || 0),
      shipping: typeof order.shipping === 'number' ? order.shipping : undefined,
      tax: Number(order.tax || 0),
      total,
      paymentMethod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toUpperCase() || undefined,
      orderTrackingUrl: trackUrl(orderId, to),
      manageBookingUrl: orderId ? buildOrderAccessUrl(orderId) : undefined,
      shippingAddress: mapShippingAddress(order),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-AU', {
            timeZone: 'Australia/Melbourne',
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : undefined,
      deliveryWindow: order.deliverySlot || undefined,
      deliveryInstructions:
        order.notes?.find((n) => n.author === 'customer' && !n.isInternal)?.content || undefined,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

// ---------- 4. Out for Delivery (React Email) -----------------------------
// Replaces the legacy `sendOrderPackedEmail` + `sendOrderShippedEmail` pair.
// The Cupcake Desire self-delivers — no courier, no AWB, no tracking number.
export const sendOutForDeliveryEmail = async (
  order: OrderShape,
  opts?: { deliveryWindow?: string; deliveryNote?: string }
): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  const orderId = order.orderId || ''

  const ship = order.shippingAddress
  const del = order.deliveryAddress
  const shippingAddress = {
    name:
      `${del?.firstName || ''} ${del?.lastName || ''}`.trim() ||
      `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
      undefined,
    line1: ship?.street || ship?.address || del?.address || undefined,
    line2: ship?.line2 || del?.line2 || undefined,
    city: ship?.city || del?.city || undefined,
    state: ship?.state || del?.state || undefined,
    postalCode: ship?.postalCode || del?.zipcode || undefined,
    country: ship?.country || del?.country || 'Australia',
    phone: order.customer?.phone || del?.phone || undefined,
  }

  const res = await sendEmail({
    to,
    subject: `On the way — ${orderId}`,
    templateId: 'OrderOutForDeliveryEmail',
    refId: orderId,
    refType: 'order',
    tags: [
      { name: 'template', value: 'OrderOutForDeliveryEmail' },
      { name: 'order_id', value: orderId.replace(/[^a-zA-Z0-9_-]/g, '-') },
    ],
    idempotencyKey: orderId ? `order-out-for-delivery-${orderId}` : undefined,
    react: React.createElement(OrderOutForDeliveryEmail, {
      recipientEmail: to,
      customerName: pickName(order),
      orderId,
      items: mapItems(order),
      deliveryWindow: opts?.deliveryWindow,
      deliveryNote: opts?.deliveryNote,
      shippingAddress,
      trackingUrl: trackUrl(orderId, to),
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

// ---------- 7. Order Delivered --------------------------------------------
export const sendOrderDeliveredEmail = async (order: OrderShape): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Order Delivered — ${order.orderId}`,
    template: 'order-delivered',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      reviewUrl: trackUrl(order.orderId, to),
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 8. Order Cancelled --------------------------------------------
export const sendOrderCancelledEmail = async (order: OrderShape, reason?: string): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Order Cancelled — ${order.orderId}`,
    template: 'order-cancelled',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      reason: reason || 'Cancelled by user request or system',
      refundMention:
        order.paymentDetails?.paymentStatus === 'paid' || order.paymentDetails?.status === 'paid'
          ? 'Your refund has been initiated.'
          : '',
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 9. Payment Failed ---------------------------------------------
export const sendPaymentFailedEmail = async (order: OrderShape): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Payment Failed — ${order.orderId}`,
    template: 'payment-failed',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      retryUrl: `${FE}/checkout/retry/${order.orderId}`,
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 10. Refund Initiated ------------------------------------------
export const sendRefundInitiatedEmail = async (order: OrderShape, amount: number): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Refund Initiated — ${order.orderId}`,
    template: 'refund-initiated',
    data: { name: pickName(order), orderId: order.orderId, amount },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 11. Refund Completed ------------------------------------------
export const sendRefundCompletedEmail = async (
  order: OrderShape,
  amount: number,
  transactionId?: string
): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Refund Completed — ${order.orderId}`,
    template: 'order-refunded',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      amount,
      transactionId: transactionId || 'N/A',
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 12. Invoice ----------------------------------------------------
export const sendInvoiceEmail = async (order: OrderShape, invoiceUrl: string): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Invoice for Order ${order.orderId}`,
    template: 'invoice',
    data: { name: pickName(order), orderId: order.orderId, invoiceUrl },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 13. Support Ticket --------------------------------------------
export const sendSupportTicketEmail = async (ticket: {
  email: string
  name: string
  ticketId: string
  subject: string
  message: string
}): Promise<SendResult> =>
  sendHbs({
    to: ticket.email,
    subject: `Support Ticket Created — #${ticket.ticketId}`,
    template: 'support-ticket',
    data: {
      name: ticket.name,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      message: ticket.message,
    },
    refId: ticket.ticketId,
    refType: 'ticket',
  })

// ---------- 14. Refund Confirmed ------------------------------------------
export const sendRefundConfirmedEmail = async (order: OrderShape, amount: number): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Refund Processed — ${order.orderId}`,
    template: 'order-refunded',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      amount,
      status: 'PROCESSED',
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 15. Refund Cancelled ------------------------------------------
export const sendRefundCancelledEmail = async (order: OrderShape): Promise<SendResult> => {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  return sendHbs({
    to,
    subject: `Refund Request Cancelled — ${order.orderId}`,
    template: 'refund-cancelled',
    data: {
      name: pickName(order),
      orderId: order.orderId,
      supportUrl: `${FE}/support`,
    },
    refId: order.orderId,
    refType: 'order',
  })
}

// ---------- 16. Operations New Order (NEW) --------------------------------
/**
 * Internal-only alert sent to the operations team for every new order
 * (placed) and confirmed payment. Recipient: process.env.OPERATIONS_EMAIL.
 */
export const sendOperationsNewOrderEmail = async (
  order: OrderShape,
  stage: 'placed' | 'confirmed' = 'placed'
): Promise<SendResult> => {
  // Support multiple ops recipients via comma-separated OPERATIONS_EMAIL.
  // e.g. OPERATIONS_EMAIL="hello@cupcakedesires.com,nv7431136@gmail.com"
  const opsRaw = process.env.OPERATIONS_EMAIL || ''
  const opsList = opsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (opsList.length === 0) {
    return { success: false, error: 'OPERATIONS_EMAIL not configured' }
  }
  const to: string | string[] = opsList.length === 1 ? opsList[0] : opsList
  const orderId = order.orderId || ''
  const total = Number(order.totalAmount || 0)
  const subtotal = Number(order.subtotal ?? total)

  const res = await sendEmail({
    to,
    subject:
      stage === 'confirmed'
        ? `[OPS] Paid order ${orderId} — ${pickName(order)}`
        : `[OPS] New order ${orderId} — ${pickName(order)}`,
    templateId: 'OperationsNewOrderEmail',
    refId: orderId,
    refType: 'order',
    skipSuppressionCheck: true,
    tags: [
      { name: 'template', value: 'OperationsNewOrderEmail' },
      { name: 'stage', value: stage },
    ],
    idempotencyKey: orderId ? `ops-new-order-${orderId}-${stage}` : undefined,
    react: React.createElement(OperationsNewOrderEmail, {
      orderId,
      orderDate: formatOrderDate(order.createdAt),
      stage,
      customer: {
        name: pickName(order),
        email: pickEmail(order) || '—',
        phone: order.customer?.phone || order.deliveryAddress?.phone,
      },
      items: mapItems(order),
      subtotal,
      discount: Number(order.discount || 0),
      shipping: typeof order.shipping === 'number' ? order.shipping : undefined,
      tax: Number(order.tax || 0),
      total,
      paymentMethod: order.paymentDetails?.paymentMethod || order.paymentMethod,
      paymentStatus: order.paymentDetails?.paymentStatus || order.paymentDetails?.status,
      shippingAddress: mapShippingAddress(order),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-AU', {
            timeZone: 'Australia/Melbourne',
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : undefined,
      deliveryWindow: order.deliverySlot || undefined,
      deliveryInstructions:
        order.notes?.find((n) => n.author === 'customer' && !n.isInternal)?.content || undefined,
      adminUrl: `${ADMIN_BASE}/orders/${orderId}`,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

// ---------- Cart recovery (React Email) ------------------------------------
export interface CartRecoveryRecipient {
  email: string
  name?: string
}

export interface CartRecoveryItem {
  name: string
  imageUrl?: string
  variantLabel?: string
  quantity: number
  unitPrice: number
}

export interface CartRecoveryPayload {
  recipient: CartRecoveryRecipient
  items: CartRecoveryItem[]
  cartTotal: number
  currency?: string
  resumeUrl: string
  cartId: string
}

export const sendAbandonedCartH0Email = async (payload: CartRecoveryPayload): Promise<SendResult> => {
  const res = await sendEmail({
    to: payload.recipient.email,
    subject: `${payload.recipient.name || 'Hi'}, you left items in your cart`,
    templateId: 'AbandonedCartH0Email',
    refId: payload.cartId,
    refType: 'cart',
    idempotencyKey: `cart-recovery-${payload.cartId}-h0`,
    tags: [
      { name: 'template', value: 'AbandonedCartH0Email' },
      { name: 'attempt', value: '1' },
    ],
    react: React.createElement(AbandonedCartH0Email, {
      recipientEmail: payload.recipient.email,
      customerName: payload.recipient.name,
      items: payload.items,
      cartTotal: payload.cartTotal,
      currency: payload.currency,
      resumeUrl: payload.resumeUrl,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

export const sendAbandonedCartH24Email = async (payload: CartRecoveryPayload): Promise<SendResult> => {
  const res = await sendEmail({
    to: payload.recipient.email,
    subject: `Still interested? Your cart is waiting`,
    templateId: 'AbandonedCartH24Email',
    refId: payload.cartId,
    refType: 'cart',
    idempotencyKey: `cart-recovery-${payload.cartId}-h24`,
    tags: [
      { name: 'template', value: 'AbandonedCartH24Email' },
      { name: 'attempt', value: '2' },
    ],
    react: React.createElement(AbandonedCartH24Email, {
      recipientEmail: payload.recipient.email,
      customerName: payload.recipient.name,
      items: payload.items,
      cartTotal: payload.cartTotal,
      currency: payload.currency,
      resumeUrl: payload.resumeUrl,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}

export const sendAbandonedCartH48Email = async (
  payload: CartRecoveryPayload & {
    promoCode: string
    discountPct: number
    expiresInDays?: number
  }
): Promise<SendResult> => {
  const res = await sendEmail({
    to: payload.recipient.email,
    subject: `Last chance: ${payload.discountPct}% off your cart`,
    templateId: 'AbandonedCartH48Email',
    refId: payload.cartId,
    refType: 'cart',
    idempotencyKey: `cart-recovery-${payload.cartId}-h48`,
    tags: [
      { name: 'template', value: 'AbandonedCartH48Email' },
      { name: 'attempt', value: '3' },
    ],
    react: React.createElement(AbandonedCartH48Email, {
      recipientEmail: payload.recipient.email,
      customerName: payload.recipient.name,
      items: payload.items,
      cartTotal: payload.cartTotal,
      currency: payload.currency,
      resumeUrl: payload.resumeUrl,
      promoCode: payload.promoCode,
      discountPct: payload.discountPct,
      expiresInDays: payload.expiresInDays,
    }),
  })
  return res.success ? { success: true } : { success: false, error: res.error }
}
