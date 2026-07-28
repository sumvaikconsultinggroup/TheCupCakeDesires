import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import {
  leadDaysForItems,
  leadTimeLabel,
  leadTimeReason,
  minDeliveryDateISO,
  isAfterCutoff,
  ORDER_CUTOFF_HOUR,
  MAX_LEAD_DAYS,
} from '@/utils/deliveryArea'
import { NextResponse } from 'next/server'

/**
 * Authoritative delivery lead time for a basket.
 *
 * The checkout could work this out from the cart alone, but categories are only
 * stamped on a cart line at add-to-cart time — a basket saved before that shipped
 * has none, and a tampered localStorage cart can claim anything. Resolving the
 * categories from the database here means the date the customer is offered is the
 * same one create-order will accept, so nobody picks a date and is rejected later.
 *
 * Read-only and cheap: it returns a lead time, never touches an order.
 */
export async function POST(req) {
  try {
    const { items } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      // No basket to reason about — quote the longest tier rather than a
      // turnaround we might not be able to meet.
      return NextResponse.json({
        success: true,
        leadDays: MAX_LEAD_DAYS,
        minDate: minDeliveryDateISO(null),
        label: leadTimeLabel(MAX_LEAD_DAYS),
        reason: leadTimeReason(MAX_LEAD_DAYS),
        cutoffHour: ORDER_CUTOFF_HOUR,
        afterCutoff: isAfterCutoff(),
      })
    }

    await connectDb()

    // Only ever look up ids that look like ids; ignore the client's own category
    // claims entirely — the database is the source of truth for the tier.
    const ids = items
      .map((i) => i?.productId)
      .filter((id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))

    const products = ids.length
      ? await Product.find({ _id: { $in: ids }, isDeleted: false }, { productCategory: 1 }).lean()
      : []

    const categoryById = new Map(products.map((p) => [String(p._id), p.productCategory]))

    // A line whose product we cannot resolve keeps an undefined category, which
    // tierForCategory treats as the longest tier — the safe direction.
    const leadItems = items.map((i) => ({
      category: categoryById.get(String(i?.productId)),
      quantity: i?.quantity,
    }))

    const leadDays = leadDaysForItems(leadItems)

    return NextResponse.json({
      success: true,
      leadDays,
      minDate: minDeliveryDateISO(leadItems),
      label: leadTimeLabel(leadDays),
      reason: leadTimeReason(leadDays),
      cutoffHour: ORDER_CUTOFF_HOUR,
      afterCutoff: isAfterCutoff(),
    })
  } catch (error) {
    console.error('Lead-time lookup failed:', error)
    // Fail safe: quote the longest tier so we never promise a date we cannot bake.
    return NextResponse.json(
      {
        success: false,
        leadDays: MAX_LEAD_DAYS,
        minDate: minDeliveryDateISO(null),
        label: leadTimeLabel(MAX_LEAD_DAYS),
        reason: leadTimeReason(MAX_LEAD_DAYS),
        cutoffHour: ORDER_CUTOFF_HOUR,
        afterCutoff: isAfterCutoff(),
      },
      { status: 200 }
    )
  }
}
