import { loadBdayPartyCakes } from '@/lib/bday-party-server'
import BdayPartyClient from './BdayPartyClient'

export const revalidate = 60

export default async function BdayPartyPage() {
  const cakeProducts = await loadBdayPartyCakes()

  return <BdayPartyClient cakeProducts={cakeProducts} />
}
