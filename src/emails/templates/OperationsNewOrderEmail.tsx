import * as React from 'react'

import { AddressBlock } from '@/emails/components/AddressBlock'
import { Button } from '@/emails/components/Button'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { OrderSummary } from '@/emails/components/OrderSummary'
import { Text } from '@/emails/components/Text'
import { colors } from '@/emails/components/tokens'

export interface OperationsNewOrderEmailProps {
  orderId: string
  orderDate: string
  /** "placed" (payment pending) or "confirmed" (paid). */
  stage: 'placed' | 'confirmed'
  customer: {
    name: string
    email: string
    phone?: string
  }
  items: OrderItem[]
  subtotal: number
  discount?: number
  shipping?: number
  tax?: number
  total: number
  currency?: string
  paymentMethod?: string
  paymentStatus?: string
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
  /** Customer-scheduled self-delivery details. */
  deliveryDate?: string
  deliveryWindow?: string
  deliveryInstructions?: string
  adminUrl: string
}

export function OperationsNewOrderEmail({
  orderId,
  orderDate,
  stage,
  customer,
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  currency = 'AUD',
  paymentMethod,
  paymentStatus,
  shippingAddress,
  deliveryDate,
  deliveryWindow,
  deliveryInstructions,
  adminUrl,
}: OperationsNewOrderEmailProps): React.ReactElement {
  const headline = stage === 'confirmed' ? `Paid order ${orderId}` : `New order ${orderId}`
  const preview = `${headline} — ${customer.name} — ${currency} ${total.toFixed(2)}`

  return (
    <Layout recipientEmail={undefined} preview={preview} showUnsubscribe={false}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        {stage === 'confirmed' ? 'PAID' : 'PLACED'} &middot; {orderDate}
      </Text>
      <Heading level={1}>{headline}</Heading>
      <Text variant="lead">
        {customer.name} &middot; {currency === 'AUD' ? `$${total.toFixed(2)}` : `${currency} ${total.toFixed(2)}`}
        {paymentMethod ? ` · ${paymentMethod.toUpperCase()}` : ''}
        {paymentStatus ? ` (${paymentStatus})` : ''}
      </Text>

      <Button href={adminUrl}>Open in admin</Button>

      <Divider />

      <Text variant="secondary">CUSTOMER</Text>
      <Text variant="body" style={{ margin: 0 }}>
        {customer.name}
      </Text>
      <Text variant="secondary" style={{ margin: 0 }}>
        {customer.email}
        {customer.phone ? ` · ${customer.phone}` : ''}
      </Text>

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

      {(deliveryDate || deliveryWindow || deliveryInstructions) ? (
        <>
          <Text variant="secondary" style={{ marginTop: 16 }}>
            DELIVERY
          </Text>
          {deliveryDate ? (
            <Text variant="body" style={{ margin: 0 }}>
              {deliveryDate}
              {deliveryWindow ? ` · ${deliveryWindow}` : ''}
            </Text>
          ) : deliveryWindow ? (
            <Text variant="body" style={{ margin: 0 }}>
              {deliveryWindow}
            </Text>
          ) : null}
          {deliveryInstructions ? (
            <Text variant="secondary" style={{ margin: 0, color: colors.textMuted }}>
              Instructions: {deliveryInstructions}
            </Text>
          ) : null}
        </>
      ) : null}

      <Text variant="secondary" style={{ marginTop: 16 }}>
        ITEMS
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
    </Layout>
  )
}

export default OperationsNewOrderEmail
