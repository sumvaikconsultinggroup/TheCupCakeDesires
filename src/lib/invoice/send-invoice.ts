import { buildInvoiceFromOrder, type InvoiceOrderSource } from '@/lib/invoice/build-invoice'
import { formatAbn, formatAcn } from '@/lib/invoice/company'
import { renderInvoicePdf } from '@/lib/invoice/pdf'
import { sendEmail } from '@/lib/email/send'
import Order from '@/models/Order'

const SITE =
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://thecupcakedesire.com.au'

interface SendResult {
  success: boolean
  error?: string
  invoiceNumber?: string
}

function pickEmail(order: InvoiceOrderSource): string | undefined {
  return (
    order.customer?.email ||
    order.user?.email ||
    order.deliveryAddress?.email ||
    order.shippingAddress?.email ||
    undefined
  )
}

function pickName(order: InvoiceOrderSource): string {
  return (
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
    order.customer?.name ||
    `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
    order.user?.name ||
    `${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}`.trim() ||
    'Customer'
  )
}

/**
 * Persist invoice number on the order (idempotent), render PDF, email customer.
 */
export async function sendPaidInvoiceEmail(
  order: InvoiceOrderSource,
  opts?: { idempotencyKey?: string; skipPersist?: boolean }
): Promise<SendResult> {
  const to = pickEmail(order)
  if (!to) return { success: false, error: 'No email found' }
  if (!order.orderId) return { success: false, error: 'Missing order id' }

  const invoice = buildInvoiceFromOrder(order)

  if (!opts?.skipPersist) {
    try {
      await Order.updateOne(
        {
          orderId: order.orderId,
          $or: [{ invoiceNumber: { $exists: false } }, { invoiceNumber: null }, { invoiceNumber: '' }],
        },
        {
          $set: {
            invoiceNumber: invoice.invoiceNumber,
            invoiceGeneratedAt: new Date(),
          },
        }
      )
    } catch (err) {
      console.error('Failed to persist invoice number:', err)
    }
  }

  let pdf: Buffer
  try {
    pdf = await renderInvoicePdf(invoice)
  } catch (err) {
    console.error('Failed to render invoice PDF:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate invoice PDF',
    }
  }

  const name = pickName(order)
  const c = invoice.company
  const logoUrl = `${SITE.replace(/\/$/, '')}${c.logoPath.startsWith('/') ? c.logoPath : `/${c.logoPath}`}`
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fbf3e8;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbf3e8;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr><td style="background-color:#ffffff;padding:24px 40px;border-bottom:1px solid #ead9c1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="72" valign="top" style="padding-right:16px;">
<img src="${logoUrl}" alt="${c.name}" width="64" height="64" style="display:block;border:0;border-radius:8px;" />
</td>
<td valign="top">
<p style="margin:0 0 4px;color:#2e1f15;font-size:18px;font-weight:700;">${c.name}</p>
<p style="margin:0 0 2px;color:#5a4634;font-size:13px;">${c.legalName}</p>
<p style="margin:0 0 2px;color:#5a4634;font-size:12px;">ABN ${formatAbn(c.abn)} · ACN ${formatAcn(c.acn)}</p>
<p style="margin:0 0 2px;color:#5a4634;font-size:12px;">${c.phone}${c.mobile ? ` · ${c.mobile}` : ''}</p>
<p style="margin:0;color:#5a4634;font-size:12px;"><a href="https://${c.website.replace(/^https?:\/\//, '')}" style="color:#2e1f15;">${c.website}</a> · <a href="mailto:${c.email}" style="color:#2e1f15;">${c.email}</a></p>
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:36px 40px;">
<h2 style="margin:0 0 20px;font-size:22px;color:#2e1f15;font-weight:700;">Your Tax Invoice</h2>
<p style="margin:0 0 8px;font-size:15px;color:#5a4634;line-height:1.7;">Hi ${name},</p>
<p style="margin:0 0 16px;font-size:15px;color:#5a4634;line-height:1.7;">Thanks for your payment. Your tax invoice for order <strong>${invoice.orderId}</strong> (${invoice.invoiceNumber}) is attached as a PDF.</p>
<p style="margin:0;font-size:14px;color:#8b7359;">Thank you for shopping with ${c.name}.</p>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #ead9c1;text-align:center;">
<p style="margin:0 0 4px;color:#8b7359;font-size:13px;font-weight:600;">${c.name}</p>
<p style="margin:0 0 4px;color:#a89478;font-size:11px;">${c.legalName} · ABN ${formatAbn(c.abn)}</p>
<p style="margin:0;color:#a89478;font-size:11px;">Please do not reply directly to this email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const res = await sendEmail({
    to,
    subject: `Invoice ${invoice.invoiceNumber} — Order ${invoice.orderId}`,
    html,
    templateId: 'OrderInvoiceEmail',
    refId: invoice.orderId,
    refType: 'order',
    tags: [
      { name: 'template', value: 'OrderInvoiceEmail' },
      { name: 'order_id', value: invoice.orderId.replace(/[^a-zA-Z0-9_-]/g, '-') },
    ],
    idempotencyKey: opts?.idempotencyKey,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdf,
      },
    ],
    skipSuppressionCheck: true,
  })

  return res.success
    ? { success: true, invoiceNumber: invoice.invoiceNumber }
    : { success: false, error: res.error || 'Failed to send invoice email' }
}
