// src/utils/sendOrderConfirmationEmail.ts

import mailer from '@/lib/mailer'
import { getOrderConfirmationTemplate } from './emailTemplates'

interface OrderEmailData {
  customerName: string
  customerEmail: string
  orderId: string
  orderDate: string
  items: Array<{
    name: string
    imageUrl: string
    variant?: {
      option1Value?: string
      option2Value?: string
      option3Value?: string
    }
    quantity: number
    price: number
  }>
  subtotal: number
  discount?: number
  shipping?: number
  taxes?: number
  total: number
  paymentMethod: string
  shippingAddress: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData) => {
  try {
    const htmlContent = getOrderConfirmationTemplate(orderData)

    await mailer({
      email: orderData.customerEmail,
      subject: `Order Confirmed #${orderData.orderId} - The Cupcake Desire`,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error)
    return { success: false, error }
  }
}