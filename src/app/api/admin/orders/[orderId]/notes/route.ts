export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoteDocument {
  _id: unknown
  content: string
  author: string
  isInternal: boolean
  createdAt: Date
}

interface NoteResponse {
  _id: string
  text: string
  isInternal: boolean
  createdAt: Date
  createdBy: string
}

type RouteContext = { params: Promise<{ orderId: string }> }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNote(note: NoteDocument): NoteResponse {
  return {
    _id: String(note._id),
    text: note.content,
    isInternal: Boolean(note.isInternal),
    createdAt: note.createdAt,
    createdBy: note.author,
  }
}

async function resolveOrder(rawId: string) {
  let order = await Order.findOne({ orderId: rawId })
  if (!order) {
    order = await Order.findById(rawId).catch(() => null)
  }
  return order
}

// ---------------------------------------------------------------------------
// GET /api/admin/orders/[orderId]/notes
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

    const notes: NoteResponse[] = (order.notes ?? []).map(formatNote)
    return NextResponse.json({ notes })
  } catch (err) {
    console.error('[notes:GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/orders/[orderId]/notes
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    const body: { text?: string; isInternal?: boolean } = await request.json()

    if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
      return NextResponse.json(
        { error: 'text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    await connectDb()

    const order = await resolveOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!Array.isArray(order.notes)) {
      order.notes = []
    }

    const newNote = {
      content: body.text.trim(),
      author: auth.user.email,
      isInternal: body.isInternal !== false, // default to internal
      createdAt: new Date(),
    }

    order.notes.push(newNote)
    await order.save()

    // Return the note that was just added (last element)
    const savedNote = order.notes[order.notes.length - 1] as NoteDocument
    return NextResponse.json({ note: formatNote(savedNote) }, { status: 201 })
  } catch (err) {
    console.error('[notes:POST] Error:', err)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/orders/[orderId]/notes
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    const body: { noteId?: string } = await request.json()

    if (!body.noteId || typeof body.noteId !== 'string') {
      return NextResponse.json(
        { error: 'noteId is required' },
        { status: 400 }
      )
    }

    await connectDb()

    const order = await resolveOrder(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!Array.isArray(order.notes)) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const existingIndex: number = order.notes.findIndex(
      (n: NoteDocument) => String(n._id) === body.noteId
    )

    if (existingIndex === -1) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    order.notes.splice(existingIndex, 1)
    await order.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notes:DELETE] Error:', err)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
