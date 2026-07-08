import nodemailer from 'nodemailer'

function contactTemplate({ name, email, phone, message }) {
  return `
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
<h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">New Contact Submission</h2>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A new inquiry has been received from the website.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><p style="margin:0 0 2px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Name</p><p style="margin:0;font-size:15px;color:#111827;">${name}</p></td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><p style="margin:0 0 2px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Email</p><p style="margin:0;font-size:15px;color:#111827;">${email}</p></td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;"><p style="margin:0 0 2px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Phone</p><p style="margin:0;font-size:15px;color:#111827;">${phone}</p></td></tr>
<tr><td style="padding:10px 0;"><p style="margin:0 0 2px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Message</p><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;"><tr><td style="padding:12px;background-color:#f9fafb;border-radius:4px;font-size:14px;color:#374151;line-height:1.6;">${message}</td></tr></table></td></tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0;color:#9ca3af;font-size:11px;">The Cupcake Desire. All rights reserved.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>
  `
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
  port: process.env.SMTP_PORT, // e.g., 465 or 587
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS, // your password/app password
  },
})

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, phone, message } = body

    if (!name || !email || !message) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    await transporter.sendMail({
      from: `"The Cupcake Desire" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO_EMAIL, // admin email
      subject: 'New Contact Form Message',
      html: contactTemplate({ name, email, phone, message }),
    })

    return Response.json({ success: true, message: 'Email sent successfully' })
  } catch (err) {
    console.error('MAIL ERROR:', err)
    return Response.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
