import { Column, Img, Row, Section } from '@react-email/components'
import * as React from 'react'

import { colors, fonts } from './tokens'

export interface OrderItem {
  name: string
  imageUrl?: string
  variantLabel?: string
  quantity: number
  unitPrice: number
  lineTotal?: number
  currency?: string
}

export interface OrderItemsTableProps {
  items: OrderItem[]
  currency?: string
}

function formatMoney(amount: number, currency: string): string {
  if (currency === 'AUD') return `$${amount.toFixed(2)}`
  return `${currency} ${amount.toFixed(2)}`
}

const wrap: React.CSSProperties = {
  margin: '8px 0 16px',
  borderTop: `1px solid ${colors.border}`,
}

const rowStyle: React.CSSProperties = {
  borderBottom: `1px solid ${colors.border}`,
}

const cellPad: React.CSSProperties = {
  padding: '14px 0',
  verticalAlign: 'top',
  fontFamily: fonts.sans,
}

const itemName: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '22px',
  color: colors.text,
  fontWeight: 600,
  margin: 0,
}

const itemMeta: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: colors.textMuted,
  margin: '2px 0 0',
}

const priceCell: React.CSSProperties = {
  ...cellPad,
  fontSize: '15px',
  lineHeight: '22px',
  color: colors.text,
  fontWeight: 600,
  textAlign: 'right' as const,
  whiteSpace: 'nowrap' as const,
}

export function OrderItemsTable({ items, currency = 'AUD' }: OrderItemsTableProps): React.ReactElement {
  return (
    <Section style={wrap}>
      {items.map((item, idx) => {
        const line = item.lineTotal ?? item.unitPrice * item.quantity
        return (
          <Row key={idx} style={rowStyle}>
            <Column style={{ ...cellPad, width: '64px' }}>
              {item.imageUrl ? (
                <Img
                  src={item.imageUrl}
                  alt={item.name}
                  width="56"
                  height="56"
                  style={{
                    display: 'block',
                    borderRadius: '6px',
                    objectFit: 'cover' as const,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : null}
            </Column>
            <Column style={{ ...cellPad, paddingLeft: '12px' }}>
              <p style={itemName}>{item.name}</p>
              {item.variantLabel ? <p style={itemMeta}>{item.variantLabel}</p> : null}
              <p style={itemMeta}>Qty {item.quantity}</p>
            </Column>
            <Column style={priceCell}>{formatMoney(line, item.currency || currency)}</Column>
          </Row>
        )
      })}
    </Section>
  )
}
