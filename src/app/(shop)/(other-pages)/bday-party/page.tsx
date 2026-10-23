import JsonLd from '@/components/SE0/JsonLd'
import { loadBdayPartyCakes } from '@/lib/bday-party-server'
import BdayPartyClient from './BdayPartyClient'
import BdayPartyHero from './BdayPartyHero'

export const revalidate = 300

export default async function BdayPartyPage() {
  const cakeProducts = await loadBdayPartyCakes()

  return (
    <div className="bake-canvas bg-ivory text-cocoa">
      <JsonLd />
      <BdayPartyHero />
      <BdayPartyClient cakeProducts={cakeProducts} />
    </div>
  )
}
