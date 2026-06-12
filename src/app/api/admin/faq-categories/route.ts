import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import FAQCategory from '@/models/FAQCategory'
import { verifyAdminRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function serializeCategory(doc: Record<string, unknown>) {
  return {
    _id: String(doc._id),
    name: doc.name,
    order: doc.order ?? 0,
    isActive: doc.isActive ?? true,
  }
}

export async function GET() {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const categories = await FAQCategory.find().sort({ order: 1, name: 1 }).lean()
    return NextResponse.json({
      success: true,
      data: categories.map((c) => serializeCategory(c as Record<string, unknown>)),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const body = await request.json()
    const category = await FAQCategory.create(body)
    return NextResponse.json({
      success: true,
      data: serializeCategory(category.toObject() as Record<string, unknown>),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const body = await request.json()
    const { _id, ...updateData } = body
    const category = await FAQCategory.findByIdAndUpdate(_id, updateData, { new: true }).lean()
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: serializeCategory(category as Record<string, unknown>),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }
    await FAQCategory.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
