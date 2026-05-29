import CartNotification from '@/models/CartNotification'
import { currentUser } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { action, item } = await req.json()
    const userId = clerkUser.id

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    // Fetch the cart to update and recalculate subtotal
    const cart = await CartNotification.findOne({ userId })

    if (cart) {
      if (action === 'remove') {
        cart.products = cart.products.filter(
          (p) => p.productId !== item.productId
        )
      }

      if (action === 'updateQty') {
        const product = cart.products.find(
          (p) => p.productId === item.productId
        )
        if (product) {
          product.quantity = item.quantity
        }
      }

      if (cart.products.length === 0) {
        await CartNotification.deleteOne({ userId })
      } else {
        // Recalculate subtotal
        cart.subtotal = cart.products.reduce(
          (acc, p) => acc + p.price * p.quantity,
          0
        )
        await cart.save()
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cart mutation failed:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
