import { Heading as RHeading } from '@react-email/components'
import * as React from 'react'

import { colors } from './tokens'

type Level = 1 | 2 | 3

export interface HeadingProps {
  level?: Level
  children: React.ReactNode
  style?: React.CSSProperties
}

const styles: Record<Level, React.CSSProperties> = {
  1: { fontSize: '32px', lineHeight: '40px', fontWeight: 600, margin: '0 0 16px' },
  2: { fontSize: '24px', lineHeight: '32px', fontWeight: 600, margin: '0 0 12px' },
  3: { fontSize: '20px', lineHeight: '28px', fontWeight: 600, margin: '0 0 8px' },
}

export function Heading({ level = 1, children, style }: HeadingProps): React.ReactElement {
  return (
    <RHeading
      as={`h${level}` as 'h1' | 'h2' | 'h3'}
      style={{ color: colors.text, ...styles[level], ...style }}
      className="gibbon-text"
    >
      {children}
    </RHeading>
  )
}
