import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request, { params }) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    await connectDb()

    const query = { userId: userId }
    const orders = await Order.find(query).sort({ createdAt: -1 })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 })
  }
}