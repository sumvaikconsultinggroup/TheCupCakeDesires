export interface InvoiceAddress {
  street?: string
  address?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postalCode?: string
  pincode?: string
  zipcode?: string
  country?: string
}

export interface InvoiceItem {
  name: string
  sku: string
  hsn: string
  gstRate: number
  quantity: number
  price: number
  total: number
  variants?: Array<{ name?: string; option?: string }>
}

export interface InvoiceData {
  documentTitle: string
  invoiceNumber: string
  orderId: string
  date: string
  company: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    gstin: string
    phone: string
    email: string
  }
  companyStateCode: string
  placeOfSupply: string
  placeOfSupplyCode: string
  recipientGstin: string
  customer: {
    name: string
    email: string
    phone: string
    address?: InvoiceAddress | null
  }
  items: InvoiceItem[]
  subtotal: number
  discount: number
  shipping: number
  gstDetails: {
    gstRate: number
    taxableValue: number
    cgstAmount: number
    sgstAmount: number
    igstAmount: number
    isIntraState: boolean
    totalGst: number
  }
  total: number
  totalAmountInWords: string
  reverseCharge: string
  signatureNote: string
  payment: {
    method?: string
    status?: string
    transactionId?: string
  }
}
