import connectDb from '@/lib/mongodb'
import FAQ from '@/models/FAQ'
import FAQCategory from '@/models/FAQCategory'

export type HomepageFaqCategory = {
  _id: string
  name: string
  order: number
}

export type HomepageFaqItem = {
  _id: string
  question: string
  answer: string
  order: number
  page?: string
  pageRef: string
  category: { _id: string; name?: string } | null
}

export type HomepageFaqsResult = {
  faqs: HomepageFaqItem[]
  categories: HomepageFaqCategory[]
}

/**
 * Same query + filters as GET /api/faqs?page=homepage (route.ts:15-80).
 * Returns plain serialisable objects for SSR.
 */
export async function getHomepageFaqs(): Promise<HomepageFaqsResult> {
  await connectDb()

  const faqQuery: Record<string, unknown> = {
    isActive: true,
    $or: [
      { page: 'homepage' },
      { page: { $exists: false } },
      { page: null },
      { page: '' },
    ],
  }

  const [categories, faqs] = await Promise.all([
    FAQCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
    FAQ.find(faqQuery).populate('category').sort({ order: 1, createdAt: -1 }).lean(),
  ])

  const activeCategories = categories.filter((c) => c.isActive !== false)

  const serializedCategories = activeCategories
    .filter((c) =>
      faqs.some((f) => {
        const cat = f.category as { _id?: unknown; isActive?: boolean } | null
        return cat && String(cat._id) === String(c._id) && cat.isActive !== false
      })
    )
    .map((c) => ({
      _id: String(c._id),
      name: c.name as string,
      order: c.order ?? 0,
    }))

  const serializedFaqs = faqs
    .filter((f) => {
      const cat = f.category as { isActive?: boolean } | null
      return cat && cat.isActive !== false
    })
    .map((f) => {
      const cat = f.category as { _id?: unknown; name?: string } | null
      return {
        _id: String(f._id),
        question: f.question as string,
        answer: f.answer as string,
        order: f.order ?? 0,
        page: f.page as string | undefined,
        pageRef: (f.pageRef as string) || '',
        category: cat
          ? {
              _id: String(cat._id),
              name: cat.name,
            }
          : null,
      }
    })

  return {
    categories: serializedCategories,
    faqs: serializedFaqs,
  }
}

/** Strip HTML to visible text for FAQPage JSON-LD parity with rendered answers. */
export function stripHtmlToText(html: string): string {
  const noTags = html.replace(/<[^>]+>/g, ' ')
  const decoded = noTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  return decoded.replace(/\s+/g, ' ').trim()
}
