import nodemailer from 'nodemailer'

/**
 * @deprecated Use `sendEmail` from `src/lib/email/send.ts` (Resend) instead.
 *
 * This Nodemailer mailer is retained only for backwards compatibility
 * with code paths that have not yet been migrated to Resend
 * (`src/app/api/cart/abandoned/*`, `src/app/api/cron/pending-order-reminder`,
 * `src/utils/sendOrderConfirmationEmail.ts`).
 *
 * Do NOT use for new code. The SMTP creds previously referenced
 * (`smtp.example.com`) were placeholders and never worked in production.
 * This file will be removed once all callers migrate to Resend.
 */
const mailer = async (options) => {
  // 1. Create a transporter using your email service credentials
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  // 2. Define the email options
  const mailOptions = {
    from: 'The Cupcake Desire <info@thecupcakedesire.com.au>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  }

  // 3. Actually send the email
  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('There was an error sending the email. Please try again later.')
  }
}

export default mailer
