import { NextResponse } from 'next/server'

import { getCurrentUser, hasPermission } from '@/lib/auth'

/** Live chat lives under Customers, so it shares that permission. */
export async function requireLiveChatAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) }
  }
  if (!hasPermission(user, '/admin/customers')) {
    return { error: NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 }) }
  }
  return { user }
}
