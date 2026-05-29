import { Text as RText } from '@react-email/components'
import * as React from 'react'

import { colors } from './tokens'

export interface TextProps {
  variant?: 'body' | 'secondary' | 'caption' | 'lead'
  children: React.ReactNode
  style?: React.CSSProperties
}

const styles: Record<NonNullable<TextProps['variant']>, React.CSSProperties> = {
  body: {
    fontSize: '16px',
    lineHeight: '26px',
    color: colors.text,
    margin: '0 0 12px',
  },
  secondary: {
    fontSize: '14px',
    lineHeight: '21px',
    color: colors.textMuted,
    margin: '0 0 8px',
  },
  caption: {
    fontSize: '12px',
    lineHeight: '18px',
    color: colors.textSubtle,
    margin: '0',
  },
  lead: {
    fontSize: '18px',
    lineHeight: '28px',
    color: colors.text,
    margin: '0 0 16px',
  },
}

export function Text({ variant = 'body', children, style }: TextProps): React.ReactElement {
  return (
    <RText style={{ ...styles[variant], ...style }} className="gibbon-text">
      {children}
    </RText>
  )
}
