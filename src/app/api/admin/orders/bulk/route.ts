export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BulkAction =
  | 'mark_confirmed'
  | 'mark_cancelled'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_to'

interface BulkRequestBody {
  orderIds: string[]
  action: BulkAction
  payload?: {
    tag?: string
    userId?: string
  }
}

interface BulkErrorEntry {
  orderId: string
  reason: string
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/bulk
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const body: BulkRequestBody = await request.json()
    const { orderIds, action, payload } = body

    // Input validation
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const validActions: BulkAction[] = [
      'mark_confirmed',
      'mark_cancelled',
      'add_tag',
      'remove_tag',
      'assign_to',
    ]
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    if ((action === 'add_tag' || action === 'remove_tag') && !payload?.tag) {
      return NextResponse.json(
        { error: 'payload.tag is required for add_tag / remove_tag actions' },
        { status: 400 }
      )
    }

    if (action === 'assign_to' && !payload?.userId) {
      return NextResponse.json(
        { error: 'payload.userId is required for assign_to action' },
        { status: 400 }
      )
    }

    await connectDb()

    let processed = 0
    let failed = 0
    const errors: BulkErrorEntry[] = []

    // Process each order individually so we can report per-order failures
    for (const rawId of orderIds) {
      try {
        // Resolve by readable orderId first, then fall back to MongoDB _id
        let order = await Order.findOne({ orderId: rawId })
        if (!order) {
          order = await Order.findById(rawId).catch(() => null)
        }

        if (!order) {
          failed++
          errors.push({ orderId: rawId, reason: 'Order not found' })
          continue
        }

        switch (action) {
          case 'mark_confirmed': {
            const allowedStatuses = ['paid', 'order_created']
            if (!allowedStatuses.includes(order.status)) {
              failed++
              errors.push({
                orderId: rawId,
                reason: `Cannot confirm order with status '${order.status}'`,
              })
              continue
            }
            order.status = 'confirmed'
            break
          }

          case 'mark_cancelled': {
            // Orders that have been shipped cannot be cancelled
            const blockedStatuses = [
              'shipped',
              'delivered',
              'cancelled',
              'refunded',
              'return_initiated',
              'return_completed',
            ]
            if (blockedStatuses.includes(order.status)) {
              failed++
              errors.push({
                orderId: rawId,
                reason: `Cannot cancel order with status '${order.status}'`,
              })
              continue
            }
            order.status = 'cancelled'
            break
          }

          case 'add_tag': {
            if (!Array.isArray(order.tags)) {
              order.tags = []
            }
            const tagToAdd = payload!.tag as string
            if (!order.tags.includes(tagToAdd)) {
              order.tags.push(tagToAdd)
            }
            break
          }

          case 'remove_tag': {
            if (!Array.isArray(order.tags)) {
              order.tags = []
            }
            order.tags = order.tags.filter((t: string) => t !== payload!.tag)
            break
          }

          case 'assign_to': {
            order.assignedTo = payload!.userId
            break
          }
        }

        await order.save()
        processed++
      } catch (err) {
        failed++
        errors.push({
          orderId: rawId,
          reason: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      errors,
    })
  } catch (err) {
    console.error('[bulk] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    )
  }
}
