import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/auth'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import MegaMenuConfig from '@/models/MegaMenuConfig'
import { serializeMegaMenu } from '@/lib/mega-menu'

export async function GET() {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const docs = await MegaMenuConfig.find().sort({ position: 1 }).lean()
    const bySlug = new Map(docs.map((d) => [d.slug, d]))

    const data = DEFAULT_MEGA_MENUS.map((def) => {
      const stored = bySlug.get(def.slug)
      return stored ? serializeMegaMenu(stored as Record<string, unknown>) : def
    })

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const body = await request.json()

    if (body.action === 'seed') {
      for (const menu of DEFAULT_MEGA_MENUS) {
        await MegaMenuConfig.findOneAndUpdate(
          { slug: menu.slug },
          { $setOnInsert: menu },
          { upsert: true, new: true }
        )
      }
      const docs = await MegaMenuConfig.find().sort({ position: 1 }).lean()
      return NextResponse.json({
        success: true,
        message: 'Mega menus seeded',
        data: docs.map((d) => serializeMegaMenu(d as Record<string, unknown>)),
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
