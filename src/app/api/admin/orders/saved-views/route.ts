export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import SavedView from '@/models/SavedView'
import { verifyAdminRequest } from '@/lib/auth'

// ---------------------------------------------------------------------------
// GET /api/admin/orders/saved-views
// List all saved views that belong to the current admin user for 'orders'.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()

    const views = await SavedView.find({
      userId: auth.user.userId,
      resource: 'orders',
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ views })
  } catch (err) {
    console.error('[saved-views:GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch saved views' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/saved-views
// Create a new saved view for the current admin user.
// Body: { name: string, filters: object, isDefault?: boolean }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const body: {
      name?: string
      filters?: Record<string, unknown>
      isDefault?: boolean
    } = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (
      !body.filters ||
      typeof body.filters !== 'object' ||
      Array.isArray(body.filters)
    ) {
      return NextResponse.json(
        { error: 'filters must be a plain object' },
        { status: 400 }
      )
    }

    await connectDb()

    // If this view is being set as default, unset any existing default for the user+resource
    if (body.isDefault) {
      await SavedView.updateMany(
        { userId: auth.user.userId, resource: 'orders', isDefault: true },
        { $set: { isDefault: false } }
      )
    }

    const view = await SavedView.create({
      userId: auth.user.userId,
      name: body.name.trim(),
      resource: 'orders',
      filters: body.filters,
      isDefault: body.isDefault === true,
    })

    return NextResponse.json({ view }, { status: 201 })
  } catch (err) {
    console.error('[saved-views:POST] Error:', err)
    return NextResponse.json({ error: 'Failed to create saved view' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/orders/saved-views
// Delete a saved view. Only the owning user may delete their own views.
// Body: { viewId: string }
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const body: { viewId?: string } = await request.json()

    if (!body.viewId || typeof body.viewId !== 'string') {
      return NextResponse.json(
        { error: 'viewId is required' },
        { status: 400 }
      )
    }

    await connectDb()

    // findOneAndDelete scoped to the authenticated user prevents deleting another user's view
    const deleted = await SavedView.findOneAndDelete({
      _id: body.viewId,
      userId: auth.user.userId,
    })

    if (!deleted) {
      return NextResponse.json(
        { error: 'Saved view not found or not owned by you' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[saved-views:DELETE] Error:', err)
    return NextResponse.json({ error: 'Failed to delete saved view' }, { status: 500 })
  }
}
