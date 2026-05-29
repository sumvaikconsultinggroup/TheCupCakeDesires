import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Divider } from '@/emails/components/Divider'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { OrderItemsTable, type OrderItem } from '@/emails/components/OrderItemsTable'
import { Text } from '@/emails/components/Text'
import { brand } from '@/emails/components/tokens'

export interface AbandonedCartH0EmailProps {
  recipientEmail: string
  customerName?: string
  items: OrderItem[]
  cartTotal: number
  currency?: string
  resumeUrl: string
}

export function AbandonedCartH0Email({
  recipientEmail,
  customerName,
  items,
  cartTotal,
  currency = 'AUD',
  resumeUrl,
}: AbandonedCartH0EmailProps): React.ReactElement {
  const name = customerName || 'there'
  const preview = `You left ${items.length} item${items.length === 1 ? '' : 's'} in your cart — pick up where you left off.`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <Heading level={1}>Forgot something, {name}?</Heading>
      <Text variant="lead">
        You were one tap away from checkout. Your cart is still reserved — finish in under a minute.
      </Text>

      <Button href={resumeUrl}>Return to your cart</Button>

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
        Total: {currency === 'AUD' ? `$${cartTotal.toFixed(2)}` : `${currency} ${cartTotal.toFixed(2)}`}
      </Text>

      <Text variant="secondary">
        Stock isn&rsquo;t reserved indefinitely. Reply to this email if anything is unclear — we read every message at{' '}
        {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default AbandonedCartH0Email
