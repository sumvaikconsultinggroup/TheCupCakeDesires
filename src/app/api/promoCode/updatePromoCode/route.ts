import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    await connectDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Promo code ID is required' }, { status: 400 })
    }

    // Check if code is being updated and if it already exists
    if (body.code) {
      const existingCode = await PromoCode.findOne({ 
        code: body.code.toUpperCase(),
        _id: { $ne: id }
      })
      if (existingCode) {
        return NextResponse.json({ success: false, message: 'Promo code with this code already exists' }, { status: 409 })
      }
    }

    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      id,
      { ...body, ...(body.code && { code: body.code.toUpperCase() }) },
      { new: true, runValidators: true }
    )

    if (!updatedPromoCode) {
      return NextResponse.json({ success: false, message: 'Promo code not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedPromoCode }, { status: 200 })
  } catch (error) {
    console.error('❌ Error updating promo code:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
