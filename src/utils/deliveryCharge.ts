/**
 * Calculate delivery charge based on order subtotal and delivery option
 * Rules:
 * - Standard delivery:
 *   - Orders below $1000: $199 delivery charge
 *   - Orders $1000 and above: Free delivery ($0)
 * - Express delivery: $500 (regardless of order value)
 * 
 * This function is used on both client and server side.
 * Server-side enforcement ensures security.
 */

export const DELIVERY_CHARGE_THRESHOLD = 1000 // Free delivery threshold in rupees
export const DELIVERY_CHARGE_AMOUNT = 199 // Standard delivery charge for orders below threshold
export const EXPRESS_DELIVERY_CHARGE = 500 // Express delivery charge

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
