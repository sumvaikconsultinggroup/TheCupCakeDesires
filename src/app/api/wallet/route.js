import User from '@/models/User'
import { connectToDB } from '@/utils/db'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find user by Mongo _id or clerkId
    const query = mongoose.Types.ObjectId.isValid(userId) ? { _id: userId } : { clerkId: userId }

    const user = await User.findOne(query).select('wallet')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user.wallet)
  } catch (error) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectToDB()
    const body = await request.json()

    const { userId, type, points, description } = body

    if (!userId || !points || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    const query = mongoose.Types.ObjectId.isValid(userId) ? { _id: userId } : { clerkId: userId }

    const user = await User.findOne(query)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Initialize wallet if missing
    if (!user.wallet) {
      user.wallet = {
        points: 0,
        transactions: [],
      }
    }

    const currentPoints = user.wallet.points
    let newBalance = currentPoints

    if (type === 'credit') {
      newBalance += Number(points)
    } else {
      if (currentPoints < points) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
      }
      newBalance -= Number(points)
    }

    // Update wallet
    user.wallet.points = newBalance
    user.wallet.transactions.push({
      type,
      points: Number(points),
      description,
      balanceAfter: newBalance,
    })

    await user.save()

    return NextResponse.json({
      success: true,
      wallet: user.wallet,
    })
  } catch (error) {
    console.error('Error updating wallet:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
