/** No orders at all: 16 December 2026 through 10 January 2027, inclusive. */
export const KITCHEN_CLOSED_FROM = '2026-12-16'
export const KITCHEN_CLOSED_THROUGH = '2027-01-10'

/** Cakes only: 2 December through 15 December 2026. Other products stay available. */
export const CAKE_PAUSE_FROM = '2026-12-02'
export const CAKE_PAUSE_THROUGH = '2026-12-15'

export const KITCHEN_CLOSURE_MESSAGE =
  'We are not accepting orders for 16 December 2026 through 10 January 2027. The bakery is closed for that break, so we cannot bake or deliver on those days.'

export const CAKE_PAUSE_MESSAGE =
  'We are not accepting cakes for delivery from 2 December through 15 December. Cupcakes and the rest of the menu are still available on those days.'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isKitchenClosedDate(dateISO: string | null | undefined): boolean {
  if (!dateISO || !ISO_DATE.test(dateISO)) return false
  return dateISO >= KITCHEN_CLOSED_FROM && dateISO <= KITCHEN_CLOSED_THROUGH
}

export function isCakePauseDate(dateISO: string | null | undefined): boolean {
  if (!dateISO || !ISO_DATE.test(dateISO)) return false
  return dateISO >= CAKE_PAUSE_FROM && dateISO <= CAKE_PAUSE_THROUGH
}

/** True when today is inside the break, or the chosen delivery day is. */
export function isOrderingClosed(args: {
  todayISO: string
  deliveryDate?: string | null
}): boolean {
  return isKitchenClosedDate(args.todayISO) || isKitchenClosedDate(args.deliveryDate)
}

export function melbourneDateISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
