import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import FAQ from '@/models/FAQ'
import FAQCategory from '@/models/FAQCategory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const page = request.nextUrl.searchParams.get('page') || 'homepage'
    const pageRef = request.nextUrl.searchParams.get('ref') || ''

    const faqQuery: Record<string, unknown> = { isActive: true }
    if (page === 'homepage') {
      faqQuery.$or = [
        { page: 'homepage' },
        { page: { $exists: false } },
        { page: null },
        { page: '' },
      ]
    } else {
      faqQuery.page = page
    }
    if (pageRef) {
      faqQuery.pageRef = pageRef
    } else if (page === 'collection' || page === 'product') {
      return NextResponse.json({
        success: true,
        data: { categories: [], faqs: [] },
      })
    }

    const [categories, faqs] = await Promise.all([
      FAQCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
      FAQ.find(faqQuery).populate('category').sort({ order: 1, createdAt: -1 }).lean(),
    ])

    const activeCategories = categories.filter((c) => c.isActive !== false)

    const serializedCategories =
      page === 'homepage'
        ? activeCategories
            .filter((c) =>
              faqs.some((f) => {
                const cat = f.category as { _id?: unknown; isActive?: boolean } | null
                return cat && String(cat._id) === String(c._id) && cat.isActive !== false
              })
            )
            .map((c) => ({
              _id: String(c._id),
              name: c.name,
              order: c.order ?? 0,
            }))
        : []

    const serializedFaqs = faqs
      .filter((f) => {
        if (page !== 'homepage') return true
        const cat = f.category as { isActive?: boolean } | null
        return cat && cat.isActive !== false
      })
      .map((f) => {
        const cat = f.category as { _id?: unknown; name?: string } | null
        return {
          _id: String(f._id),
          question: f.question,
          answer: f.answer,
          order: f.order ?? 0,
          page: f.page,
          pageRef: f.pageRef || '',
          category: cat
            ? {
                _id: String(cat._id),
                name: cat.name,
              }
            : null,
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        categories: serializedCategories,
        faqs: serializedFaqs,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching FAQs:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
