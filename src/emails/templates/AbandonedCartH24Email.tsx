import { Section } from '@react-email/components'
import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { Text } from '@/emails/components/Text'
import { colors } from '@/emails/components/tokens'

export interface AbandonedCartH24EmailProps {
  recipientEmail: string
  customerName?: string
  items: OrderItem[]
  cartTotal: number
  currency?: string
  resumeUrl: string
  /** Optional social-proof line. */
  socialProof?: string
}

export function AbandonedCartH24Email({
  recipientEmail,
  customerName,
  items,
  cartTotal,
  currency = 'AUD',
  resumeUrl,
  socialProof = 'Trusted by thousands of cupcake lovers across Australia.',
}: AbandonedCartH24EmailProps): React.ReactElement {
  const name = customerName || 'there'
  const preview = `Still thinking it over? Your cart is waiting.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Heading level={1}>Still on the fence, {name}?</Heading>
      <Text variant="lead">
        Your cart is reserved for a little longer. Here&rsquo;s why customers keep coming back to CupCake Desires.
      </Text>

      <Section
        style={{
          backgroundColor: colors.brandLight,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '14px 18px',
          margin: '8px 0 20px',
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: '20px',
            color: colors.brand,
            fontWeight: 600,
          }}
        >
          {socialProof}
        </Text>
      </Section>

      <Button href={resumeUrl}>Resume checkout</Button>

      <Divider />

      <Text variant="secondary">STILL IN YOUR CART</Text>
      <OrderItemsTable items={items} currency={currency} />

      <Text
        variant="body"
        style={{
          fontWeight: 600,
          fontSize: 16,
          margin: '4px 0 16px',
        }}
      >
        Total: {currency === 'AUD' ? `$${cartTotal.toFixed(2)}` : `${currency} ${cartTotal.toFixed(2)}`}
      </Text>

      <Text variant="secondary">
        Free shipping on orders above $99. Baked fresh that morning. 100% pure ingredients, no preservatives.
      </Text>
    </Layout>
  )
}

export default AbandonedCartH24Email
