import * as React from 'react'

import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'

export interface MarketingBroadcastEmailProps {
  recipientEmail: string
  preview: string
  bodyHtml: string
}

export function MarketingBroadcastEmail({
  recipientEmail,
  preview,
  bodyHtml,
}: MarketingBroadcastEmailProps): React.ReactElement {
  return (
    <Layout recipientEmail={recipientEmail} preview={preview}>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Text variant="secondary" style={{ marginTop: 32, fontSize: '13px' }}>
        You are receiving this because you subscribed to The Wednesday letter from CupCake Desires.
      </Text>
    </Layout>
  )
}
