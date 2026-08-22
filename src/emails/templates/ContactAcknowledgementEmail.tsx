import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface ContactAcknowledgementEmailProps {
  name: string
  subject: string
  recipientEmail: string
}

export function ContactAcknowledgementEmail({
  name,
  subject,
  recipientEmail,
}: ContactAcknowledgementEmailProps): React.ReactElement {
  const firstName = name.trim().split(/\s+/)[0] || name
  const preview = `We've received your enquiry — The Cupcake Desire`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview} showUnsubscribe={false}>
      <Heading level={1}>Thanks for getting in touch, {firstName}</Heading>
      <Text variant="lead">
        We&rsquo;ve received your message and our team will reply as soon as we can — usually within
        one business day.
      </Text>

      <Text
        style={{
          backgroundColor: colors.bgSection,
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '8px 0 24px',
        }}
      >
        <strong style={{ color: colors.brand }}>Your enquiry:</strong> {subject}
      </Text>

      <Text>
        If you need to add details (quantity, flavours, date, or delivery suburb), just reply to this
        email — it goes straight to{' '}
        <a href={`mailto:${brand.supportEmail}`} style={{ color: colors.accent }}>
          {brand.supportEmail}
        </a>
        .
      </Text>

      <Button href={`${brand.siteUrl}/collections/all-items`}>Browse our cupcakes</Button>

      <Text variant="secondary" style={{ marginTop: 28 }}>
        Prefer to call? 03 9705 0051 · {brand.address}
      </Text>
    </Layout>
  )
}
