import User from '@/models/User'
import { connectToDB } from '@/utils/db'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const isAdmin = clerkUser.publicMetadata?.role === 'admin'

    const projection = {
      clerkId: 1,
      billing_fullname: 1,
      email: 1,
      billing_phone: 1,
      billing_customer_gender: 1,
      billing_customer_dob: 1,
      billing_address: 1,
      wishlist: 1,
      orders: 1,
      wallet: 1,
      createdAt: 1,
      updatedAt: 1,
    }

    if (isAdmin) {
      const users = await User.find({}, projection).lean()
      return NextResponse.json(users)
    } else {
      const user = await User.findOne({ clerkId: clerkUser.id }, projection).lean()
      return NextResponse.json(user ? [user] : [])
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}


function normalizePhone(phone: string): string {
  if (!phone) return ''

  let cleaned = phone.replace(/[^\d+]/g, '')

  // already international format
  if (cleaned.startsWith('+')) return cleaned

  // remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')

  // if starts with 61 and length 11 -> Australian international form
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return `+${cleaned}`
  }

  // fallback → Australian number, prepend +61
  return `+61${cleaned}`
}

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()
    const body = await req.json()

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      billing_fullname,
      email,
      billing_phone,
      billing_customer_dob,
      billing_customer_gender,
      billing_address = [],
    } = body

    const dob = new Date(billing_customer_dob)
    if (billing_customer_dob && isNaN(dob.getTime())) {
      return NextResponse.json({ error: 'Invalid DOB format' }, { status: 400 })
    }

    const existingUser = await User.findOne({ clerkId: clerkUser.id })
    if (existingUser) {
      return NextResponse.json({ error: 'User profile already exists' }, { status: 409 })
    }

    const emailExists = await User.findOne({
      email,
      clerkId: { $ne: clerkUser.id },
    })

    if (emailExists) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const resolvedFullName =
      billing_fullname ||
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()

    const resolvedEmail =
      email || clerkUser.emailAddresses[0]?.emailAddress || ''

    const user = await User.create({
      clerkId: clerkUser.id,
      billing_fullname: resolvedFullName,
      email: resolvedEmail,
      billing_phone: normalizePhone(billing_phone),
      billing_customer_dob: billing_customer_dob ? dob : undefined,
      billing_customer_gender,
      billing_address,
      wallet: { points: 0, transactions: [] },
    })

    return NextResponse.json(
      {
        message: 'User profile created successfully',
        user: {
          id: user._id,
          clerkId: user.clerkId,
          billing_fullname: user.billing_fullname,
          email: user.email,
          billing_phone: user.billing_phone,
          billing_customer_gender: user.billing_customer_gender,
          billing_customer_dob: user.billing_customer_dob,
          billing_address: user.billing_address,
          wallet: user.wallet,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)

    if (error?.code === 11000) {
      if (error.keyPattern?.clerkId) {
        return NextResponse.json({ error: 'User profile already exists' }, { status: 409 })
      }
      if (error.keyPattern?.email) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create user', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
