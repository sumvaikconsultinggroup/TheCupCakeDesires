import { Column, Row, Section } from '@react-email/components'
import * as React from 'react'

import { colors, fonts } from './tokens'

export interface OrderSummaryProps {
  subtotal: number
  discount?: number
  shipping?: number
  tax?: number
  total: number
  currency?: string
}

function formatMoney(amount: number, currency: string): string {
  if (currency === 'AUD') return `$${amount.toFixed(2)}`
  return `${currency} ${amount.toFixed(2)}`
}

const wrap: React.CSSProperties = {
  margin: '8px 0 24px',
}

const labelCell: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  color: colors.textMuted,
  padding: '6px 0',
  fontFamily: fonts.sans,
}

const valueCell: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  color: colors.text,
  padding: '6px 0',
  textAlign: 'right' as const,
  fontFamily: fonts.sans,
}

const totalLabel: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: colors.text,
  padding: '12px 0',
  fontWeight: 600,
  borderTop: `1px solid ${colors.border}`,
  fontFamily: fonts.sans,
}

const totalValue: React.CSSProperties = {
  ...totalLabel,
  textAlign: 'right' as const,
  color: colors.brand,
}

export function OrderSummary({
  subtotal,
  discount,
  shipping,
  tax,
  total,
  currency = 'AUD',
}: OrderSummaryProps): React.ReactElement {
  return (
    <Section style={wrap}>
      <Row>
        <Column style={labelCell}>Subtotal</Column>
        <Column style={valueCell}>{formatMoney(subtotal, currency)}</Column>
      </Row>
      {discount && discount > 0 ? (
        <Row>
          <Column style={labelCell}>Discount</Column>
          <Column style={{ ...valueCell, color: colors.success }}>-{formatMoney(discount, currency)}</Column>
        </Row>
      ) : null}
      {typeof shipping === 'number' ? (
        <Row>
          <Column style={labelCell}>Shipping</Column>
          <Column style={valueCell}>{shipping === 0 ? 'Free' : formatMoney(shipping, currency)}</Column>
        </Row>
      ) : null}
      {tax && tax > 0 ? (
        <Row>
          <Column style={labelCell}>Tax</Column>
          <Column style={valueCell}>{formatMoney(tax, currency)}</Column>
        </Row>
      ) : null}
      <Row>
        <Column style={totalLabel}>Total</Column>
        <Column style={totalValue}>{formatMoney(total, currency)}</Column>
      </Row>
    </Section>
  )
}
