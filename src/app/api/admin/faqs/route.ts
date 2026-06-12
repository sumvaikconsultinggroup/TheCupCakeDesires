import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import FAQ from '@/models/FAQ'
import { verifyAdminRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function serializeFaq(doc: Record<string, unknown>) {
  const category = doc.category as Record<string, unknown> | string | undefined
  return {
    _id: String(doc._id),
    question: doc.question,
    answer: doc.answer,
    page: doc.page ?? 'homepage',
    pageRef: doc.pageRef ?? '',
    order: doc.order ?? 0,
    isActive: doc.isActive ?? true,
    category:
      category && typeof category === 'object'
        ? { _id: String(category._id), name: String(category.name) }
        : category
          ? String(category)
          : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function GET() {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const faqs = await FAQ.find().populate('category').sort({ order: 1, createdAt: -1 }).lean()
    return NextResponse.json({
      success: true,
      data: faqs.map((f) => serializeFaq(f as Record<string, unknown>)),
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
    const payload = { ...body }
    if (!payload.category) delete payload.category
    const faq = await FAQ.create(payload)
    const populated = await FAQ.findById(faq._id).populate('category').lean()
    return NextResponse.json({
      success: true,
      data: serializeFaq(populated as Record<string, unknown>),
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
    if (!updateData.category) delete updateData.category
    const faq = await FAQ.findByIdAndUpdate(_id, updateData, { new: true }).populate('category').lean()
    if (!faq) {
      return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      data: serializeFaq(faq as Record<string, unknown>),
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
    await FAQ.findByIdAndDelete(id)
    return NextResponse.json({ success: true, message: 'FAQ deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
