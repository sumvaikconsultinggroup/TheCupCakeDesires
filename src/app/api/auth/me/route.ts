import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ success: false, user: null })
    }

    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, user: null })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl || '',
        phone: user.phoneNumbers?.[0]?.phoneNumber || '',
      },
    })
  } catch {
    return NextResponse.json({ success: false, user: null })
  }
}
