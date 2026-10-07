import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface LiveChatReplyEmailProps {
  name: string
  recipientEmail: string
  reply: string
  chatUrl: string
}

export function LiveChatReplyEmail({
  name,
  recipientEmail,
  reply,
  chatUrl,
}: LiveChatReplyEmailProps): React.ReactElement {
  const firstName = name.trim().split(/\s+/)[0] || name
  const preview = `New reply from The Cupcake Desire team`

  return (
    <Layout recipientEmail={recipientEmail} preview={preview} showUnsubscribe={false}>
      <Heading level={1}>You have a reply, {firstName}</Heading>
      <Text variant="lead">Our team answered your message on the website chat.</Text>

      <Text
        style={{
          backgroundColor: colors.bgSection,
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '8px 0 24px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {reply}
      </Text>

      <Button href={chatUrl}>Continue the chat</Button>

      <Text variant="secondary" style={{ marginTop: 28 }}>
        The chat link works in the same browser you used before. You can also reply to this email
        or write to {brand.supportEmail}.
      </Text>
    </Layout>
  )
}
