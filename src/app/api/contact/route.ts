import * as React from 'react'
import { NextRequest, NextResponse } from 'next/server'

import { ContactAcknowledgementEmail } from '@/emails/templates/ContactAcknowledgementEmail'
import { ContactEnquiryEmail } from '@/emails/templates/ContactEnquiryEmail'
import { sendEmail } from '@/lib/email/send'
import connectDb from '@/lib/mongodb'
import ContactEnquiry from '@/models/ContactEnquiry'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function asTrimmedString(value: unknown, max = 500): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function contactToAddress(): string {
  return (
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.RESEND_REPLY_TO?.trim() ||
    'info@thecupcakedesire.com.au'
  )
}

function buildMessage(parts: {
  message: string
  company: string
  date: string
  quantity: string
}): string {
  if (parts.message) return parts.message

  const lines: string[] = []
  if (parts.company) lines.push(`Company: ${parts.company}`)
  if (parts.quantity) lines.push(`Quantity: ${parts.quantity}`)
  if (parts.date) lines.push(`Date: ${parts.date}`)
  if (lines.length === 0) return '(No additional message provided)'
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const name = asTrimmedString(body?.name, 120)
    const email = asTrimmedString(body?.email, 200).toLowerCase()
    const phone = asTrimmedString(body?.phone, 40)
    const company = asTrimmedString(body?.company, 160)
    const date = asTrimmedString(body?.date ?? body?.eventDate, 80)
    const quantity = asTrimmedString(body?.quantity ?? body?.guestCount, 80)
    const topicOrSubject = asTrimmedString(body?.subject, 180)
    const rawMessage = asTrimmedString(body?.message, 5000)
    const source = asTrimmedString(body?.source, 80)

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required.' },
        { status: 400 }
      )
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const message = buildMessage({ message: rawMessage, company, date, quantity })
    const subject =
      topicOrSubject ||
      (company ? `Website enquiry · ${company}` : 'New Contact Form Message')

    const toInfo = contactToAddress()

    // Persist first so a Resend/domain outage never loses the lead.
    await connectDb()
    const enquiry = await ContactEnquiry.create({
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      date: date || undefined,
      quantity: quantity || undefined,
      subject,
      message,
      source: source || undefined,
      emailToInfoStatus: 'pending',
      emailAckStatus: 'pending',
    })

    const infoResult = await sendEmail({
      to: toInfo,
      subject,
      replyTo: email,
      templateId: 'contact-enquiry-internal',
      skipSuppressionCheck: true,
      refId: String(enquiry._id),
      refType: 'contact_enquiry',
      tags: [
        { name: 'category', value: 'contact' },
        { name: 'audience', value: 'internal' },
      ],
      react: React.createElement(ContactEnquiryEmail, {
        name,
        email,
        phone: phone || undefined,
        company: company || undefined,
        date: date || undefined,
        quantity: quantity || undefined,
        subject,
        message,
      }),
    })

    if (!infoResult.success) {
      console.error('CONTACT INFO MAIL FAILED:', infoResult.error)
      enquiry.emailToInfoStatus = 'failed'
      enquiry.emailError = infoResult.error
      enquiry.emailAckStatus = 'skipped'
      await enquiry.save()

      const isDomainIssue = /domain is not verified/i.test(infoResult.error || '')
      return NextResponse.json(
        {
          success: false,
          error: isDomainIssue
            ? 'Email is not configured yet (Resend domain not verified). Please email info@thecupcakedesire.com.au directly, or try again shortly.'
            : 'Failed to send email',
          enquiryId: String(enquiry._id),
          ...(process.env.CONTACT_DEBUG === '1' ? { detail: infoResult.error } : {}),
        },
        { status: 500 }
      )
    }

    enquiry.emailToInfoStatus = 'sent'
    await enquiry.save()

    const ackResult = await sendEmail({
      to: email,
      subject: `We've received your enquiry — The Cupcake Desire`,
      replyTo: toInfo,
      templateId: 'contact-enquiry-ack',
      skipSuppressionCheck: true,
      refId: String(enquiry._id),
      refType: 'contact_enquiry',
      tags: [
        { name: 'category', value: 'contact' },
        { name: 'audience', value: 'customer' },
      ],
      react: React.createElement(ContactAcknowledgementEmail, {
        name,
        subject,
        recipientEmail: email,
      }),
    })

    if (!ackResult.success) {
      console.error('CONTACT ACK MAIL FAILED:', ackResult.error)
      enquiry.emailAckStatus = 'failed'
      enquiry.emailError = [enquiry.emailError, ackResult.error].filter(Boolean).join(' | ')
    } else {
      enquiry.emailAckStatus = 'sent'
    }
    await enquiry.save()

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      acknowledgementSent: Boolean(ackResult.success),
      enquiryId: String(enquiry._id),
    })
  } catch (err) {
    console.error('CONTACT MAIL ERROR:', err)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
