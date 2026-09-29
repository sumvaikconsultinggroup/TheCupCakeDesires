import { listDeliveryZones, type DeliveryZoneInfo } from '@/utils/deliveryZones'

/**
 * Suburb delivery landing pages (/cupcake-delivery/<slug>) generated from the
 * checkout's delivery-zone table, so every page states a fee and zone we
 * actually charge. Labels like "Prahran / Windsor" cover one postcode.
 */
export interface SuburbPage extends DeliveryZoneInfo {
  slug: string
  /** Display name, e.g. "Prahran & Windsor". */
  name: string
}

const toSlug = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function build(): SuburbPage[] {
  const zones = listDeliveryZones()
  const seen = new Map<string, number>()
  for (const z of zones) seen.set(toSlug(z.suburb), (seen.get(toSlug(z.suburb)) || 0) + 1)
  return zones
    .map((z) => {
      const base = toSlug(z.suburb)
      return {
        ...z,
        name: z.suburb.replace(/\s*\/\s*/g, ' & '),
        // Same suburb name on two postcodes → disambiguate with the postcode.
        slug: (seen.get(base) || 0) > 1 ? `${base}-${z.postcode}` : base,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const SUBURB_PAGES: SuburbPage[] = build()

export function getSuburbPage(slug: string) {
  return SUBURB_PAGES.find((s) => s.slug === slug) || null
}

/** Other suburbs in the same zone, closest postcodes first (for internal links). */
export function sameZoneSuburbs(page: SuburbPage, count = 8) {
  return SUBURB_PAGES.filter((s) => s.zone === page.zone && s.slug !== page.slug)
    .sort((a, b) => Math.abs(+a.postcode - +page.postcode) - Math.abs(+b.postcode - +page.postcode))
    .slice(0, count)
}
