import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/orders/cancel
 *
 * Clears an abandoned checkout: cancels the caller's own order that is still
 * awaiting payment, so they can start a fresh one. Deliberately separate from
 * /api/orders/[orderId]/cancel — that cancels a real, placed booking and handles
 * refunds and the confirmation email; this only ever touches an unpaid order and
 * additionally marks the payment attempt failed.
 *
 * SECURITY: identity comes from the Clerk session, never from the request body.
 * This previously trusted a `userEmail` field, which meant anyone who knew a
 * customer's email address and an order id could cancel that customer's order.
 * The body now supplies only the order id, and both the lookup and the update are
 * scoped to the signed-in user, so an id belonging to someone else cannot match.
 */
export async function POST(request) {
  try {
    await connectDb()

    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to cancel this order.' },
        { status: 401 }
      )
    }

    const { orderId } = await request.json().catch(() => ({}))
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 })
    }

    // Reject anything that isn't a Mongo id before it reaches the query.
    if (!/^[a-f\d]{24}$/i.test(String(orderId))) {
      return NextResponse.json(
        { success: false, message: 'Order not found or cannot be cancelled' },
        { status: 404 }
      )
    }

    // Orders carry either the Clerk id or the Mongo user id depending on how the
    // account was created — accept whichever belongs to THIS session.
    const dbUser = await User.findOne({ clerkId: user.id })
    const ownerIds = [user.id, dbUser?._id?.toString()].filter(Boolean)

    // Ownership is enforced inside the update itself, so there is no gap between
    // checking who owns the order and changing it.
    const result = await Order.updateOne(
      {
        _id: orderId,
        userId: { $in: ownerIds },
        status: { $in: ['pending', 'pending_payment'] },
      },
      {
        $set: {
          status: 'cancelled',
          'paymentDetails.paymentStatus': 'failed',
        },
      }
    )

    if (!result.matchedCount) {
      return NextResponse.json(
        { success: false, message: 'Order not found or cannot be cancelled' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json({ success: false, message: 'Failed to cancel order' }, { status: 500 })
  }
}
