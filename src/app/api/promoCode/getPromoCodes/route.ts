import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // If ID is provided, return single promo code
    if (id) {
      const promoCode = await PromoCode.findById(id)
      if (!promoCode) {
        return NextResponse.json({ success: false, message: 'Promo code not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: promoCode }, { status: 200 })
    }
    
    // Otherwise, return all promo codes
    const promoCodes = await PromoCode.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: promoCodes }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching promo codes:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
