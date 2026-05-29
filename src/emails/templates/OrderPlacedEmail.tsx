import * as React from 'react'

import { AddressBlock } from '@/emails/components/AddressBlock'
import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { OrderSummary } from '@/emails/components/OrderSummary'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface OrderPlacedEmailProps {
  recipientEmail: string
  customerName: string
  orderId: string
  orderDate: string
  items: OrderItem[]
  subtotal: number
  discount?: number
  shipping?: number
  tax?: number
  total: number
  currency?: string
  paymentUrl: string
  shippingAddress?: {
    name?: string
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phone?: string
  }
}

export function OrderPlacedEmail({
  recipientEmail,
  customerName,
  orderId,
  orderDate,
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  currency = 'AUD',
  paymentUrl,
  shippingAddress,
}: OrderPlacedEmailProps): React.ReactElement {
  const preview = `Order ${orderId} received — complete payment to confirm.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ORDER {orderId} &middot; {orderDate}
      </Text>
      <Heading level={1}>We&rsquo;ve got your order, {customerName}.</Heading>
      <Text variant="lead">
        Your order is reserved. Complete payment to confirm and we&rsquo;ll start packing right away.
      </Text>

      <Button href={paymentUrl}>Complete payment</Button>

      <Text variant="secondary" style={{ marginTop: 32, marginBottom: 8 }}>
        ORDER SUMMARY
      </Text>
      <OrderItemsTable items={items} currency={currency} />
      <OrderSummary
        subtotal={subtotal}
        discount={discount}
        shipping={shipping}
        tax={tax}
        total={total}
        currency={currency}
      />

      {shippingAddress ? (
        <AddressBlock
          title="Ship to"
          name={shippingAddress.name}
          line1={shippingAddress.line1}
          line2={shippingAddress.line2}
          city={shippingAddress.city}
          state={shippingAddress.state}
          postalCode={shippingAddress.postalCode}
          country={shippingAddress.country}
          phone={shippingAddress.phone}
        />
      ) : null}

      <Text variant="secondary" style={{ marginTop: 24 }}>
        Questions? Reply to this email or write to us at {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default OrderPlacedEmail
