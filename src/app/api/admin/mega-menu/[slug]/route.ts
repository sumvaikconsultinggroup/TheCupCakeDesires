import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/auth'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import MegaMenuConfig from '@/models/MegaMenuConfig'
import { serializeMegaMenu } from '@/lib/mega-menu'
import { uploadImageIfNeeded } from '@/lib/cloudinary-upload'
import type { MegaMenuSlug } from '@/types/mega-menu'

const VALID_SLUGS: MegaMenuSlug[] = ['event', 'cupcakes', 'cakes', 'macarons']

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { slug } = await params
    if (!VALID_SLUGS.includes(slug as MegaMenuSlug)) {
      return NextResponse.json({ success: false, error: 'Invalid menu slug' }, { status: 400 })
    }

    await connectDb()
    const doc = await MegaMenuConfig.findOne({ slug }).lean()
    const fallback = DEFAULT_MEGA_MENUS.find((m) => m.slug === slug)
    if (!doc && !fallback) {
      return NextResponse.json({ success: false, error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: doc ? serializeMegaMenu(doc as Record<string, unknown>) : fallback,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { slug } = await params
    if (!VALID_SLUGS.includes(slug as MegaMenuSlug)) {
      return NextResponse.json({ success: false, error: 'Invalid menu slug' }, { status: 400 })
    }

    await connectDb()
    const body = await request.json()

    if (body.heroImage) {
      body.heroImage = await uploadImageIfNeeded(body.heroImage, 'navigation/mega-menu')
    }

    if (Array.isArray(body.featured)) {
      body.featured = await Promise.all(
        body.featured.map(async (card: { image?: string }) => ({
          ...card,
          image: card.image
            ? await uploadImageIfNeeded(card.image, 'navigation/mega-menu')
            : card.image,
        }))
      )
    }

    const fallback = DEFAULT_MEGA_MENUS.find((m) => m.slug === slug)!
    const update = {
      slug,
      label: body.label ?? fallback.label,
      href: body.href ?? fallback.href,
      layout: body.layout ?? fallback.layout,
      columnLayout: body.columnLayout ?? fallback.columnLayout,
      description: body.description ?? '',
      columns: body.columns ?? fallback.columns,
      featured: body.featured ?? fallback.featured,
      heroImage: body.heroImage ?? fallback.heroImage,
      heroImageAlt: body.heroImageAlt ?? fallback.heroImageAlt,
      isActive: body.isActive ?? true,
      position: body.position ?? fallback.position,
    }

    const doc = await MegaMenuConfig.findOneAndUpdate(
      { slug },
      { $set: update },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json({
      success: true,
      data: serializeMegaMenu(doc as Record<string, unknown>),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
