import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, hasPermission } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import NewsletterCampaign from '@/models/NewsletterCampaign'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'

export const dynamic = 'force-dynamic'

async function requireNewsletterAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) }
  }
  if (!hasPermission(user, '/admin/marketing/newsletter')) {
    return {
      error: NextResponse.json(
        { success: false, message: "You don't have access to newsletter marketing." },
        { status: 403 }
      ),
    }
  }
  return { user }
}

export async function GET(request: NextRequest) {
  const auth = await requireNewsletterAdmin()
  if ('error' in auth) return auth.error

  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
    const skip = (page - 1) * limit

    const filter = status === 'all' ? {} : { status }

    const [subscribers, total, activeCount, unsubscribedCount, recentCampaigns] = await Promise.all([
      NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 }).skip(skip).limit(limit).lean(),
      NewsletterSubscriber.countDocuments(filter),
      NewsletterSubscriber.countDocuments({ status: 'active' }),
      NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
      NewsletterCampaign.find({}).sort({ sentAt: -1 }).limit(10).lean(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: { active: activeCount, unsubscribed: unsubscribedCount, total: activeCount + unsubscribedCount },
        recentCampaigns,
      },
    })
  } catch (error) {
    console.error('[admin/newsletter/subscribers] GET error:', error)
    return NextResponse.json({ success: false, message: 'Failed to load subscribers' }, { status: 500 })
  }
}
