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

/**
 * One local sentence for suburbs people actually search. The rest of the page
 * still states the real fee and postcode; this line is what makes the copy
 * different from the next suburb over.
 */
export const SUBURB_NOTES: Record<string, string> = {
  melbourne:
    'Collins Street and the laneways are in our extended zone. Weekday handovers suit a reception desk better than a weekend booking.',
  'east-melbourne': 'East Melbourne sits with the CBD in the extended zone, a short run from the offices on Wellington Parade.',
  'west-melbourne': 'West Melbourne orders are handed over on a weekday, the same extended-zone run as the CBD.',
  southbank: 'Southbank towers and the arts precinct are on the extended-zone run. We deliver to a lobby or a meeting room.',
  docklands: 'Docklands offices are on the extended-zone list. Tell us the tower and we hand the boxes to reception.',
  'south-yarra': 'South Yarra is a frequent office and home drop on the extended-zone run from Narre Warren.',
  richmond: 'Richmond and Burnley share a postcode on our extended-zone list, for home addresses and Bridge Road offices.',
  'richmond-burnley': 'Richmond and Burnley share a postcode on our extended-zone list, for home addresses and Bridge Road offices.',
  carlton: 'Carlton, including the university edge, is on the extended-zone weekday run.',
  fitzroy: 'Fitzroy cafes and studios are on the extended-zone list. We deliver on weekdays, not Sundays.',
  'st-kilda': 'St Kilda is on the extended-zone run. Order before noon for the next weekday.',
  'port-melbourne': 'Port Melbourne warehouses and apartments are on the extended-zone list.',
  'box-hill': 'Box Hill is on the extended-zone run, closer to our Narre Warren kitchen than the CBD.',
  hawthorn: 'Hawthorn is on the extended-zone weekday run.',
  'glen-waverley': 'Glen Waverley is in the near zone, so the delivery fee is the lower of the two.',
  dandenong: 'Dandenong is in the near zone, a short drive from the kitchen on the Princes Highway.',
  berwick: 'Berwick is next door to the kitchen and sits in the near zone.',
  cranbourne: 'Cranbourne is in the near zone, south of the kitchen.',
  'narre-warren': 'The kitchen is in Narre Warren. There is no walk-in counter — every order, including local ones, is delivered.',
}

export function getSuburbPage(slug: string) {
  return SUBURB_PAGES.find((s) => s.slug === slug) || null
}

/** Other suburbs in the same zone, closest postcodes first (for internal links). */
export function sameZoneSuburbs(page: SuburbPage, count = 8) {
  return SUBURB_PAGES.filter((s) => s.zone === page.zone && s.slug !== page.slug)
    .sort((a, b) => Math.abs(+a.postcode - +page.postcode) - Math.abs(+b.postcode - +page.postcode))
    .slice(0, count)
}
