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

/** Replace em/en dashes with ', '; collapse double spaces and ', ,'. Display only; DB untouched. */
export function sanitizeFaqCopy(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/ {2,}/g, ' ')
    .trim()
}

function normaliseQuestion(q: string): string {
  return q.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Server-side cleanup for homepage FAQs before render (HTML + JSON-LD).
 * Does not write back to Mongo.
 */
export function cleanupHomepageFaqs(faqs: HomepageFaqItem[]): HomepageFaqItem[] {
  const seen = new Set<string>()
  const out: HomepageFaqItem[] = []
  for (const f of faqs) {
    if (/how fresh/i.test(f.question)) continue
    const key = normaliseQuestion(f.question)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      ...f,
      question: sanitizeFaqCopy(f.question),
      answer: sanitizeFaqCopy(f.answer),
    })
  }
  return out
}

/**
 * Same query + filters as GET /api/faqs?page=homepage (route.ts:15-80).
 * Returns plain serialisable objects for SSR, with display-only cleanup applied.
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

  const serializedFaqs = cleanupHomepageFaqs(
    faqs
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
  )

  const serializedCategories = activeCategories
    .filter((c) =>
      serializedFaqs.some((f) => f.category && String(f.category._id) === String(c._id))
    )
    .map((c) => ({
      _id: String(c._id),
      name: c.name as string,
      order: c.order ?? 0,
    }))

  return {
    categories: serializedCategories,
    faqs: serializedFaqs,
  }
}

/** Strip HTML to visible text for FAQPage JSON-LD parity with rendered answers. */
export function stripHtmlToText(html: string): string {
  // Remove tags without inserting spaces so "box of 12</p>." stays "box of 12."
  const noTags = html.replace(/<[^>]+>/g, '')
  const decoded = noTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rdquo;/gi, '\u201D')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
  return decoded.replace(/\s+/g, ' ').trim()
}
