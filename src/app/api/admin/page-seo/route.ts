import connectDb from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ADMIN_SEO_PAGES } from '@/lib/storefront-pages'
import PageSEO from '@/models/PageSEO'
import { NextRequest, NextResponse } from 'next/server'

const AVAILABLE_PAGES = ADMIN_SEO_PAGES

async function assertSeoAccess() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, status: 401, message: 'Unauthorized' }
  if (user.role !== 'owner' && !user.permissions?.includes('/admin/seo')) {
    return { ok: false as const, status: 403, message: "You don't have access to SEO settings." }
  }
  return { ok: true as const }
}

// GET - Fetch all pages with their SEO settings
export async function GET(req: NextRequest) {
  try {
    const access = await assertSeoAccess()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status })
    }

    await connectDb()

    // Fetch all existing page SEO settings
    const existingPages = await PageSEO.find({}).lean()
    const existingMap = new Map(existingPages.map((p: any) => [p.pageId, p]))

    // Merge with available pages (ensure all pages are present)
    const allPages = AVAILABLE_PAGES.map((page) => {
      const existing = existingMap.get(page.pageId)
      if (existing) {
        return {
          ...existing,
          _id: existing._id.toString(),
        }
      }
      // Return default settings for pages not yet in DB
      return {
        pageId: page.pageId,
        pageName: page.pageName,
        path: page.path,
        robots: {
          index: true,
          follow: true,
          noarchive: false,
          nosnippet: false,
          noimageindex: false,
        },
        canonical: '',
      }
    })

    return NextResponse.json({ success: true, pages: allPages })
  } catch (error) {
    console.error('Error fetching page SEO:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch page SEO' }, { status: 500 })
  }
}

// PATCH - Update SEO settings for a specific page
export async function PATCH(req: NextRequest) {
  try {
    const access = await assertSeoAccess()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status })
    }

    await connectDb()

    const body = await req.json()
    const { pageId, robots, canonical } = body

    if (!pageId) {
      return NextResponse.json({ success: false, message: 'pageId is required' }, { status: 400 })
    }

    // Find the page definition
    const pageDefinition = AVAILABLE_PAGES.find((p) => p.pageId === pageId)
    if (!pageDefinition) {
      return NextResponse.json({ success: false, message: 'Invalid page ID' }, { status: 400 })
    }

    // Update or create page SEO settings
    const updateData: any = {}
    if (robots) updateData.robots = robots
    if (canonical !== undefined) updateData.canonical = canonical

    const pageSEO = await PageSEO.findOneAndUpdate(
      { pageId },
      {
        ...updateData,
        pageId,
        pageName: pageDefinition.pageName,
        path: pageDefinition.path,
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, page: pageSEO })
  } catch (error) {
    console.error('Error updating page SEO:', error)
    return NextResponse.json({ success: false, message: 'Failed to update page SEO' }, { status: 500 })
  }
}

// GET individual page SEO by pageId (for frontend consumption)
export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const body = await req.json()
    const { pageId } = body

    if (!pageId) {
      return NextResponse.json({ success: false, message: 'pageId is required' }, { status: 400 })
    }

    const pageSEO = await PageSEO.findOne({ pageId }).lean() as any

    if (!pageSEO) {
      // Return defaults if not found
      const pageDefinition = AVAILABLE_PAGES.find((p) => p.pageId === pageId)
      return NextResponse.json({
        success: true,
        page: {
          pageId,
          robots: { index: true, follow: true },
          canonical: pageDefinition?.path || '',
        },
      })
    }

    return NextResponse.json({
      success: true,
      page: {
        ...pageSEO,
        _id: pageSEO._id.toString(),
      },
    })
  } catch (error) {
    console.error('Error fetching page SEO:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch page SEO' }, { status: 500 })
  }
}
