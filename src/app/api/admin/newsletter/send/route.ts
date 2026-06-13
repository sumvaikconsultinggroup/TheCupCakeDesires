import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, hasPermission } from '@/lib/auth'
import { sendNewsletterCampaign } from '@/lib/newsletter/send-campaign'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_ATTACHMENTS = 5

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

export async function POST(request: NextRequest) {
  const auth = await requireNewsletterAdmin()
  if ('error' in auth) return auth.error

  try {
    const formData = await request.formData()
    const subject = String(formData.get('subject') || '').trim()
    const previewText = String(formData.get('previewText') || '').trim()
    const bodyHtml = String(formData.get('bodyHtml') || '').trim()
    const confirm = String(formData.get('confirm') || '')

    if (confirm !== 'send') {
      return NextResponse.json(
        { success: false, message: 'Please confirm before sending to all subscribers.' },
        { status: 400 }
      )
    }

    const rawFiles = formData.getAll('attachments')
    const attachments: { filename: string; content: Buffer }[] = []

    for (const entry of rawFiles) {
      if (!(entry instanceof File) || entry.size === 0) continue
      if (attachments.length >= MAX_ATTACHMENTS) {
        return NextResponse.json(
          { success: false, message: `Maximum ${MAX_ATTACHMENTS} attachments allowed.` },
          { status: 400 }
        )
      }
      if (entry.size > MAX_ATTACHMENT_BYTES) {
        return NextResponse.json(
          { success: false, message: `Attachment "${entry.name}" exceeds 10 MB.` },
          { status: 400 }
        )
      }
      const buffer = Buffer.from(await entry.arrayBuffer())
      attachments.push({ filename: entry.name, content: buffer })
    }

    const result = await sendNewsletterCampaign({
      subject,
      previewText: previewText || undefined,
      bodyHtml,
      attachments: attachments.length ? attachments : undefined,
      sentByEmail: auth.user.email,
    })

    if (result.recipientCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No active subscribers to send to.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: result.failedCount === 0,
      data: result,
      message:
        result.failedCount === 0
          ? `Campaign sent to ${result.successCount} subscriber${result.successCount === 1 ? '' : 's'}.`
          : `Sent ${result.successCount}, failed ${result.failedCount}, skipped ${result.skippedCount}.`,
    })
  } catch (error) {
    console.error('[admin/newsletter/send] POST error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send campaign' }, { status: 500 })
  }
}
