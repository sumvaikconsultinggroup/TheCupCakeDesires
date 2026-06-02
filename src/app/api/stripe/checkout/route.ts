/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for the given cart and returns the redirect URL.
 * Caller is expected to push the customer to `data.url` on success.
 *
 * Body shape:
 *   {
 *     orderId: string                    // mongo Order._id (or our internal orderId)
 *     items: Array<{
 *       name: string
 *       description?: string
 *       imageUrl?: string
 *       price: number   // dollars
 *       quantity: number
 *     }>
 *     customerEmail: string
 *     shippingAmount?: number            // dollars (free shipping = 0)
 *     metadata?: Record<string, string>  // forwarded onto Stripe metadata
 *   }
 */

import { isStripeConfigured, requireStripe, toStripeAmount } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const lineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
})

const bodySchema = z.object({
  orderId: z.string().min(1),
  items: z.array(lineItemSchema).min(1),
  customerEmail: z.string().email(),
  shippingAmount: z.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

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

  const stripe = requireStripe()
  const { orderId, items, customerEmail, shippingAmount = 0, metadata = {} } = parsed.data

  const origin =
    request.headers.get('origin') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      currency: 'aud',
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: 'aud',
            unit_amount: toStripeAmount(item.price),
            product_data: {
              name: item.name,
              ...(item.description && { description: item.description.slice(0, 500) }),
              ...(item.imageUrl && item.imageUrl.startsWith('http') && { images: [item.imageUrl] }),
            },
          },
        })),
        ...(shippingAmount > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: 'aud',
                  unit_amount: toStripeAmount(shippingAmount),
                  product_data: {
                    name: 'Delivery',
                    description: 'Courier delivery across Melbourne metro',
                  },
                },
              },
            ]
          : []),
      ],
      success_url: `${origin}/order-successful?session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(
        orderId
      )}`,
      cancel_url: `${origin}/checkout?cancelled=1&orderId=${encodeURIComponent(orderId)}`,
      metadata: {
        orderId,
        ...metadata,
      },
      payment_intent_data: {
        metadata: {
          orderId,
          ...metadata,
        },
        // Statement descriptor — what appears on the customer's card statement.
        statement_descriptor_suffix: 'CUPCAKES',
      },
      // Stripe Checkout supports automatic tax + shipping rules but we keep
      // it simple here and pre-compute totals on our side.
      allow_promotion_codes: true,
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
