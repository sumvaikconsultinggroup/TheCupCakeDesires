import FAQ from '@/models/FAQ'
import FAQCategory from '@/models/FAQCategory'
import { DEFAULT_FAQ_CATEGORIES, DEFAULT_FAQS } from '@/data/faq-defaults'

export async function seedFaqs() {
  const categoryMap = new Map<string, string>()

  for (const cat of DEFAULT_FAQ_CATEGORIES) {
    const existing = await FAQCategory.findOne({ name: cat.name })
    if (existing) {
      categoryMap.set(cat.name, String(existing._id))
      await FAQCategory.updateOne({ _id: existing._id }, { $set: { order: cat.order, isActive: true } })
    } else {
      const created = await FAQCategory.create({ name: cat.name, order: cat.order, isActive: true })
      categoryMap.set(cat.name, String(created._id))
    }
  }

  let created = 0
  let skipped = 0

  for (const item of DEFAULT_FAQS) {
    const categoryId = item.category ? categoryMap.get(item.category) : undefined

    const exists = await FAQ.findOne({
      page: item.page,
      pageRef: item.pageRef || '',
      question: item.question,
    })
    if (exists) {
      skipped++
      continue
    }

    await FAQ.create({
      question: item.question,
      answer: item.answer,
      page: item.page,
      pageRef: item.pageRef || '',
      order: item.order,
      isActive: true,
      ...(categoryId ? { category: categoryId } : {}),
    })
    created++
  }

  return { created, skipped, total: DEFAULT_FAQS.length }
}
