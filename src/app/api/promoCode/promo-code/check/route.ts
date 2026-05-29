
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
      return NextResponse.json({ success: false, message: 'Promo code and cart items are required 1' }, { status: 400 })
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() })

    if (!promoCode || !promoCode.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid or Promo code has expired' }, { status: 404 })
    }
    
    if (promoCode.startsAt && new Date() < promoCode.startsAt) {
      return NextResponse.json({ success: false, message: 'This promo code is not active yet 2' }, { status: 400 })
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
      return NextResponse.json({ success: false, message: `A minimum order of ${promoCode.minOrderAmount} is required to use this code.` }, { status: 400 })
    }

    // Determine which items in the cart are eligible for the discount
    let applicableItems: CartItem[] = []

    if (promoCode.appliesTo === 'all') {
      applicableItems = [...cartItems] 
    } else if (promoCode.appliesTo === 'products') {
      const applicableProductIds = new Set(promoCode.productIds)
      applicableItems = cartItems.filter(item => applicableProductIds.has(item.productId))
    } else if (promoCode.appliesTo === 'categories') {
      const productIds = cartItems.map((item) => item.productId)
      const products = await Product.find({ _id: { $in: productIds } }).select('productCategory')

      const applicableCategoryNames = new Set(promoCode.categoryNames)
      const applicableProductIdsFromCategories = new Set(
        products
          .filter(p => p.productCategory && applicableCategoryNames.has(p.productCategory))
          .map(p => p._id.toString())
      )

      applicableItems = cartItems.filter(item => applicableProductIdsFromCategories.has(item.productId))
    }

    if (applicableItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Promo code not applicable to items in cart 3' }, { status: 400 })
    }

    const responsePromoCode: any = {
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      minOrderAmount: promoCode.minOrderAmount,
      appliesTo: promoCode.appliesTo,
    }

    // If all checks pass, the code is valid.
    return NextResponse.json(
      {
        success: true,
        message: 'Promo code is valid',
        promoCode: {
          ...responsePromoCode,
          ...(promoCode.appliesTo === 'products' && { productIds: promoCode.productIds }),
          ...(promoCode.appliesTo === 'categories' && { categoryNames: promoCode.categoryNames }),
        }
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