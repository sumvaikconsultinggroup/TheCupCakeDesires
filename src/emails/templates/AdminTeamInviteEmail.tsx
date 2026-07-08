import * as React from 'react'

import { Button } from '@/emails/components/Button'
import { Heading } from '@/emails/components/Heading'
import { Layout } from '@/emails/components/Layout'
import { Text } from '@/emails/components/Text'
import { brand, colors } from '@/emails/components/tokens'

export interface AdminTeamInviteEmailProps {
  recipientEmail: string
  inviteeName: string
  inviterName: string
  role: 'admin' | 'staff'
  temporaryPassword: string
  loginUrl: string
}

export function AdminTeamInviteEmail({
  recipientEmail,
  inviteeName,
  inviterName,
  role,
  temporaryPassword,
  loginUrl,
}: AdminTeamInviteEmailProps): React.ReactElement {
  const preview = `You've been added to the Cupcake Desire admin team as ${role}.`
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <Layout recipientEmail={recipientEmail} preview={preview} showUnsubscribe={false}>
      <Text variant="caption" style={{ color: colors.textMuted, marginBottom: 8 }}>
        ADMIN PANEL · INVITATION
      </Text>
      <Heading level={1}>Welcome to the team, {inviteeName}.</Heading>
      <Text variant="lead">
        {inviterName} has invited you to the Cupcake Desire admin panel as{' '}
        <strong>{roleLabel}</strong>. Use the credentials below to sign in — please change
        your password right after.
      </Text>

      <div
        style={{
          margin: '28px 0',
          padding: '20px 24px',
          backgroundColor: colors.bgPage,
          borderRadius: 12,
        }}
      >
        <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', fontSize: 14, color: colors.textMuted, width: 110 }}>
                Email
              </td>
              <td
                style={{
                  padding: '4px 0',
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {recipientEmail}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', fontSize: 14, color: colors.textMuted }}>
                Temp password
              </td>
              <td
                style={{
                  padding: '4px 0',
                  fontSize: 14,
                  color: colors.text,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                {temporaryPassword}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Button href={loginUrl}>Sign in to the admin panel</Button>

      <Text variant="secondary" style={{ marginTop: 24 }}>
        Once signed in, head to Settings → Forgot / change password and set a password you&rsquo;ll remember.
        If this invitation looks unexpected, write to {brand.supportEmail}.
      </Text>
    </Layout>
  )
}

export default AdminTeamInviteEmail
