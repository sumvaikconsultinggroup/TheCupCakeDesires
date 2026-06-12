import { NextResponse } from 'next/server'
import { getStorefrontNav } from '@/lib/mega-menu'

export async function GET() {
  try {
    const nav = await getStorefrontNav()
    return NextResponse.json({ success: true, data: nav })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
