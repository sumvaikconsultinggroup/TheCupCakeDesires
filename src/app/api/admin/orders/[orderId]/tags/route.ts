export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

type RouteContext = { params: Promise<{ orderId: string }> }

async function resolveOrder(rawId: string) {
  let order = await Order.findOne({ orderId: rawId })
  if (!order) {
    order = await Order.findById(rawId).catch(() => null)
  }
  return order
}

// ---------------------------------------------------------------------------
// GET /api/admin/orders/[orderId]/tags
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    await connectDb()

    const order = await resolveOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const tags: string[] = Array.isArray(order.tags) ? order.tags : []
    return NextResponse.json({ tags })
  } catch (err) {
    console.error('[tags:GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/[orderId]/tags
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    const body: { tag?: string } = await request.json()

    if (!body.tag || typeof body.tag !== 'string' || body.tag.trim() === '') {
      return NextResponse.json(
        { error: 'tag is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const normalizedTag = body.tag.trim()

    await connectDb()

    const order = await resolveOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!Array.isArray(order.tags)) {
      order.tags = []
    }

    if (!order.tags.includes(normalizedTag)) {
      order.tags.push(normalizedTag)
      await order.save()
    }

    const tags: string[] = order.tags
    return NextResponse.json({ tags }, { status: 201 })
  } catch (err) {
    console.error('[tags:POST] Error:', err)
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/orders/[orderId]/tags
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    const body: { tag?: string } = await request.json()

    if (!body.tag || typeof body.tag !== 'string') {
      return NextResponse.json(
        { error: 'tag is required' },
        { status: 400 }
      )
    }

    await connectDb()

    const order = await resolveOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!Array.isArray(order.tags)) {
      order.tags = []
    }

    order.tags = order.tags.filter((t: string) => t !== body.tag)
    await order.save()

    const tags: string[] = order.tags
    return NextResponse.json({ tags })
  } catch (err) {
    console.error('[tags:DELETE] Error:', err)
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
  }
}
