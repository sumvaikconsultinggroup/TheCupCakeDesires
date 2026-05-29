import { Hr } from '@react-email/components'
import * as React from 'react'

import { colors } from './tokens'

export interface DividerProps {
  style?: React.CSSProperties
}

export function Divider({ style }: DividerProps): React.ReactElement {
  return (
    <Hr
      style={{
        borderColor: colors.border,
        borderTopWidth: '1px',
        margin: '24px 0',
        ...style,
      }}
    />
  )
}
