import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { OrderSummary } from '@/emails/components/OrderSummary'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface PaymentLinkEmailProps {
  recipientEmail: string
  customerName: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  shipping?: number
  total: number
  currency?: string
  /** Stripe Payment Link for this phone or email order. */
  paymentUrl: string
}

export function PaymentLinkEmail({
  recipientEmail,
  customerName,
  orderId,
  items,
  subtotal,
  shipping,
  total,
  currency = 'AUD',
  paymentUrl,
}: PaymentLinkEmailProps): React.ReactElement {
  return (
    <Layout recipientEmail={recipientEmail} preview={`Pay for order ${orderId}`}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ORDER {orderId}
      </Text>
      <Heading level={1}>Your payment link is ready, {customerName}.</Heading>
      <Text variant="lead">
        The shop has taken your order. Use the button below to pay by card. Once the payment clears, we email your
        confirmation and tax invoice.
      </Text>

      <Button href={paymentUrl}>Pay for this order</Button>

      <Text variant="secondary" style={{ marginTop: 32, marginBottom: 8 }}>
        ORDER SUMMARY
      </Text>
      <OrderItemsTable items={items} currency={currency} />
      <OrderSummary subtotal={subtotal} shipping={shipping} total={total} currency={currency} />

      <Text variant="secondary" style={{ marginTop: 24 }}>
        Questions? Reply to this email or write to us at {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default PaymentLinkEmail
