import { NextResponse } from 'next/server'

import { subscribeToNewsletter } from '@/lib/newsletter/subscribe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email : ''
    const source = typeof body?.source === 'string' ? body.source : 'homepage'

    const result = await subscribeToNewsletter(email, source)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed: result.alreadySubscribed ?? false,
      welcomeEmailSent: result.welcomeEmailSent ?? false,
      message: result.alreadySubscribed
        ? "You're already on the list — we'll see you Wednesday."
        : "You're in! Check your inbox for a welcome note.",
    })
  } catch (error) {
    console.error('[newsletter] subscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to subscribe. Please try again.' }, { status: 500 })
  }
}
