import * as React from 'react'

import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { colors } from '@/emails/components/tokens'

export interface AdminOtpEmailProps {
  recipientEmail: string
  adminName: string
  code: string
  /** What this OTP authorises. */
  purposeLabel: string
  /** Minutes until the code expires. */
  expiresInMinutes: number
}

export function AdminOtpEmail({
  recipientEmail,
  adminName,
  code,
  purposeLabel,
  expiresInMinutes,
}: AdminOtpEmailProps): React.ReactElement {
  const preview = `Your CupCake Desires admin verification code: ${code}`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview} showUnsubscribe={false}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ADMIN PANEL · VERIFICATION
      </Text>
      <Heading level={1}>Hi {adminName}, here&rsquo;s your code.</Heading>
      <Text variant="lead">
        Use the one-time code below to {purposeLabel}. It expires in {expiresInMinutes}{' '}
        minutes — once used, it can&rsquo;t be reused.
      </Text>

      <div
        style={{
          margin: '32px 0',
          padding: '24px',
          backgroundColor: colors.bgPage,
          borderRadius: 12,
          textAlign: 'center' as const,
          letterSpacing: '0.5em',
          fontSize: '32px',
          fontWeight: 700,
          color: colors.text,
        }}
      >
        {code}
      </div>

      <Text variant="secondary">
        Didn&rsquo;t request this? You can safely ignore this email — your account stays
        unchanged. If you keep receiving codes you didn&rsquo;t ask for, change your
        password immediately.
      </Text>
    </Layout>
  )
}

export default AdminOtpEmail
