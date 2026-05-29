// src/app/api/wishlists/route.js

import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectToDB } from '@/utils/db'
import User from '../../../models/User'

export async function GET() {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const user = await User.findOne({ clerkId: clerkUser.id })

    if (!user) {
      return NextResponse.json({ wishlist: [] })
    }

    const wishlist = user.wishlist || []

    return NextResponse.json({ wishlist })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const { productId, comboId, variant, productName, itemType = 'product' } = await request.json()

    if (!productId && !comboId) {
      return NextResponse.json({ error: 'Product ID or Combo ID is required' }, { status: 400 })
    }

    // Create wishlist item
    const wishlistItem = {
      productName,
      itemType,
      ...(productId && { productId }),
      ...(comboId && { comboId }),
      ...(variant && { variant }),
    }

    // Check if item already exists
    const user = await User.findOne({ clerkId: clerkUser.id })
    
    if (user) {
      const existingItem = user.wishlist.find((item) => {
        if (itemType === 'combo') {
          return item.comboId === comboId
        }
        return item.productId === productId
      })

      if (existingItem) {
        return NextResponse.json({ 
          success: true,
          message: 'Item already in wishlist',
          wishlist: user.wishlist 
        })
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      {
        $addToSet: { wishlist: wishlistItem },
        $setOnInsert: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          billing_fullname: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        },
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ 
      success: true,
      message: `${itemType === 'combo' ? 'Combo' : 'Product'} added to wishlist`,
      wishlist: updatedUser.wishlist 
    })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const { productId, comboId, itemType = 'product' } = await request.json()

    if (!productId && !comboId) {
      return NextResponse.json({ error: 'Product ID or Combo ID is required' }, { status: 400 })
    }

    // Build the pull query based on item type
    const pullQuery = itemType === 'combo' 
      ? { comboId: comboId }
      : { productId: productId }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      { $pull: { wishlist: pullQuery } },
      { new: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: `${itemType === 'combo' ? 'Combo' : 'Product'} removed from wishlist`,
      wishlist: updatedUser.wishlist || [] 
    })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 })
  }
}