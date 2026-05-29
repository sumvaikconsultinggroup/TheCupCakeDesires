import { Section } from '@react-email/components'
import * as React from 'react'

import { colors, fonts, radius } from './tokens'

export interface AddressBlockProps {
  title?: string
  name?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
}

const card: React.CSSProperties = {
  backgroundColor: colors.bgSection,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: '16px 18px',
  margin: '8px 0 16px',
  fontFamily: fonts.sans,
}

const titleStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '16px',
  color: colors.textMuted,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 6px',
}

const lineStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '21px',
  color: colors.text,
  margin: 0,
}

export function AddressBlock(props: AddressBlockProps): React.ReactElement {
  const cityLine = [props.city, props.state, props.postalCode].filter(Boolean).join(', ')
  return (
    <Section style={card}>
      {props.title ? <p style={titleStyle}>{props.title}</p> : null}
      {props.name ? <p style={{ ...lineStyle, fontWeight: 600 }}>{props.name}</p> : null}
      {props.line1 ? <p style={lineStyle}>{props.line1}</p> : null}
      {props.line2 ? <p style={lineStyle}>{props.line2}</p> : null}
      {cityLine ? <p style={lineStyle}>{cityLine}</p> : null}
      {props.country ? <p style={lineStyle}>{props.country}</p> : null}
      {props.phone ? <p style={{ ...lineStyle, color: colors.textMuted }}>{props.phone}</p> : null}
    </Section>
  )
}
