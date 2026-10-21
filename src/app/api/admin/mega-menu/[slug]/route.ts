import { refreshEntireShopLayout } from '@/lib/revalidate-storefront'
import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/auth'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import MegaMenuConfig from '@/models/MegaMenuConfig'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import { serializeMegaMenu } from '@/lib/mega-menu'
import { isValidCustomHref, normalizeMenuTarget } from '@/lib/mega-menu-links'
import { uploadImageIfNeeded } from '@/lib/cloudinary-upload'
import type { MegaMenuColumn, MegaMenuFeaturedCard, MegaMenuSlug } from '@/types/mega-menu'

const VALID_SLUGS: MegaMenuSlug[] = ['event', 'cupcakes', 'cakes', 'macarons']
const MAX_COLUMNS = { 'columns-featured': 4, 'product-list': 3 } as const
const MAX_FEATURED = 3

interface RouteParams {
  params: Promise<{ slug: string }>
}

class MenuValidationError extends Error {}

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

function cleanText(value: unknown, max = 200) {
  return String(value ?? '').trim().slice(0, max)
}

function sanitizeColumns(raw: unknown, layout: keyof typeof MAX_COLUMNS): MegaMenuColumn[] {
  if (!Array.isArray(raw)) throw new MenuValidationError('Columns are missing')
  if (raw.length === 0) throw new MenuValidationError('Add at least one column')
  if (raw.length > MAX_COLUMNS[layout]) {
    throw new MenuValidationError(`This menu fits at most ${MAX_COLUMNS[layout]} columns`)
  }

  return raw.map((col: any, i: number) => {
    const heading = cleanText(col?.heading, 80)
    if (!heading) throw new MenuValidationError(`Column ${i + 1} needs a heading`)
    const links = (Array.isArray(col?.links) ? col.links : []).map((l: any) => {
      const link = normalizeMenuTarget({
        label: cleanText(l?.label, 120),
        href: cleanText(l?.href, 500),
        type: l?.type,
        collectionHandle: l?.collectionHandle ? cleanText(l.collectionHandle, 200) : undefined,
        productHandle: l?.productHandle ? cleanText(l.productHandle, 200) : undefined,
      })
      if (!link.label) throw new MenuValidationError(`A link in “${heading}” has no name`)
      if (link.type === 'custom' && !isValidCustomHref(link.href)) {
        throw new MenuValidationError(`“${link.label}” needs a URL starting with / or https://`)
      }
      return link
    })
    return { heading, links }
  })
}

async function sanitizeFeatured(raw: unknown): Promise<MegaMenuFeaturedCard[]> {
  if (!Array.isArray(raw)) return []
  if (raw.length > MAX_FEATURED) throw new MenuValidationError(`Up to ${MAX_FEATURED} featured cards`)

  const cards = raw.map((f: any) =>
    normalizeMenuTarget({
      title: cleanText(f?.title, 120),
      subtitle: cleanText(f?.subtitle, 160),
      href: cleanText(f?.href, 500),
      image: cleanText(f?.image, 1000),
      badge: cleanText(f?.badge, 40) || undefined,
      type: f?.type,
      collectionHandle: f?.collectionHandle ? cleanText(f.collectionHandle, 200) : undefined,
      productHandle: f?.productHandle ? cleanText(f.productHandle, 200) : undefined,
    })
  )

  return Promise.all(
    cards.map(async (card) => {
      if (!card.title) throw new MenuValidationError('Every featured card needs a title')
      if (card.type === 'custom' && !isValidCustomHref(card.href)) {
        throw new MenuValidationError(`“${card.title}” needs a URL starting with / or https://`)
      }
      let image = card.image ? await uploadImageIfNeeded(card.image, 'navigation/mega-menu') : ''
      if (!image) image = (await imageForCard(card)) || ''
      if (!image) throw new MenuValidationError(`“${card.title}” has no image — pick one with a photo`)
      return { ...card, image }
    })
  )
}

async function imageForCard(card: MegaMenuFeaturedCard): Promise<string | undefined> {
  const productImage = async (handle?: string) => {
    if (!handle) return undefined
    const p = (await Product.findOne({ handle }).select('images variants.image').lean()) as any
    return p?.images?.find((i: any) => i?.src)?.src || p?.variants?.find((v: any) => v?.image)?.image
  }
  if (card.type === 'product') return productImage(card.productHandle)
  if (card.type === 'collection') {
    const c = (await Collection.findOne({ handle: card.collectionHandle })
      .select('image thumbnailImage productHandles')
      .lean()) as any
    return c?.image || c?.thumbnailImage || (await productImage(c?.productHandles?.[0]))
  }
  return undefined
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
    const fallback = DEFAULT_MEGA_MENUS.find((m) => m.slug === slug)!
    const layout = fallback.layout

    const href = cleanText(body.href, 500) || fallback.href
    if (!isValidCustomHref(href)) {
      throw new MenuValidationError('“Shop all” link needs a URL starting with / or https://')
    }

    const columns = sanitizeColumns(body.columns ?? fallback.columns, layout)
    const featured = layout === 'columns-featured' ? await sanitizeFeatured(body.featured) : []
    const heroImage = body.heroImage
      ? await uploadImageIfNeeded(cleanText(body.heroImage, 1000), 'navigation/mega-menu')
      : fallback.heroImage

    const update = {
      slug,
      label: cleanText(body.label, 40) || fallback.label,
      href,
      layout,
      columnLayout: layout === 'columns-featured' ? (Math.min(4, Math.max(2, columns.length)) as 2 | 3 | 4) : undefined,
      description: cleanText(body.description, 600),
      columns,
      featured,
      heroImage,
      heroImageAlt: cleanText(body.heroImageAlt, 160) || fallback.heroImageAlt,
      isActive: body.isActive ?? true,
      position: body.position ?? fallback.position,
    }

    const doc = await MegaMenuConfig.findOneAndUpdate(
      { slug },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    ).lean()

    // Header is baked into every cached page — rare admin action, full layout OK.
    refreshEntireShopLayout()

    return NextResponse.json({
      success: true,
      data: serializeMegaMenu(doc as Record<string, unknown>),
    })
  } catch (error: unknown) {
    if (error instanceof MenuValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
