import User from '@/models/User'
import { connectToDB } from '@/utils/db'
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    await connectToDB()

    // Check in MongoDB
    const userInMongo = await User.findOne({ email })
    
    // Check in Clerk
    let userInClerk = false
    try {
      const client = await clerkClient()
      const clerkUsers = await client.users.getUserList({ emailAddress: [email] })
      userInClerk = clerkUsers.data.length > 0
    } catch (error) {
      console.error('Error checking Clerk:', error)
      // Continue even if Clerk check fails
    }

    const exists = !!userInMongo || userInClerk

    return NextResponse.json({ exists, inMongo: !!userInMongo, inClerk: userInClerk })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
  }
}
