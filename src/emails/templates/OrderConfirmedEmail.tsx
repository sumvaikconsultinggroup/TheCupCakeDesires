import * as React from 'react'

import { AddressBlock } from '@/emails/components/AddressBlock'
import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { OrderSummary } from '@/emails/components/OrderSummary'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface OrderConfirmedEmailProps {
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
  paymentMethod?: string
  orderTrackingUrl: string
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

export function OrderConfirmedEmail({
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
  paymentMethod,
  orderTrackingUrl,
  shippingAddress,
}: OrderConfirmedEmailProps): React.ReactElement {
  const preview = `Order ${orderId} confirmed — we are packing it now.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ORDER {orderId} &middot; {orderDate}
      </Text>
      <Heading level={1}>Thank you, {customerName}. Order confirmed.</Heading>
      <Text variant="lead">
        Your payment has been received and your order is being prepared for dispatch. You&rsquo;ll get another email
        with tracking the moment it ships.
      </Text>

      <Button href={orderTrackingUrl}>Track your order</Button>

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

      {paymentMethod ? (
        <Text variant="secondary">
          Payment: <strong>{paymentMethod}</strong>
        </Text>
      ) : null}

      {shippingAddress ? (
        <AddressBlock
          title="Shipping to"
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
        Need anything? Reply to this email or write to {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default OrderConfirmedEmail
