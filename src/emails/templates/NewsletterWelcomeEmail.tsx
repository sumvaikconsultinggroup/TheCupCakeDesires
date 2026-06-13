import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface NewsletterWelcomeEmailProps {
  recipientEmail: string
}

export function NewsletterWelcomeEmail({ recipientEmail }: NewsletterWelcomeEmailProps): React.ReactElement {
  const preview = "You're in — The Wednesday letter starts with a sweet welcome."

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Heading level={1}>Welcome to The Wednesday letter</Heading>
      <Text variant="lead">
        Congratulations — you&rsquo;re officially subscribed. Every Wednesday we&rsquo;ll send one thoughtful note:
        what we&rsquo;re baking, what&rsquo;s new on the board, and a fresh discount for subscribers.
      </Text>

      <Text
        style={{
          backgroundColor: colors.bgSection,
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '24px 0',
        }}
      >
        <strong style={{ color: colors.brand }}>Your subscriber perk:</strong> 10% off your first order. Watch
        your inbox — your code arrives in an upcoming letter, or shop now and mention you&rsquo;re a new subscriber
        when you contact us.
      </Text>

      <Button href={`${brand.siteUrl}/collections/all-items`}>Browse the bakery</Button>

      <Text variant="secondary" style={{ marginTop: 32 }}>
        What to expect
      </Text>
      <Text>
        <strong>Once a week, no spam.</strong> Seasonal flavours, early access to new drops, and gifting ideas from
        our Narre Warren kitchen.
      </Text>
      <Text style={{ marginTop: 16 }}>
        Changed your mind? Use the unsubscribe link below — no hard feelings, and order updates still reach you if
        you have an active order.
      </Text>
    </Layout>
  )
}
