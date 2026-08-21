import JsonLd from '@/components/SE0/JsonLd'
import { getAllFaqPageItems, stripHtml } from '@/data/faq-page-content'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import FaqPageClient from './FaqPageClient'

export default function FaqPage() {
  const allFaqs = getAllFaqPageItems().map((item) => ({
    question: item.question,
    answer: stripHtml(item.answer),
  }))

  const faqSchema = generateFAQSchema(allFaqs)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'FAQ', url: `${siteConfig.url}/faq` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <FaqPageClient />
    </>
  )
}
