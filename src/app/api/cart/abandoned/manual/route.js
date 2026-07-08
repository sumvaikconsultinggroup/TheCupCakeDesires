import mailer from '@/lib/mailer'
import CartNotification from '@/models/CartNotification'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'

// Ensure single shared DB connection
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()

    const { email, type, subject, message, cartData } = body || {}

    // Basic validation (important in Next.js APIs)
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    let emailSubject = subject || 'Notification from Store'
    let emailHtml = ''

    if (type === 'template') {
      emailSubject = 'You left items in your cart'

      const productsHtml = (cartData?.products || [])
        .map(
          (p) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;background-color:#f9fafb;border-radius:4px;">
<tr>
<td style="padding:12px;" width="70"><img src="${p.imageUrl || ''}" width="56" height="56" style="border-radius:4px;display:block;object-fit:cover;" /></td>
<td style="padding:12px;">
<p style="margin:0;font-size:14px;color:#111827;font-weight:600;">${p.name || ''}</p>
<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${p.variant?.option1Value || ''} &middot; Qty: ${p.quantity || 1}</p>
</td>
<td style="padding:12px;text-align:right;font-size:14px;color:#111827;font-weight:600;" width="80">&#8377;${p.price || 0}</td>
</tr>
</table>`
        )
        .join('')

      emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#1B198F;padding:24px 40px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">The Cupcake Desire</p>
</td>
</tr>
<tr>
<td style="padding:36px 40px;">
<h2 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">You Left Items in Your Cart</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.7;">Hi ${cartData?.userName || 'Valued Customer'},</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">You were one step away from completing your order. The items below are still reserved in your cart.</p>
${productsHtml}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
<tr><td align="center" style="border-radius:4px;background-color:#1B198F;">
<a href="${process.env.STORE_URL}/cart" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;width:100%;text-align:center;box-sizing:border-box;">Complete My Order</a>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:0 8px;text-align:center;font-size:13px;color:#6b7280;" width="33%">Secure Checkout</td>
<td style="padding:0 8px;text-align:center;font-size:13px;color:#6b7280;" width="34%">Fast Delivery</td>
<td style="padding:0 8px;text-align:center;font-size:13px;color:#6b7280;" width="33%">100% Authentic</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 4px;color:#6b7280;font-size:12px;">You are receiving this email because you added products to your cart at ${process.env.STORE_NAME}.</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">Need help? Contact support anytime.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`
    } else {
      emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#1B198F;padding:24px 40px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">The Cupcake Desire</p>
</td>
</tr>
<tr>
<td style="padding:36px 40px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">${subject || 'Message'}</h2>
<div style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message || ''}</div>
</td>
</tr>
<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0;color:#9ca3af;font-size:11px;">Sent from ${process.env.STORE_NAME}</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`
    }

    await mailer({
      email,
      subject: emailSubject,
      html: emailHtml,
    })

    // Mark notification as sent only when template is used
    if (type === 'template' && cartData?._id) {
      await CartNotification.updateOne(
        { _id: cartData._id },
        { $set: { isSent: true, isActive: false, sentAt: new Date() } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Cart email error:', err)

    return NextResponse.json({ success: false, message: err.message || 'Server error' }, { status: 500 })
  }
}
