// src/app/api/newsletter/route.ts

import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Configure transporter with environment variables
    // Make sure to add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD to your .env file
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const mailOptions = {
      from: process.env.SMTP_FROM || '"CupCake Desires" <noreply@cupcakedesires.com>',
      to: email,
      subject: 'Welcome to CupCake Desires',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

<tr>
<td style="background-color:#1B198F;padding:24px 40px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">CupCake Desires</p>
</td>
</tr>

<tr>
<td style="padding:36px 40px;">
<h2 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">Welcome to the Community</h2>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Thank you for subscribing. You are now part of our sweet little community — expect fresh-baked goodness, new flavours, and exclusive offers in your inbox.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f9fafb;border-radius:4px;">
<tr>
<td style="padding:16px;">
<p style="margin:0 0 6px;font-size:12px;color:#1B198F;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Coming to Your Inbox</p>
<p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">Seasonal flavours, behind-the-scenes from our bakery, and sweet little recipes. We are here to brighten your day.</p>
</td>
</tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
<tr><td align="center" style="border-radius:4px;background-color:#1B198F;">
<a href="${process.env.NEXT_PUBLIC_BASE_URL}collections/all-items" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Browse the Store</a>
</td></tr>
</table>

<p style="margin:0 0 12px;font-size:15px;color:#111827;font-weight:600;">What you can expect:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#1B198F;">Sweet Inspiration</strong> &mdash; Flavour pairings and gifting ideas.</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#1B198F;">New Launches</strong> &mdash; Early access to seasonal flavours and gift boxes.</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#374151;"><strong style="color:#1B198F;">Exclusive Deals</strong> &mdash; Subscriber-only offers and sales.</td></tr>
</table>
</td>
</tr>

<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;">CupCake Desires</p>
<p style="margin:0 0 4px;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} CupCake Desires. All rights reserved.</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">You received this email because you signed up for our newsletter.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
      `,
    }

    // Only attempt to send if credentials exist, otherwise log (for dev/demo purposes)
    if (process.env.SMTP_HOST) {
      await transporter.sendMail(mailOptions)
    } else {
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
