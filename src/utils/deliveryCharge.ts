/**
 * Calculate delivery charge from postcode zone + priority option.
 * Rules (must match checkout OrderSummary + deliveryZones):
 * - Standard delivery: zone fee ($9.95 near / $19.95 extended)
 *   - Orders $100 and above: free standard delivery
 * - Priority delivery:
 *   - Orders below $100: zone fee + $14.95 surcharge
 *   - Orders $100 and above: keep free-delivery waiver, add only $14.95 surcharge
 *
 * Server value is authoritative — never trust client shipping amounts.
 */

import {
  DELIVERY_FEE_NEAR,
  FREE_DELIVERY_THRESHOLD,
  getBaseDeliveryFee,
  getDeliveryZoneInfo,
  PRIORITY_DELIVERY_SURCHARGE,
} from './deliveryZones'

export const DELIVERY_CHARGE_THRESHOLD = FREE_DELIVERY_THRESHOLD
/** @deprecated Prefer zone fees via getBaseDeliveryFee / calculateDeliveryCharge */
export const DELIVERY_CHARGE_AMOUNT = DELIVERY_FEE_NEAR
export const EXPRESS_DELIVERY_CHARGE = PRIORITY_DELIVERY_SURCHARGE

export interface DeliveryChargeResult {
  amount: number
  isFree: boolean
  threshold: number
  isExpress: boolean
  baseFee: number
  zoneFee: number | null
}

/**
 * @param subtotal - Order subtotal (before discount, shipping, taxes)
 * @param isExpressDelivery - Whether priority delivery is selected
 * @param postcode - Delivery / shipping postcode (required for correct zone fee)
 */
export function calculateDeliveryCharge(
  subtotal: number,
  isExpressDelivery: boolean = false,
  postcode?: string | number | null
): DeliveryChargeResult {
  const validSubtotal = Math.max(0, Number(subtotal) || 0)
  const zone = getDeliveryZoneInfo(postcode)
  const zoneFee = zone?.fee ?? getBaseDeliveryFee(postcode)
  // Fallback to near fee only when postcode unknown (cart preview before check)
  const baseFee = zoneFee ?? DELIVERY_FEE_NEAR

  if (isExpressDelivery) {
    // Priority should add an express surcharge, but if standard delivery is already
    // free at this subtotal we must not re-add the zone travel fee.
    const priorityBase =
      validSubtotal >= DELIVERY_CHARGE_THRESHOLD ? 0 : baseFee
    const amount = Math.round((priorityBase + PRIORITY_DELIVERY_SURCHARGE) * 100) / 100
    return {
      amount,
      isFree: false,
      threshold: DELIVERY_CHARGE_THRESHOLD,
      isExpress: true,
      baseFee,
      zoneFee: zoneFee ?? null,
    }
  }

  const amount =
    validSubtotal >= DELIVERY_CHARGE_THRESHOLD ? 0 : Math.round(baseFee * 100) / 100

  return {
    amount,
    isFree: amount === 0,
    threshold: DELIVERY_CHARGE_THRESHOLD,
    isExpress: false,
    baseFee,
    zoneFee: zoneFee ?? null,
  }
}

/**
 * Validate and enforce delivery charge on server side.
 * Requires a serviceable postcode — callers must reject unserviceable codes first.
 */
export function enforceDeliveryCharge(
  subtotal: number,
  isExpressDelivery: boolean = false,
  postcode?: string | number | null,
  _clientShipping?: number
): number {
  const { amount } = calculateDeliveryCharge(subtotal, isExpressDelivery, postcode)
  return amount
}
