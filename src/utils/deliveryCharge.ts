/**
 * Calculate delivery charge based on order subtotal and delivery option.
 * Rules (must match the storefront promise + checkout OrderSummary):
 * - Standard delivery:
 *   - Orders below $99: $9.95 delivery charge
 *   - Orders $99 and above: Free delivery ($0)
 * - Priority delivery: $14.95 (regardless of order value)
 *
 * These MUST stay in sync with the client-side rates in checkout/OrderSummary.tsx
 * — the server value is authoritative and is what the customer is charged, so a
 * mismatch would bill a different amount than the customer saw.
 */

export const DELIVERY_CHARGE_THRESHOLD = 99 // Free delivery threshold in AUD
export const DELIVERY_CHARGE_AMOUNT = 9.95 // Standard delivery charge for orders below threshold
export const EXPRESS_DELIVERY_CHARGE = 14.95 // Priority delivery charge

export interface DeliveryChargeResult {
  amount: number
  isFree: boolean
  threshold: number
  isExpress: boolean
}

/**
 * Calculate delivery charge for an order
 * @param subtotal - Order subtotal (before discount, shipping, taxes)
 * @param isExpressDelivery - Whether express delivery is selected (default: false)
 * @returns Delivery charge details
 */
export function calculateDeliveryCharge(subtotal: number, isExpressDelivery: boolean = false): DeliveryChargeResult {
  // Ensure subtotal is a valid number
  const validSubtotal = Math.max(0, Number(subtotal) || 0)
  
  // If express delivery is selected, always charge $500
  if (isExpressDelivery) {
    return {
      amount: EXPRESS_DELIVERY_CHARGE,
      isFree: false,
      threshold: DELIVERY_CHARGE_THRESHOLD,
      isExpress: true,
    }
  }
  
  // Standard delivery: Calculate based on subtotal
  const amount = validSubtotal < DELIVERY_CHARGE_THRESHOLD ? DELIVERY_CHARGE_AMOUNT : 0
  
  return {
    amount,
    isFree: amount === 0,
    threshold: DELIVERY_CHARGE_THRESHOLD,
    isExpress: false,
  }
}

/**
 * Validate and enforce delivery charge on server side
 * This ensures the delivery charge cannot be bypassed
 * @param subtotal - Order subtotal from client
 * @param isExpressDelivery - Whether express delivery is selected (default: false)
 * @param clientShipping - Shipping amount sent by client (should be validated, ignored for security)
 * @returns Correct shipping amount to use
 */
export function enforceDeliveryCharge(subtotal: number, isExpressDelivery: boolean = false, clientShipping?: number): number {
  const { amount } = calculateDeliveryCharge(subtotal, isExpressDelivery)
  
  // Always use server-calculated amount, ignore client value for security
  return amount
}
