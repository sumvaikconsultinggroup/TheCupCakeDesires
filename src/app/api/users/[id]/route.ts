import User from '@/models/User'
import { connectToDB } from '@/utils/db'
import { currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

function normalizePhone(phone: string): string {
  if (!phone) return ''

  let cleaned = phone.replace(/[^\d+]/g, '')

  // already international format
  if (cleaned.startsWith('+')) return cleaned

  // remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')

  // if starts with 61 and length 11 -> Australian international (e.g. 61398765432)
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return `+${cleaned}`
  }

  // fallback → Australian number, prepend +61
  return `+61${cleaned}`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const user = await User.findOne({ clerkId: id })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = clerkUser.publicMetadata?.role === 'admin'
    if (!isAdmin && user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other user data' }, { status: 403 })
    }

    return NextResponse.json({
      id: user._id,
      clerkId: user.clerkId,
      billing_fullname: user.billing_fullname,
      email: user.email,
      billing_phone: user.billing_phone,
      billing_customer_gender: user.billing_customer_gender,
      billing_customer_dob: user.billing_customer_dob,
      billing_address: user.billing_address,
      wallet: user.wallet,
      wishlist: user.wishlist,
      orders: user.orders,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clerkUser = await currentUser()

    await connectToDB()

    const existingUser = await User.findOne({ clerkId: id })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Allow updates if:
    // 1. User is authenticated and updating their own data
    // 2. User is admin
    // 3. User is updating the same clerkId they're claiming (for newly created guest accounts)
    const isAdmin = clerkUser?.publicMetadata?.role === 'admin'
    const isOwnAccount = clerkUser && existingUser.clerkId === clerkUser.id
    const isMatchingClerkId = existingUser.clerkId === id // Guest updating their newly created account
    
    if (!isAdmin && !isOwnAccount && !isMatchingClerkId) {
      return NextResponse.json({ error: 'Unauthorized - Cannot update this user' }, { status: 403 })
    }

    const body = await req.json()
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const {
      billing_fullname,
      email,
      billing_phone,
      billing_customer_dob,
      billing_customer_gender,
      billing_address,
    } = body

    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({
        email,
        clerkId: { $ne: existingUser.clerkId },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    let dob = existingUser.billing_customer_dob
    if (billing_customer_dob) {
      dob = new Date(billing_customer_dob)
      if (isNaN(dob.getTime())) {
        return NextResponse.json({ error: 'Invalid DOB format' }, { status: 400 })
      }
    }

    const updateData: any = {
      ...(billing_fullname && { billing_fullname }),
      ...(email && { email }),
      ...(billing_phone && { billing_phone: normalizePhone(billing_phone) }),
      ...(billing_customer_gender && { billing_customer_gender }),
      ...(billing_customer_dob && { billing_customer_dob: dob }),
      ...(billing_address && { billing_address }),
      updatedAt: new Date(),
    }

    const user = await User.findByIdAndUpdate(existingUser._id, updateData, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user!._id,
        clerkId: user!.clerkId,
        billing_fullname: user!.billing_fullname,
        email: user!.email,
        billing_phone: user!.billing_phone,
        billing_customer_gender: user!.billing_customer_gender,
        billing_customer_dob: user!.billing_customer_dob,
        billing_address: user!.billing_address,
        wallet: user!.wallet,
        updatedAt: user!.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('Update error:', error)

    if (error?.code === 11000 && error.keyPattern?.email) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDB()

    const user = await User.findOne({ clerkId: id })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = clerkUser.publicMetadata?.role === 'admin'
    if (!isAdmin && user.clerkId !== clerkUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deletedUser = await User.findOneAndDelete({ clerkId: id })
    if (!deletedUser) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser._id,
        clerkId: deletedUser.clerkId,
        billing_fullname: deletedUser.billing_fullname,
        email: deletedUser.email,
        createdAt: deletedUser.createdAt,
      },
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
