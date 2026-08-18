import User from '@/models/User'
import { connectToDB } from '@/utils/db'
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    await connectToDB()

    const userInMongo = await User.findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    })

    let userInClerk = false
    try {
      const client = await clerkClient()
      const clerkUsers = await client.users.getUserList({ emailAddress: [email] })
      userInClerk = clerkUsers.data.length > 0
    } catch (error) {
      console.error('Error checking Clerk:', error)
    }

    // A Mongo guest row without a Clerk login is not a real account — checkout
    // can still create one and link it.
    const exists = userInClerk || !!(userInMongo?.clerkId)

    return NextResponse.json({
      exists,
      inMongo: !!userInMongo,
      inClerk: userInClerk,
    })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
  }
}
