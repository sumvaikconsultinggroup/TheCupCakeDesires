import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await connectDb()
    const { email, password, name, phone, address, orderId, createAccount } = await req.json()

    if (!createAccount || !email || !password) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
    }

    // MANDATORY contact-info gate (no bypass — Shopify-style guest checkout)
    // Both phone and email are required for guest account creation.
    const _email = String(email || '').trim()
    const _phone = String(phone || '')
      .trim()
      .replace(/[\s-]/g, '')

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!emailRegex.test(_email)) {
      return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 })
    }

    // Australian phone: 10 digits starting 0X (X in 2-5,7,8), optionally prefixed +61 / 61.
    if (!/^(?:\+?61)?0?[2-578]\d{8}$/.test(_phone)) {
      return NextResponse.json(
        { success: false, message: 'A valid 10-digit Australian phone number is required.' },
        { status: 400 }
      )
    }

    // 1. Check if user already exists in Clerk or MongoDB
    let clerkUser
    try {
      const client = await clerkClient()
      const existingUsers = await client.users.getUserList({ emailAddress: [email] })
      if (existingUsers.data.length > 0) {
        // User already exists - do not create duplicate, ask them to log in
        return NextResponse.json(
          {
            success: false,
            message: 'An account with this email already exists. Please log in instead.',
          },
          { status: 400 }
        )
      }

      const existingMongoUser = await User.findOne({ email })
      if (existingMongoUser?.clerkId) {
        return NextResponse.json(
          {
            success: false,
            message: 'An account with this email already exists. Please log in instead.',
          },
          { status: 400 }
        )
      }

      // 2. Create user in Clerk
      const firstName = name?.split(' ')[0] || 'Guest'
      const lastName = name?.split(' ').slice(1).join(' ') || ''

      clerkUser = await client.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName,
        // phoneNumber: phone, // Clerk requires E.164 format and unique, skipping for now or formatting strictly
        skipPasswordChecks: false, // Use our own password validation
        skipPasswordRequirement: false,
      })
    } catch (error: any) {
      console.error('Error dealing with Clerk user:', error)

      // Extract detailed error message from Clerk
      let errorMessage = 'Failed to create account'

      if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0]?.message || error.errors[0]?.longMessage || errorMessage
      } else if (error?.message) {
        errorMessage = error.message
      }

      // Check for specific error types
      if (errorMessage.toLowerCase().includes('password')) {
        errorMessage =
          'Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.'
      } else if (errorMessage.toLowerCase().includes('email')) {
        errorMessage = 'Invalid email address or email already in use.'
      }

      console.error('Clerk error details:', errorMessage)
      return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }

    // 3. Create/Update User in MongoDB
    let mongoUser = await User.findOne({ email })

    if (!mongoUser) {
      // Create new Mongo user
      mongoUser = await User.create({
        clerkId: clerkUser.id,
        email: email,
        billing_fullname: name,
        billing_phone: phone,
        billing_address: address
          ? [
              {
                billing_address_type: 'home',
                billing_customer_name: name,
                billing_addressLine: address.addressLine || address.address || address.street,
                billing_city: address.city,
                billing_state: address.state,
                billing_pincode: address.zipcode || address.postalCode,
                billing_country: address.country,
              },
            ]
          : [],
        orders: [], // Will link order below
      })
    } else {
      // Update existing Mongo user if missing clerkId
      if (!mongoUser.clerkId) {
        mongoUser.clerkId = clerkUser.id
        await mongoUser.save()
      }
    }

    // 4. Link Order to User
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        userId: mongoUser._id, // Update order with real user Mongo ID
        // 'user.userId': mongoUser._id, // Also update snapshot? Schema structure is tricky referential
      })

      // Add order to user's history if not present
      if (!mongoUser.orders.some((o: any) => o.orderId === orderId)) {
        await User.findByIdAndUpdate(mongoUser._id, {
          $push: { orders: { orderId, productId: 'REF_ONLY' } }, // Simplified for now
        })
      }
    }

    return NextResponse.json({
      success: true,
      userId: clerkUser.id,
      mongoUserId: mongoUser._id,
      message: 'Account created successfully',
    })
  } catch (error) {
    console.error('Error in create-guest-account:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, message: 'Unknown error' }, { status: 500 })
  }
}
