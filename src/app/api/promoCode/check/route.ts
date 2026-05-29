import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import PromoCode from '@/models/PromoCode'
import { NextResponse } from 'next/server'

interface CartItem {
  productId: string
  quantity: number
  price: number
}

export async function POST(request: Request) {
  try {
    await connectDb()
    const { code, cartItems, userEmail }: { code: string; cartItems: CartItem[]; userEmail?: string } = await request.json()

    if (!code || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Promo code and cart items are required' }, { status: 400 })
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() })

    if (!promoCode || !promoCode.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid or inactive promo code' }, { status: 404 })
    }

    if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
      return NextResponse.json({ success: false, message: 'Promo code has expired' }, { status: 410 })
    }

    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return NextResponse.json({ success: false, message: 'Promo code usage limit reached' }, { status: 410 })
    }

    if (promoCode.allowedEmails && promoCode.allowedEmails.length > 0) {
      if (!userEmail) {
        return NextResponse.json({ success: false, message: 'This coupon is restricted. Please enter your email at checkout to use it.' }, { status: 403 })
      }
      const normalizedEmail = userEmail.toLowerCase().trim()
      if (!promoCode.allowedEmails.includes(normalizedEmail)) {
        return NextResponse.json({ success: false, message: 'This coupon is not valid for your account' }, { status: 403 })
      }
    }

    const totalOrderAmount = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    if (promoCode.minOrderAmount && totalOrderAmount < promoCode.minOrderAmount) {
      return NextResponse.json({ success: false, message: `Minimum order amount of $${promoCode.minOrderAmount} not met` }, { status: 400 })
    }

    let isApplicable = false
    if (promoCode.appliesTo === 'all') {
      isApplicable = true
    } else if (promoCode.appliesTo === 'products') {
      isApplicable = cartItems.some((item) => promoCode.productIds?.includes(item.productId))
    } else if (promoCode.appliesTo === 'categories') {
      const productIds = cartItems.map((item) => item.productId)
      const products = await Product.find({ _id: { $in: productIds } }).select('productCategory')
      const cartCategories = products.map((p) => p.productCategory)
      isApplicable = cartCategories.some((category) => promoCode.categoryNames?.includes(category))
    }

    if (!isApplicable) {
      return NextResponse.json({ success: false, message: 'Promo code not applicable to items in cart' }, { status: 400 })
    }

    // If all checks pass, the code is valid
    return NextResponse.json(
      {
        success: true,
        message: 'Promo code is valid',
        promoCode: {
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error validating promo code:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}