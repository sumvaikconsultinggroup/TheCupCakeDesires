import JsonLd from '@/components/SE0/JsonLd'
import { loadBdayPartyCakes } from '@/lib/bday-party-server'
import { getPageFaqs } from '@/lib/page-faqs'
import BdayPartyClient from './BdayPartyClient'
import BdayPartyHero from './BdayPartyHero'

export const revalidate = 300

export default async function BdayPartyPage() {
  const [cakeProducts, initialFaqs] = await Promise.all([
    loadBdayPartyCakes(),
    getPageFaqs('bday-party'),
  ])

  return (
    <div className="bake-canvas bg-ivory text-cocoa">
      <JsonLd />
      <BdayPartyHero />
      <BdayPartyClient cakeProducts={cakeProducts} initialFaqs={initialFaqs} />
    </div>
  )
}
