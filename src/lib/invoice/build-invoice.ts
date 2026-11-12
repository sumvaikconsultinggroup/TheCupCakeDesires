import { amountInWords, getStateCode } from '@/lib/gst'
import { getInvoiceCompany } from '@/lib/invoice/company'
import type { InvoiceAddress, InvoiceData, InvoiceItem } from '@/lib/invoice/types'

/** Loose order shape — works with Mongoose docs and plain objects. */
export interface InvoiceOrderSource {
  orderId?: string
  invoiceNumber?: string
  invoiceGeneratedAt?: Date | string
  createdAt?: Date | string
  subtotal?: number
  totalAmount?: number
  discount?: number
  shipping?: number
  taxes?: number
  tax?: number
  paymentMethod?: string
  recipientGstin?: string
  customer?: {
    firstName?: string
    lastName?: string
    name?: string
    email?: string
    phone?: string
  }
  user?: {
    firstName?: string
    lastName?: string
    name?: string
    email?: string
  }
  deliveryAddress?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    line2?: string
    city?: string
    state?: string
    zipcode?: string
    country?: string
  }
  shippingAddress?: InvoiceAddress & { email?: string }
  billingAddress?: InvoiceAddress
  items?: Array<{
    name?: string
    sku?: string
    hsn?: string
    gstRate?: number
    quantity?: number
    price?: number
    variants?: Array<{ name?: string; option?: string }>
  }>
  gstDetails?: {
    gstRate?: number
    taxableValue?: number
    cgst?: number
    sgst?: number
    igst?: number
    isIntraState?: boolean
  }
  paymentDetails?: {
    paymentMethod?: string
    paymentStatus?: string
    status?: string
    transactionId?: string
  }
}

function customerName(order: InvoiceOrderSource): string {
  return (
    `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() ||
    order.customer?.name ||
    `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
    order.user?.name ||
    `${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}`.trim() ||
    'Customer'
  )
}

function customerEmail(order: InvoiceOrderSource): string {
  return (
    order.customer?.email ||
    order.user?.email ||
    order.deliveryAddress?.email ||
    order.shippingAddress?.email ||
    ''
  )
}

function resolveInvoiceNumber(order: InvoiceOrderSource): string {
  if (order.invoiceNumber) return order.invoiceNumber
  const suffix = (order.orderId || 'ORDER').split('-').pop() || 'ORDER'
  return `INV-${new Date().getFullYear()}-${suffix}`
}

export function buildInvoiceFromOrder(order: InvoiceOrderSource): InvoiceData {
  const company = getInvoiceCompany()
  const invoiceNumber = resolveInvoiceNumber(order)
  const placeOfSupplyState = order.deliveryAddress?.state || order.shippingAddress?.state || ''
  const gst = order.gstDetails || {}
  const gstRateVal = gst.gstRate || 10
  const subtotal =
    order.subtotal ?? (order.totalAmount || 0) + (order.discount || 0) - (order.shipping || 0)
  const totalGst =
    (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0) || order.taxes || order.tax || 0
  const taxableValueVal =
    gst.taxableValue ?? Math.round((subtotal / (1 + gstRateVal / 100)) * 100) / 100

  const items: InvoiceItem[] =
    order.items?.map((item) => ({
      name: item.name || 'Item',
      sku: item.sku || '',
      hsn: item.hsn || '',
      gstRate: item.gstRate || 10,
      quantity: item.quantity || 1,
      price: item.price ?? 0,
      total: (item.price ?? 0) * (item.quantity || 1),
      variants: item.variants || [],
    })) || []

  return {
    documentTitle: 'Tax Invoice',
    invoiceNumber,
    orderId: order.orderId || '',
    date: new Date(
      order.invoiceGeneratedAt || order.createdAt || Date.now()
    ).toISOString(),
    company,
    companyStateCode: getStateCode(company.state, company.abn),
    placeOfSupply: placeOfSupplyState,
    placeOfSupplyCode: getStateCode(placeOfSupplyState),
    recipientGstin: order.recipientGstin || '',
    customer: {
      name: customerName(order),
      email: customerEmail(order),
      phone: order.customer?.phone || order.deliveryAddress?.phone || '',
      address: order.billingAddress || order.shippingAddress || {
        address: order.deliveryAddress?.address,
        line2: order.deliveryAddress?.line2,
        city: order.deliveryAddress?.city,
        state: order.deliveryAddress?.state,
        zipcode: order.deliveryAddress?.zipcode,
        country: order.deliveryAddress?.country,
      },
    },
    items,
    subtotal,
    discount: order.discount || 0,
    shipping: order.shipping || 0,
    gstDetails: {
      gstRate: gstRateVal,
      taxableValue: taxableValueVal,
      cgstAmount: gst.cgst || 0,
      sgstAmount: gst.sgst || 0,
      igstAmount: gst.igst || 0,
      isIntraState: !!gst.isIntraState,
      totalGst,
    },
    total: order.totalAmount || 0,
    totalAmountInWords: amountInWords(order.totalAmount || 0),
    reverseCharge: 'No',
    signatureNote: 'This is a computer-generated invoice and does not require a signature.',
    payment: {
      method: order.paymentDetails?.paymentMethod || order.paymentMethod,
      status: order.paymentDetails?.paymentStatus || order.paymentDetails?.status || 'pending',
      transactionId: order.paymentDetails?.transactionId,
    },
  }
}

export function formatInvoiceAddress(address?: InvoiceAddress | null): string[] {
  if (!address) return []
  const lines: string[] = []
  const line1 = address.street || address.address || address.line1
  if (line1) lines.push(line1)
  if (address.line2) lines.push(address.line2)
  const cityLine = [address.city, address.state, address.postalCode || address.pincode || address.zipcode]
    .filter(Boolean)
    .join(', ')
  if (cityLine) lines.push(cityLine)
  if (address.country) lines.push(address.country)
  return lines
}

export function money(n: number): string {
  return `$${Number(n || 0).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
