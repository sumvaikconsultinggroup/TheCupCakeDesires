import { Button as RButton } from '@react-email/components'
import * as React from 'react'

import { colors } from './tokens'

export interface ButtonProps {
  href: string
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Button({ href, variant = 'primary', children, style }: ButtonProps): React.ReactElement {
  const base: React.CSSProperties = {
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-block',
    boxSizing: 'border-box',
  }

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { backgroundColor: colors.brand, color: '#FFFFFF' }
      : {
          backgroundColor: '#FFFFFF',
          color: colors.brand,
          border: `1px solid ${colors.brand}`,
        }

  return (
    <RButton href={href} style={{ ...base, ...variantStyle, ...style }} className="gibbon-btn">
      {children}
    </RButton>
  )
}
