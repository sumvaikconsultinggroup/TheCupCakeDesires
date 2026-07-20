/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for an already-persisted Order and returns
 * the redirect URL. The caller pushes the customer to `data.url` on success.
 *
 * SECURITY: the amount charged is derived entirely from the server-side Order
 * document (never from client-supplied prices), so the customer is always billed
 * exactly `order.totalAmount`. The app-side discount is applied as a one-off
 * Stripe coupon so discounted orders aren't over-charged.
 *
 * Body shape:
 *   {
 *     orderId: string                   // Mongo Order._id (or our internal orderId)
 *     metadata?: Record<string, string> // forwarded onto Stripe metadata
 *   }
 */

import connectDb from '@/lib/mongodb'
import { isStripeConfigured, requireStripe, toStripeAmount } from '@/lib/stripe'
import Order from '@/models/Order'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  orderId: z.string().min(1),
  metadata: z.record(z.string(), z.string()).optional(),
})

const round2 = (n: number) => Math.round(n * 100) / 100

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Stripe is not configured yet. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local.',
      },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message || 'Invalid request',
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  const { orderId, metadata = {} } = parsed.data
  const stripe = requireStripe()

  await connectDb()

  // Load the authoritative order. The client passes the Mongo _id, but fall back
  // to our human-facing orderId just in case.
  let order: any = null
  try {
    order = await Order.findById(orderId)
  } catch {
    // invalid ObjectId — ignore and try the orderId field below
  }
  if (!order) {
    order = await Order.findOne({ orderId })
  }
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
  }
  if (order.paymentDetails?.paymentStatus === 'paid') {
    return NextResponse.json(
      { success: false, message: 'This order has already been paid.' },
      { status: 409 }
    )
  }

  const orderIdStr = String(order._id)
  const customerEmail: string | undefined = order.customer?.email || order.user?.email || undefined

  // Build line items from the SERVER order — never from client-supplied prices.
  const items: any[] = Array.isArray(order.items) ? order.items : []
  if (items.length === 0) {
    return NextResponse.json(
      { success: false, message: 'This order has no items to pay for.' },
      { status: 400 }
    )
  }

  const lineItems: any[] = items.map((it) => {
    const image = typeof it.imageUrl === 'string' && it.imageUrl.startsWith('http') ? it.imageUrl : undefined
    return {
      quantity: it.quantity,
      price_data: {
        currency: 'aud',
        unit_amount: toStripeAmount(it.price || 0),
        product_data: {
          name: it.name || 'Item',
          ...(image && { images: [image] }),
        },
      },
    }
  })

  const itemsTotal = round2(items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0))
  const shipping = round2(order.shipping || 0)
  const discount = round2(order.discount || 0)

  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: toStripeAmount(shipping),
        product_data: {
          name: 'Delivery',
          description: 'Self-delivery across Greater Melbourne',
        },
      },
    })
  }

  // Safety reconciliation: whatever residual is needed to make the charged total
  // exactly equal order.totalAmount (covers any legacy tax-in-total orders or
  // rounding drift). Positive residual → an adjustment line.
  const residual = round2((order.totalAmount || 0) - (itemsTotal + shipping - discount))
  if (residual > 0.01) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'aud',
        unit_amount: toStripeAmount(residual),
        product_data: {
          name: 'Taxes & fees',
          description: 'Applied to the order total.',
        },
      },
    })
  }

  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  try {
    // Apply the app-side discount as a one-off coupon so the customer isn't
    // over-charged. We intentionally do NOT enable allow_promotion_codes here —
    // the app already validated its own promo, and Stripe forbids combining a
    // coupon with promotion codes on the same session.
    let discounts: { coupon: string }[] | undefined
    if (discount > 0.01) {
      const coupon = await stripe.coupons.create({
        amount_off: toStripeAmount(discount),
        currency: 'aud',
        duration: 'once',
        name: order.discountCode || order.couponCode || 'Discount',
      })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      ...(customerEmail && { customer_email: customerEmail }),
      currency: 'aud',
      line_items: lineItems,
      ...(discounts && { discounts }),
      success_url: `${origin}/order-successful?session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(
        orderIdStr
      )}`,
      cancel_url: `${origin}/checkout?cancelled=1&orderId=${encodeURIComponent(orderIdStr)}`,
      metadata: {
        orderId: orderIdStr,
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          orderId: orderIdStr,
          ...metadata,
        },
        // Statement descriptor — what appears on the customer's card statement.
        statement_descriptor_suffix: 'Cupcakes',
      },
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Could not create checkout session',
      },
      { status: 500 }
    )
  }
}
