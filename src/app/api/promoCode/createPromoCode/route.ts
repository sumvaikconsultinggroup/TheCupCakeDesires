 
import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    await connectDb()
    const body = await request.json()

    const { code, discountType, discountValue, minOrderAmount, usageLimit, startsAt, expiresAt, isActive, appliesTo, productIds, categoryNames } = body

    // Basic validation
    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ success: false, message: 'Missing required fields: code, discountType, discountValue' }, { status: 400 })
    }

    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() })
    if (existingCode) {
      return NextResponse.json({ success: false, message: 'Promo code with this code already exists' }, { status: 409 })
    }

    const newPromoCode = await PromoCode.create({
      code,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      startsAt,
      expiresAt,
      isActive,
      appliesTo,
      productIds,
      categoryNames,
    })

    return NextResponse.json({ success: true, data: newPromoCode }, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating promo code:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}



export async function GET() {
  try {
    await connectDb()
    const promoCodes = await PromoCode.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: promoCodes }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching promo codes:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 })
    }

    const updatedPromoCode = await PromoCode.findByIdAndUpdate(id, body, { new: true, runValidators: true })

    if (!updatedPromoCode) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedPromoCode }, { status: 200 })
  } catch (error) {
    console.error('❌ Error updating promo code:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 })
    }

    const deletedPromoCode = await PromoCode.findByIdAndDelete(id)

    if (!deletedPromoCode) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('❌ Error deleting promo code:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}