// src/utils/emailTemplates.ts

export const getOrderConfirmationTemplate = (orderData: {
  customerName: string
  orderId: string
  orderDate: string
  items: Array<{
    name: string
    imageUrl: string
    variant?: {
      option1Value?: string
      option2Value?: string
      option3Value?: string
    }
    quantity: number
    price: number
  }>
  subtotal: number
  discount?: number
  shipping?: number
  taxes?: number
  total: number
  paymentMethod: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}) => {
  const formatAddress = () => {
    const { street, city, state, postalCode, country } = orderData.shippingAddress
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmation</title>
</head>
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
<h2 style="margin:0 0 20px;font-size:22px;color:#111827;font-weight:700;">Order Confirmed</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Thank you for your purchase, ${orderData.customerName}.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f9fafb;border-radius:4px;">
<tr>
<td style="padding:12px 16px;">
<p style="margin:0;font-size:12px;color:#6b7280;">Order Number</p>
<p style="margin:4px 0 0;font-size:16px;color:#111827;font-weight:700;">${orderData.orderId}</p>
</td>
<td style="padding:12px 16px;text-align:right;">
<p style="margin:0;font-size:12px;color:#6b7280;">Order Date</p>
<p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">${orderData.orderDate}</p>
</td>
</tr>
</table>

<h3 style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:700;">Order Items</h3>

${orderData.items.map((item) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;background-color:#f9fafb;border-radius:4px;">
<tr>
<td style="padding:12px;" width="70">
<img src="${item.imageUrl || 'https://via.placeholder.com/56'}" alt="${item.name}" width="56" height="56" style="border-radius:4px;display:block;object-fit:cover;" />
</td>
<td style="padding:12px;">
<p style="margin:0;font-size:14px;color:#111827;font-weight:600;">${item.name}</p>
${item.variant && (item.variant.option1Value || item.variant.option2Value) ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${[item.variant.option1Value, item.variant.option2Value, item.variant.option3Value].filter(Boolean).join(' / ')}</p>` : ''}
<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">Qty: ${item.quantity}</p>
</td>
<td style="padding:12px;text-align:right;vertical-align:middle;" width="90">
<p style="margin:0;font-size:15px;color:#1B198F;font-weight:700;">$${(item.price * item.quantity).toLocaleString('en-AU')}</p>
</td>
</tr>
</table>
`).join('')}

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#f9fafb;border-radius:4px;">
<tr><td style="padding:8px 16px;font-size:14px;color:#6b7280;">Subtotal</td><td style="padding:8px 16px;text-align:right;font-size:14px;color:#111827;font-weight:600;">$${orderData.subtotal.toLocaleString('en-AU')}</td></tr>
${orderData.discount ? `<tr><td style="padding:4px 16px;font-size:14px;color:#059669;">Discount</td><td style="padding:4px 16px;text-align:right;font-size:14px;color:#059669;font-weight:600;">-$${orderData.discount.toLocaleString('en-AU')}</td></tr>` : ''}
${orderData.shipping ? `<tr><td style="padding:4px 16px;font-size:14px;color:#6b7280;">Shipping</td><td style="padding:4px 16px;text-align:right;font-size:14px;color:#111827;font-weight:600;">$${orderData.shipping.toLocaleString('en-AU')}</td></tr>` : ''}
${orderData.taxes ? `<tr><td style="padding:4px 16px;font-size:14px;color:#6b7280;">Taxes</td><td style="padding:4px 16px;text-align:right;font-size:14px;color:#111827;font-weight:600;">$${orderData.taxes.toLocaleString('en-AU')}</td></tr>` : ''}
<tr><td style="padding:12px 16px;font-size:16px;color:#111827;font-weight:700;border-top:1px solid #e5e7eb;">Total</td><td style="padding:12px 16px;text-align:right;font-size:18px;color:#1B198F;font-weight:700;border-top:1px solid #e5e7eb;">$${orderData.total.toLocaleString('en-AU')}</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr>
<td style="padding:12px 16px;background-color:#f9fafb;border-radius:4px;" width="48%">
<p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Payment Method</p>
<p style="margin:6px 0 0;font-size:14px;color:#111827;font-weight:600;text-transform:uppercase;">${orderData.paymentMethod}</p>
</td>
<td width="4%"></td>
<td style="padding:12px 16px;background-color:#f9fafb;border-radius:4px;" width="48%">
<p style="margin:0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Delivery Address</p>
<p style="margin:6px 0 0;font-size:13px;color:#111827;line-height:1.5;">${formatAddress()}</p>
</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border-radius:4px;">
<tr>
<td style="padding:16px;text-align:center;">
<p style="margin:0 0 8px;font-size:15px;color:#111827;font-weight:600;">Need Help?</p>
<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
<a href="mailto:hello@cupcakedesires.com" style="color:#1B198F;text-decoration:none;">hello@cupcakedesires.com</a>
&nbsp;&middot;&nbsp;
<a href="tel:+61398765432" style="color:#1B198F;text-decoration:none;">03 9876 5432</a>
</p>
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;">The Cupcake Desire</p>
<p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
<a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color:#1B198F;text-decoration:none;">Shop</a>
&nbsp;&middot;&nbsp;
<a href="${process.env.NEXT_PUBLIC_BASE_URL}profile/orders" style="color:#1B198F;text-decoration:none;">Orders</a>
&nbsp;&middot;&nbsp;
<a href="${process.env.NEXT_PUBLIC_BASE_URL}contact" style="color:#1B198F;text-decoration:none;">Contact</a>
</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} The Cupcake Desire. All rights reserved.</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
`
}