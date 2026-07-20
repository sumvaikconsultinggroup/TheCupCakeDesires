import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import * as React from 'react'

import { buildUnsubscribeUrl } from '@/lib/email/unsubscribe-token'

import { brand, colors, fonts } from './tokens'

export interface LayoutProps {
  recipientEmail?: string
  preview: string
  showUnsubscribe?: boolean
  children: React.ReactNode
}

const main = {
  backgroundColor: colors.bgPage,
  fontFamily: fonts.sans,
  margin: 0,
  padding: 0,
}

const container = {
  backgroundColor: colors.bg,
  margin: '0 auto',
  padding: 0,
  maxWidth: '600px',
  width: '100%',
}

const brandBar = {
  backgroundColor: colors.bg,
  padding: '26px 32px',
  textAlign: 'center' as const,
  borderBottom: `1px solid ${colors.border}`,
}

const wordmark = {
  margin: 0,
  fontFamily: fonts.serif,
  fontSize: '26px',
  lineHeight: '30px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: colors.text,
}

const innerSection = {
  padding: '32px 32px 8px',
}

const footerSection = {
  padding: '0 32px 32px',
}

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: colors.textMuted,
  margin: '4px 0',
}

const footerLink = {
  color: colors.textMuted,
  textDecoration: 'underline',
}

export function Layout({ recipientEmail, preview, showUnsubscribe = true, children }: LayoutProps): React.ReactElement {
  const unsubscribeUrl = recipientEmail ? buildUnsubscribeUrl(recipientEmail) : null

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <style>{`
                    @media (prefers-color-scheme: dark) {
                        body, .gibbon-bg { background-color: ${colors.bgPage} !important; }
                        .gibbon-card { background-color: ${colors.bg} !important; }
                        .gibbon-text { color: ${colors.text} !important; }
                    }
                    @media only screen and (max-width: 600px) {
                        .gibbon-pad { padding-left: 20px !important; padding-right: 20px !important; }
                        .gibbon-btn { width: 100% !important; box-sizing: border-box; }
                    }
                `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main} className="gibbon-bg">
        <Container style={container} className="gibbon-card">
          <Section style={brandBar}>
            {/* Text wordmark + cupcake glyph — always renders (no broken image).
                Swap in an <Img src={brand.logoUrl} /> once the logo is hosted. */}
            <Text style={wordmark}>
              <span style={{ fontSize: '24px' }}>&#127850;</span>&nbsp;The Cupcake{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: colors.accent }}>Desire</span>
            </Text>
          </Section>

          <Section style={innerSection} className="gibbon-pad">
            {children}
          </Section>

          <Hr
            style={{
              borderColor: colors.border,
              margin: '0 32px',
            }}
          />

          <Section style={footerSection} className="gibbon-pad">
            <Text style={{ ...footerText, marginTop: '24px' }}>{brand.name}</Text>
            <Text style={footerText}>{brand.address}</Text>
            <Text style={footerText}>
              Need help?{' '}
              <Link href={`mailto:${brand.supportEmail}`} style={footerLink}>
                {brand.supportEmail}
              </Link>{' '}
              &middot;{' '}
              <Link href={brand.siteUrl} style={footerLink}>
                Visit shop
              </Link>
            </Text>
            {showUnsubscribe && unsubscribeUrl ? (
              <Text style={{ ...footerText, marginTop: '12px' }}>
                You are receiving this because you have an account or active cart with {brand.name}.{' '}
                <Link href={unsubscribeUrl} style={footerLink}>
                  Unsubscribe
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
