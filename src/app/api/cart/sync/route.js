import CartNotification from '@/models/CartNotification'
import { currentUser } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = clerkUser.id
    const body = await req.json()
    const items = body?.items || []

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || ''
    const userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    const phoneNumber = clerkUser.phoneNumbers?.[0]?.phoneNumber || ''

    const products = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl || '',
      handle: item.handle || '',
      variant: item.variant || null   
    }))

    const subtotal = products.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    await CartNotification.findOneAndUpdate(
      { userId },
      {
        userId,
        email,
        userName,
        phoneNumber,
        products,
        subtotal,
        isActive: true,
        isSent: false
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Sync cart error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
