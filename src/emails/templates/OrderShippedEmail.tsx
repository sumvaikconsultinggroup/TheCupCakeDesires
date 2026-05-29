import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface OrderShippedEmailProps {
  recipientEmail: string
  customerName: string
  orderId: string
  items: OrderItem[]
  carrier: string
  trackingNumber: string
  trackingUrl: string
  estimatedDelivery?: string
  currency?: string
}

export function OrderShippedEmail({
  recipientEmail,
  customerName,
  orderId,
  items,
  carrier,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  currency = 'AUD',
}: OrderShippedEmailProps): React.ReactElement {
  const preview = `Order ${orderId} is on the way — track via ${carrier}.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ORDER {orderId}
      </Text>
      <Heading level={1}>Your order is on the way, {customerName}.</Heading>
      <Text variant="lead">
        Great news — order {orderId} has shipped via {carrier}.
        {estimatedDelivery ? ` Estimated delivery: ${estimatedDelivery}.` : ''}
      </Text>

      <div
        style={{
          backgroundColor: colors.bgSection,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '16px 18px',
          margin: '8px 0 20px',
        }}
      >
        <Text variant="caption" style={{ marginBottom: 4 }}>
          TRACKING NUMBER
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          {trackingNumber}
        </Text>
      </div>

      <Button href={trackingUrl}>Track package</Button>

      <Divider />

      <Text variant="secondary">SHIPPED ITEMS</Text>
      <OrderItemsTable items={items} currency={currency} />

      <Text variant="secondary" style={{ marginTop: 16 }}>
        Questions about delivery? Reply to this email or write to {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default OrderShippedEmail
