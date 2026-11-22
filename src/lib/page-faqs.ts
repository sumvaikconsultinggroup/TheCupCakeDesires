import connectDb from '@/lib/mongodb'
import FAQ from '@/models/FAQ'

export type PageFaqItem = {
  _id: string
  question: string
  answer: string
  order?: number
  category?: { _id: string; name: string } | null
}

/**
 * Same query as GET /api/faqs?page=&ref= (non-homepage pages).
 * Returns [] on an empty list, a missing page, or a database error so the
 * storefront can omit the accordion instead of throwing a 500.
 */
export async function getPageFaqs(page: string, pageRef = ''): Promise<PageFaqItem[]> {
  try {
    if ((page === 'collection' || page === 'product') && !pageRef) {
      return []
    }

    await connectDb()

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
    if (pageRef) faqQuery.pageRef = pageRef

    const faqs = await FAQ.find(faqQuery)
      .populate('category')
      .sort({ order: 1, createdAt: -1 })
      .lean()

    return faqs
      .map((f) => {
        const cat = f.category as { _id?: unknown; name?: string } | null
        return {
          _id: String(f._id),
          question: String(f.question ?? ''),
          answer: String(f.answer ?? ''),
          order: f.order ?? 0,
          category: cat
            ? {
                _id: String(cat._id),
                name: String(cat.name ?? ''),
              }
            : null,
        }
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('getPageFaqs failed', { page, pageRef, message })
    return []
  }
}
