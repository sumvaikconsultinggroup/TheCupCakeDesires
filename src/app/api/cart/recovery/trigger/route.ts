import { NextRequest, NextResponse } from 'next/server'

import {
  sendAbandonedCartH0Email,
  sendAbandonedCartH24Email,
  sendAbandonedCartH48Email,
  type CartRecoveryItem,
} from '@/lib/email-service'
import connectDb from '@/lib/mongodb'
import Cart, { ICart } from '@/models/Cart'

export const runtime = 'nodejs'

const STORE_URL = process.env.STORE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cupcakedesires.com'
const CART_RECOVERY_PROMO = process.env.CART_RECOVERY_PROMO || 'CARTSAVE10'
const CART_RECOVERY_DISCOUNT_PCT = Number(process.env.CART_RECOVERY_DISCOUNT_PCT || 10)
const CART_RECOVERY_PROMO_EXPIRES_DAYS = Number(process.env.CART_RECOVERY_PROMO_EXPIRES_DAYS || 14)

type TriggerType = 'immediate' | '24hour' | '48hour'

interface TriggerBody {
  triggerType?: TriggerType
}

function mapCartItems(cart: ICart): CartRecoveryItem[] {
  return cart.items.map((it) => {
    const variantParts = [it.variant?.option1Value, it.variant?.option2Value, it.variant?.option3Value].filter(
      Boolean
    ) as string[]
    return {
      name: it.productName,
      imageUrl: it.imageUrl,
      variantLabel: variantParts.length ? variantParts.join(' · ') : undefined,
      quantity: it.quantity,
      unitPrice: it.price,
    }
  })
}

/**
 * POST /api/cart/recovery/trigger
 *
 * Sends abandoned-cart recovery emails based on `triggerType`. Called by
 * three cron endpoints (`trigger-immediate`, `trigger-24hour`,
 * `trigger-48hour`) which forward the appropriate `triggerType` here.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDb()

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as TriggerBody
    const triggerType = body.triggerType
    if (!triggerType || !['immediate', '24hour', '48hour'].includes(triggerType)) {
      return NextResponse.json({ success: false, message: 'Invalid trigger type' }, { status: 400 })
    }

    const now = new Date()
    let timeThreshold: Date
    let attemptNumber: 1 | 2 | 3

    switch (triggerType) {
      case 'immediate':
        timeThreshold = new Date(now.getTime() - 45 * 60 * 1000)
        attemptNumber = 1
        break
      case '24hour':
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        attemptNumber = 2
        break
      case '48hour':
        timeThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000)
        attemptNumber = 3
        break
    }

    const cartsToRecover = await Cart.find({
      status: 'abandoned',
      abandonedAt: { $lte: timeThreshold },
      email: { $exists: true, $nin: [null, ''] },
      'recoveryAttempts.attemptNumber': { $ne: attemptNumber },
    }).limit(100)

    let sentCount = 0
    const errors: Array<{ cartId: string; error: string }> = []

    for (const cart of cartsToRecover) {
      try {
        const resumeUrl = `${STORE_URL.replace(/\/$/, '')}/cart?resume=${cart.cartId}`
        const items = mapCartItems(cart)
        const recipient = {
          email: cart.email!,
          name: cart.userName || undefined,
        }

        let result: { success: boolean; error?: string }
        if (attemptNumber === 1) {
          result = await sendAbandonedCartH0Email({
            recipient,
            items,
            cartTotal: cart.totalValue,
            currency: 'AUD',
            resumeUrl,
            cartId: cart.cartId,
          })
        } else if (attemptNumber === 2) {
          result = await sendAbandonedCartH24Email({
            recipient,
            items,
            cartTotal: cart.totalValue,
            currency: 'AUD',
            resumeUrl,
            cartId: cart.cartId,
          })
        } else {
          result = await sendAbandonedCartH48Email({
            recipient,
            items,
            cartTotal: cart.totalValue,
            currency: 'AUD',
            resumeUrl,
            cartId: cart.cartId,
            promoCode: CART_RECOVERY_PROMO,
            discountPct: CART_RECOVERY_DISCOUNT_PCT,
            expiresInDays: CART_RECOVERY_PROMO_EXPIRES_DAYS,
          })
        }

        if (result.success) {
          cart.recoveryAttempts.push({
            attemptNumber,
            type: 'email',
            sentAt: new Date(),
            opened: false,
            clicked: false,
          })
          await cart.save()
          sentCount++
        } else {
          errors.push({
            cartId: cart.cartId,
            error: result.error || 'unknown',
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Error sending recovery for cart ${cart.cartId}:`, message)
        errors.push({ cartId: cart.cartId, error: message })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        triggerType,
        attemptNumber,
        sentCount,
        totalFound: cartsToRecover.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Sent ${sentCount} recovery emails`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error triggering recovery:', message)
    return NextResponse.json({ success: false, message: 'Failed to trigger recovery', error: message }, { status: 500 })
  }
}
