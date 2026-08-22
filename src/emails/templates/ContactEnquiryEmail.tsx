import * as React from 'react'

import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { colors } from '@/emails/components/tokens'

export interface ContactEnquiryEmailProps {
  name: string
  email: string
  phone?: string
  company?: string
  date?: string
  quantity?: string
  subject: string
  message: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '0 0 14px' }}>
      <span
        style={{
          display: 'block',
          fontSize: '11px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: colors.textSubtle,
          marginBottom: '2px',
        }}
      >
        {label}
      </span>
      <span style={{ color: colors.text }}>{value}</span>
    </Text>
  )
}

export function ContactEnquiryEmail({
  name,
  email,
  phone,
  company,
  date,
  quantity,
  subject,
  message,
}: ContactEnquiryEmailProps): React.ReactElement {
  const preview = `New enquiry from ${name}: ${subject}`

  return (
    <Layout preview={preview} showUnsubscribe={false}>
      <Heading level={1}>New website enquiry</Heading>
      <Text variant="secondary" style={{ marginBottom: 20 }}>
        {subject}
      </Text>

      <Field label="Name" value={name} />
      <Field label="Email" value={email} />
      {phone ? <Field label="Phone" value={phone} /> : null}
      {company ? <Field label="Company" value={company} /> : null}
      {date ? <Field label="Event / delivery date" value={date} /> : null}
      {quantity ? <Field label="Quantity" value={quantity} /> : null}

      <Text
        style={{
          backgroundColor: colors.bgSection,
          borderRadius: '8px',
          padding: '16px 20px',
          margin: '8px 0 0',
          whiteSpace: 'pre-wrap',
        }}
      >
        <strong style={{ color: colors.brand }}>Message</strong>
        <br />
        {message}
      </Text>

      <Text variant="caption" style={{ marginTop: 24 }}>
        Reply directly to this email to respond to {name}.
      </Text>
    </Layout>
  )
}
