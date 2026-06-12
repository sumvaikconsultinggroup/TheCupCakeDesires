import * as React from 'react'

import { AddressBlock } from '@/emails/components/AddressBlock'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface OrderOutForDeliveryEmailProps {
  recipientEmail: string
  customerName: string
  orderId: string
  items: OrderItem[]
  /** Human-readable delivery window — e.g. "between 2 and 4 PM". */
  deliveryWindow?: string
  /** Optional free-form note from the kitchen / driver. */
  deliveryNote?: string
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
  currency?: string
}

export function OrderOutForDeliveryEmail({
  recipientEmail,
  customerName,
  orderId,
  items,
  deliveryWindow,
  deliveryNote,
  shippingAddress,
  currency = 'AUD',
}: OrderOutForDeliveryEmailProps): React.ReactElement {
  const preview = `Your CupCake Desires order ${orderId} is out for delivery.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ORDER {orderId}
      </Text>
      <Heading level={1}>The box is on its way, {customerName}.</Heading>
      <Text variant="lead">
        Our driver has just left the Narre Warren kitchen with your hand-frosted box.
        {deliveryWindow ? ` Expect it ${deliveryWindow}.` : ' Keep an eye on the door.'}
      </Text>

      {deliveryNote ? (
        <div
          style={{
            backgroundColor: colors.bgSection,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '14px 18px',
            margin: '8px 0 20px',
          }}
        >
          <Text variant="caption" style={{ marginBottom: 4 }}>
            FROM OUR DRIVER
          </Text>
          <Text style={{ margin: 0, color: colors.text }}>{deliveryNote}</Text>
        </div>
      ) : null}

      <Divider />

      <Text variant="secondary">YOUR ORDER</Text>
      <OrderItemsTable items={items} currency={currency} />

      {shippingAddress ? (
        <AddressBlock
          title="Delivering to"
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
        Something off with the delivery? Reply to this email or text {brand.supportEmail}
        and we&rsquo;ll sort it.
      </Text>
    </Layout>
  )
}

export default OrderOutForDeliveryEmail
