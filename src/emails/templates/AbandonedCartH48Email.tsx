import { Section } from '@react-email/components'
import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { Text } from '@/emails/components/Text'
import { colors } from '@/emails/components/tokens'

export interface AbandonedCartH48EmailProps {
  recipientEmail: string
  customerName?: string
  items: OrderItem[]
  cartTotal: number
  currency?: string
  resumeUrl: string
  promoCode: string
  discountPct: number
  expiresInDays?: number
}

export function AbandonedCartH48Email({
  recipientEmail,
  customerName,
  items,
  cartTotal,
  currency = 'AUD',
  resumeUrl,
  promoCode,
  discountPct,
  expiresInDays = 14,
}: AbandonedCartH48EmailProps): React.ReactElement {
  const name = customerName || 'there'
  const preview = `Last chance — ${discountPct}% off your cart with code ${promoCode}.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Heading level={1}>
        A {discountPct}% nudge, {name}.
      </Heading>
      <Text variant="lead">
        You&rsquo;ve been on our mind. Here&rsquo;s an exclusive code to help you cross the line.
      </Text>

      <Section
        style={{
          backgroundColor: colors.warningBg,
          border: `2px dashed ${colors.warning}`,
          borderRadius: 8,
          padding: '20px 18px',
          margin: '8px 0 20px',
          textAlign: 'center' as const,
        }}
      >
        <Text
          variant="caption"
          style={{
            color: colors.warning,
            fontWeight: 600,
            margin: 0,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
          }}
        >
          USE CODE AT CHECKOUT
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: colors.warning,
            margin: '6px 0',
            letterSpacing: '3px',
          }}
        >
          {promoCode}
        </Text>
        <Text variant="caption" style={{ color: colors.warning, margin: 0 }}>
          {discountPct}% off &middot; Expires in {expiresInDays} days
        </Text>
      </Section>

      <Button href={resumeUrl}>Apply discount &amp; checkout</Button>

      <Divider />

      <Text variant="secondary">YOUR CART</Text>
      <OrderItemsTable items={items} currency={currency} />

      <Text
        variant="body"
        style={{
          fontWeight: 600,
          fontSize: 16,
          margin: '4px 0 16px',
        }}
      >
        Total before discount: {currency === 'AUD' ? `$${cartTotal.toFixed(2)}` : `${currency} ${cartTotal.toFixed(2)}`}
      </Text>

      <Text variant="secondary">Single-use code. Cannot be combined with other offers.</Text>
    </Layout>
  )
}

export default AbandonedCartH48Email
