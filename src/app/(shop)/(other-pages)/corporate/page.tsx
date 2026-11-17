import { getPageFaqs } from '@/lib/page-faqs'
import CorporatePageClient from './CorporatePageClient'

export const revalidate = 300

export default async function CorporatePage() {
  const initialFaqs = await getPageFaqs('corporate')
  return <CorporatePageClient initialFaqs={initialFaqs} />
}
