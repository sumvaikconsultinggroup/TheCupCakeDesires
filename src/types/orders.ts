// Self-delivery lifecycle for The Cupcake Desire (bake-to-order, no courier).
// Legacy values (order_created/confirmed/shipped/…) are mapped on the way out via
// the migration script and the StatusBadge legacy aliases.
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_kitchen'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

// Delivery windows are now customer-chosen free-form labels (e.g. "10:00 AM – 12:30 PM").
export type DeliverySlot = string

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface OrderTag {
  name: string
  color?: string
}

export interface OrderNote {
  _id: string
  text: string
  isInternal: boolean
  createdAt: string
  createdBy: string
}

export interface OrderItem {
  productId?: string
  name?: string
  quantity?: number
  price?: number
  imageUrl?: string
  variants?: Array<{ name?: string; value?: string; option?: string }>
}

export interface OrderCustomer {
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
}

export interface OrderShippingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  address?: string
  address1?: string
  zipcode?: string
}

export interface OrderEnriched {
  _id: string
  id: string
  orderId: string
  userId?: string
  customer?: OrderCustomer
  items?: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentDetails?: {
    paymentMethod?: string
    transactionId?: string
    paymentStatus?: PaymentStatus
    paidAt?: string
    timestamp?: string
  }
  paymentMethod?: string
  shippingAddress?: OrderShippingAddress
  tags?: string[]
  notes?: OrderNote[]
  riskLevel?: RiskLevel
  riskReasons?: string[]
  assignedTo?: string | null
  // Enriched fields from BE1's aggregation
  customerLifetimeValue?: number
  customerOrderCount?: number
  customerIsRepeat?: boolean
  customerName?: string
  customerPhone?: string
  // Self-delivery scheduling — admin schedules each box for a date + slot.
  deliveryDate?: string
  deliverySlot?: DeliverySlot
  deliveryNote?: string
  // Standard fields
  createdAt: string
  updatedAt?: string
  expiresAt?: string
}

export interface OrdersListResponse {
  orders: OrderEnriched[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    from: number
    to: number
  }
  statusCounts: Record<string, number>
  paymentStats: {
    totalRevenue: number
    pendingRevenue: number
    refundedAmount: number
    paidOrderCount: number
    pendingOrderCount: number
    cancelledOrderCount: number
    avgOrderValue: number
    successRate: number
  }
}
