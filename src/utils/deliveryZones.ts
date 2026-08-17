/**
 * Explicit Melbourne delivery zones for The Cupcake Desire.
 * Single source of truth for checkout UI + create-order API.
 *
 * Near (~25 km): $9.95
 * Extended (~26–50 km + inner-city list): $19.95
 */

export const DELIVERY_FEE_NEAR = 9.95
export const DELIVERY_FEE_EXTENDED = 19.95

/** Priority delivery surcharge on top of the zone fee (never free). */
export const PRIORITY_DELIVERY_SURCHARGE = 14.95

/** Free standard delivery when order subtotal reaches this (AUD). */
export const FREE_DELIVERY_THRESHOLD = 100

/** Recipient / shipping state — Melbourne metro delivery is Victoria only. */
export const SHIPPING_STATE = 'Victoria'
export const SHIPPING_STATE_CODE = 'VIC'
export const SHIPPING_STATES = [SHIPPING_STATE] as const
export const SHIPPING_STATE_ERROR =
  'We only deliver in Victoria — please set state to Victoria.'

/** Accepts "Victoria", "VIC", and close variants. */
export function isAllowedShippingState(state: string | null | undefined): boolean {
  const s = (state || '').trim().toLowerCase().replace(/\s+/g, ' ')
  return s === 'victoria' || s === 'vic'
}

/** Canonical "Victoria", or null when not allowed. */
export function normalizeShippingState(state: string | null | undefined): string | null {
  if (!isAllowedShippingState(state)) return null
  return SHIPPING_STATE
}

/** Normalize billing_state on saved address rows; reject non-Victoria. */
export function normalizeBillingAddressStates<T extends { billing_state?: string }>(
  addresses: T[] | null | undefined
): { ok: true; addresses: T[] } | { ok: false; message: string } {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return { ok: true, addresses: addresses || [] }
  }
  const next: T[] = []
  for (const addr of addresses) {
    const state = normalizeShippingState(addr?.billing_state)
    if (!state) {
      return { ok: false, message: SHIPPING_STATE_ERROR }
    }
    next.push({ ...addr, billing_state: state })
  }
  return { ok: true, addresses: next }
}

/** Standard hand-delivery window shown at checkout. */
export const STANDARD_DELIVERY_SLOT = '8:00 AM – 4:00 PM'

/** Priority customers may request a preferred time within this window via instructions. */
export const PRIORITY_DELIVERY_WINDOW_HINT = '5:00 AM – 10:00 AM'

export type DeliveryZone = 'near' | 'extended'

export type DeliveryZoneInfo = {
  postcode: string
  suburb: string
  zone: DeliveryZone
  fee: number
  radiusLabel: string
}

type ZoneEntry = { suburb: string; zone: DeliveryZone }

/** Near (~25 km) — $9.95 */
const NEAR: Record<string, string> = {
  '3805': 'Narre Warren',
  '3806': 'Berwick',
  '3803': 'Hallam',
  '3802': 'Endeavour Hills',
  '3177': 'Doveton',
  '3175': 'Dandenong',
  '3174': 'Dandenong North',
  '3173': 'Keysborough',
  '3170': 'Mulgrave',
  '3169': 'Clayton South',
  '3168': 'Clayton',
  '3167': 'Oakleigh South',
  '3166': 'Oakleigh',
  '3150': 'Glen Waverley',
  '3149': 'Mount Waverley',
  '3156': 'Ferntree Gully',
  '3152': 'Wantirna South',
  '3153': 'Bayswater',
  '3178': 'Rowville',
  '3179': 'Scoresby',
  '3180': 'Knoxfield',
  '3977': 'Cranbourne',
  '3976': 'Hampton Park',
  '3975': 'Lynbrook / Lyndhurst',
  '3978': 'Clyde North',
  '3979': 'Clyde',
}

/** Extended (~26–50 km) — $19.95 */
const EXTENDED: Record<string, string> = {
  '3172': 'Springvale',
  '3171': 'Springvale South',
  '3195': 'Aspendale Gardens',
  '3194': 'Mentone',
  '3193': 'Beaumaris',
  '3192': 'Cheltenham',
  '3191': 'Sandringham',
  '3190': 'Highett',
  '3189': 'Moorabbin',
  '3188': 'Hampton',
  '3187': 'Brighton East',
  '3186': 'Brighton',
  '3185': 'Elwood',
  '3184': 'Elsternwick',
  '3183': 'Balaclava',
  '3182': 'St Kilda',
  '3181': 'Prahran / Windsor',
  '3145': 'Malvern East',
  '3144': 'Malvern',
  '3143': 'Armadale',
  '3142': 'Toorak',
  '3141': 'South Yarra',
  '3000': 'Melbourne',
  '3002': 'East Melbourne',
  '3003': 'West Melbourne',
  '3004': 'St Kilda Road',
  '3006': 'Southbank',
  '3008': 'Docklands',
  '3031': 'Kensington',
  '3032': 'Ascot Vale / Travancore',
  '3039': 'Moonee Ponds',
  '3051': 'North Melbourne',
  '3052': 'Parkville',
  '3053': 'Carlton',
  '3054': 'Carlton North',
  '3065': 'Fitzroy',
  '3066': 'Collingwood',
  '3067': 'Abbotsford',
  '3068': 'Fitzroy North',
  '3116': 'Chirnside Park',
  '3120': 'Blackburn',
  '3121': 'Richmond / Burnley',
  '3122': 'Hawthorn',
  '3123': 'Hawthorn East',
  '3124': 'Camberwell',
  '3125': 'Burwood',
  '3126': 'Canterbury',
  '3127': 'Surrey Hills',
  '3128': 'Box Hill',
  '3129': 'Box Hill North',
  '3132': 'Mitcham',
  '3133': 'Vermont',
  '3134': 'Ringwood',
  '3135': 'Wantirna',
  '3136': 'Croydon',
  '3140': 'Lilydale',
  '3205': 'South Melbourne',
  '3207': 'Port Melbourne',
}

function buildLookup(): Map<string, ZoneEntry> {
  const map = new Map<string, ZoneEntry>()
  for (const [pc, suburb] of Object.entries(NEAR)) {
    map.set(pc, { suburb, zone: 'near' })
  }
  for (const [pc, suburb] of Object.entries(EXTENDED)) {
    // Extended wins on any accidental overlap — keep near list authoritative by inserting first
    // and skipping if already present.
    if (!map.has(pc)) {
      map.set(pc, { suburb, zone: 'extended' })
    }
  }
  return map
}

const LOOKUP = buildLookup()

export function normalisePostcode(postcode: string | number | null | undefined): string | null {
  if (postcode === null || postcode === undefined) return null
  const raw =
    typeof postcode === 'number'
      ? String(Math.trunc(postcode)).padStart(4, '0')
      : String(postcode).trim()
  if (!/^\d{4}$/.test(raw)) return null
  return raw
}

/** Zone info for a postcode, or null when we do not deliver there. */
export function getDeliveryZoneInfo(
  postcode: string | number | null | undefined
): DeliveryZoneInfo | null {
  const pc = normalisePostcode(postcode)
  if (!pc) return null
  const entry = LOOKUP.get(pc)
  if (!entry) return null
  const fee = entry.zone === 'near' ? DELIVERY_FEE_NEAR : DELIVERY_FEE_EXTENDED
  return {
    postcode: pc,
    suburb: entry.suburb,
    zone: entry.zone,
    fee,
    radiusLabel: entry.zone === 'near' ? 'Within ~25 km' : 'Within ~26–50 km',
  }
}

/** True when `postcode` is on our delivery list. */
export function isServiceablePostcode(postcode: string | number | null | undefined): boolean {
  return getDeliveryZoneInfo(postcode) !== null
}

/** Base zone fee before free-delivery / priority rules. */
export function getBaseDeliveryFee(postcode: string | number | null | undefined): number | null {
  const info = getDeliveryZoneInfo(postcode)
  return info ? info.fee : null
}
