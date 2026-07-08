import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import PromoCode from '@/models/PromoCode'
import mailer from '@/lib/mailer'
import crypto from 'crypto'

function generateCouponCode(prefix: string): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${random}`
}

function buildReminderEmail(
  customerName: string,
  orderId: string,
  orderDate: string,
  items: any[],
  totalAmount: number,
  couponCode: string,
  discountPercent: number,
  paymentUrl: string
): string {
  const itemRows = items
    .map(
      (item: any) =>
        `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${item.name}${item.variants?.length > 0 ? `<br><span style="font-size:11px;color:#6b7280;">${item.variants.filter((v: any) => v.name === 'Option 1').map((v: any) => v.option).join('')}</span>` : ''}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${(item.price * item.quantity).toLocaleString('en-IN')}</td>
</tr>`
    )
    .join('')

  return `<!DOCTYPE html>
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
<h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">Complete Your Order</h2>
<p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.7;">Hi ${customerName},</p>
<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">We noticed the payment for your order <strong>${orderId}</strong> placed on ${orderDate} is still pending. Your items are reserved and waiting for you.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:2px dashed #d97706;border-radius:4px;">
<tr><td style="padding:16px;text-align:center;">
<p style="margin:0 0 4px;font-size:12px;color:#92400e;font-weight:600;text-transform:uppercase;">Exclusive Offer Just For You</p>
<p style="margin:0;font-size:28px;color:#b45309;font-weight:700;letter-spacing:3px;">${couponCode}</p>
<p style="margin:6px 0 0;font-size:14px;color:#92400e;font-weight:600;">${discountPercent}% OFF your order</p>
<p style="margin:4px 0 0;font-size:11px;color:#92400e;">Valid for 24 hours only &middot; Single use</p>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Product</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="90">Price</th>
</tr>
${itemRows}
<tr style="background-color:#f9fafb;">
<td colspan="2" style="padding:12px;font-size:14px;color:#111827;font-weight:700;text-align:right;">Total</td>
<td style="padding:12px;font-size:14px;color:#1B198F;font-weight:700;text-align:right;">&#8377;${totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>

<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">Apply the coupon code above at checkout to get <strong>${discountPercent}% off</strong>, then complete your payment.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
<tr><td align="center" style="border-radius:4px;background-color:#1B198F;">
<a href="${paymentUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Complete Payment Now</a>
</td></tr>
</table>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have already paid, please disregard this email. If you faced any issues during payment or decided not to proceed, we would love to hear from you.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;background-color:#f9fafb;border-radius:4px;">
<tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Order ID: <strong style="color:#111827;">${orderId}</strong></td></tr>
</table>
<p style="margin:20px 0 0;font-size:13px;color:#6b7280;">If you have any questions, please reply to this email.</p>
</td>
</tr>

<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;">The Cupcake Desire</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} The Cupcake Desire. All rights reserved.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

async function createCouponForOrder(
  orderId: string,
  customerEmail: string,
  discountPercent: number,
  sourceType: 'pending_reminder_5' | 'pending_reminder_10'
): Promise<string> {
  const prefix = discountPercent === 5 ? 'PAYNOW5' : 'PAYNOW10'
  let code = generateCouponCode(prefix)

  // Ensure uniqueness
  let attempts = 0
  while (attempts < 5) {
    const existing = await PromoCode.findOne({ code })
    if (!existing) break
    code = generateCouponCode(prefix)
    attempts++
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

  await PromoCode.create({
    code,
    discountType: 'percentage',
    discountValue: discountPercent,
    minOrderAmount: 0,
    usageLimit: 1,
    usageCount: 0,
    startsAt: now,
    expiresAt,
    isActive: true,
    appliesTo: 'all',
    allowedEmails: [customerEmail.toLowerCase().trim()],
    sourceOrderId: orderId,
    sourceType,
  })

  return code
}

async function processOrders() {
  const now = new Date()
  const results = {
    dailyReminders: 0,
    fourDayReminders: 0,
    errors: [] as { orderId: string; error: string }[],
  }

  const pendingOrders = await Order.find({
    $or: [
      { status: { $in: ['order_created', 'pending', 'pending_payment'] }, 'paymentDetails.paymentStatus': 'pending' },
      { status: { $in: ['order_created', 'pending', 'pending_payment'] }, 'payment.status': 'created' },
    ],
    createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
  })

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cupcakedesires.com'

  for (const order of pendingOrders) {
    try {
      const customerEmail = order.user?.email
      if (!customerEmail) continue

      const customerName =
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Valued Customer'

      const orderAgeDays = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const orderId = order.orderId || order._id.toString()
      const paymentUrl = `${baseUrl}/checkout/payment/${orderId}`
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      if (orderAgeDays >= 4) {
        // 4+ days old: send 10% coupon (one-time only)
        const alreadySent = await PromoCode.findOne({
          sourceOrderId: orderId,
          sourceType: 'pending_reminder_10',
        })

        if (alreadySent) continue

        const couponCode = await createCouponForOrder(orderId, customerEmail, 10, 'pending_reminder_10')

        const html = buildReminderEmail(
          customerName,
          orderId,
          orderDate,
          order.items || [],
          order.totalAmount,
          couponCode,
          10,
          paymentUrl
        )

        await mailer({
          email: customerEmail,
          subject: `Last Chance: 10% OFF on Order ${orderId} | The Cupcake Desire`,
          html,
        })

        results.fourDayReminders++
      } else {
        // 0-3 days old: send daily 5% coupon (once per day)
        const alreadySentToday = await PromoCode.findOne({
          sourceOrderId: orderId,
          sourceType: 'pending_reminder_5',
          createdAt: { $gte: todayStart },
        })

        if (alreadySentToday) continue

        const couponCode = await createCouponForOrder(orderId, customerEmail, 5, 'pending_reminder_5')

        const html = buildReminderEmail(
          customerName,
          orderId,
          orderDate,
          order.items || [],
          order.totalAmount,
          couponCode,
          5,
          paymentUrl
        )

        await mailer({
          email: customerEmail,
          subject: `Payment Reminder: 5% OFF on Order ${orderId} | The Cupcake Desire`,
          html,
        })

        results.dailyReminders++
      }
    } catch (err: any) {
      const oid = order.orderId || order._id?.toString() || 'unknown'
      console.error(`Error processing pending reminder for order ${oid}:`, err)
      results.errors.push({ orderId: oid, error: err.message })
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    const results = await processOrders()

    return NextResponse.json({
      success: true,
      data: results,
      message: `Sent ${results.dailyReminders} daily reminders (5%) and ${results.fourDayReminders} final reminders (10%)`,
    })
  } catch (error: any) {
    console.error('Error in pending order reminder cron:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process pending order reminders', error: error.message },
      { status: 500 }
    )
  }
}
