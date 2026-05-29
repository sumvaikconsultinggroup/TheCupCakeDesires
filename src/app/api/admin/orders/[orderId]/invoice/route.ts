// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { amountInWords, getStateCode } from '@/lib/gst'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/orders/[orderId]/invoice - Generate invoice
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params
    const body = await request.json()
    await connectDb()

    // Find order
    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate invoice number
    const invoiceNumber = order.invoiceNumber || `INV-${new Date().getFullYear()}-${order.orderId.split('-').pop()}`

    if (!process.env.COMPANY_GSTIN) {
      console.warn('COMPANY_GSTIN env var is not set; GSTIN will be omitted from invoices')
    }

    // Build invoice data
    const placeOfSupplyState = order.deliveryAddress?.state || order.shippingAddress?.state || ''
    const gst = order.gstDetails || {}
    const gstRateVal = gst.gstRate || 5
    const totalGst = (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0) || order.taxes || 0
    const taxableValueVal = gst.taxableValue ?? Math.round(((order.subtotal || 0) / (1 + gstRateVal / 100)) * 100) / 100
    const invoiceData = {
      documentTitle: 'Tax Invoice',
      invoiceNumber,
      orderId: order.orderId,
      date: new Date().toISOString(),
      dueDate: new Date().toISOString(),

      company: {
        name: process.env.COMPANY_NAME || 'Gibbon Nutrition',
        address: process.env.COMPANY_ADDRESS || '',
        city: process.env.COMPANY_CITY || '',
        state: process.env.COMPANY_STATE || '',
        pincode: process.env.COMPANY_PINCODE || '',
        gstin: process.env.COMPANY_GSTIN || '',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.COMPANY_EMAIL || '',
      },
      companyStateCode: getStateCode(process.env.COMPANY_STATE, process.env.COMPANY_GSTIN),
      placeOfSupply: placeOfSupplyState,
      placeOfSupplyCode: getStateCode(placeOfSupplyState),
      recipientGstin: order.recipientGstin || '',

      customer: {
        name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.billingAddress || order.shippingAddress,
      },

      items:
        order.items?.map((item: any) => ({
          name: item.name,
          sku: item.sku || '',
          hsn: item.hsn || '',
          gstRate: item.gstRate || 5,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })) || [],

      subtotal: order.subtotal ?? order.totalAmount + (order.discount || 0) - (order.shipping || 0),
      discount: order.discount || 0,
      discountCode: order.discountCode,
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
      total: order.totalAmount,
      totalAmountInWords: amountInWords(order.totalAmount || 0),
      reverseCharge: 'No',
      signatureNote: 'This is a computer-generated invoice and does not require a signature.',

      payment: {
        method: order.paymentMethod,
        status: order.paymentDetails?.paymentStatus || 'pending',
        transactionId: order.paymentDetails?.transactionId,
      },
    }

    // Update order with invoice info
    order.invoiceNumber = invoiceNumber
    order.invoiceGeneratedAt = new Date()

    // Add timeline event - ensure timeline is always an array
    if (!Array.isArray(order.timeline)) {
      order.timeline = []
    }
    order.timeline.push({
      eventType: 'status',
      title: 'Invoice Generated',
      description: `Invoice ${invoiceNumber} generated`,
      user: body.user || 'Admin',
      timestamp: new Date(),
    })

    await order.save()

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}

// GET /api/admin/orders/[orderId]/invoice - Get invoice
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params
    await connectDb()

    // Find order
    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.invoiceNumber) {
      return NextResponse.json({ error: 'Invoice not generated yet' }, { status: 404 })
    }

    // Return invoice data
    const placeOfSupplyState = order.deliveryAddress?.state || order.shippingAddress?.state || ''
    const gst = order.gstDetails || {}
    const gstRateVal = gst.gstRate || 5
    const totalGst = (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0) || order.taxes || 0
    const taxableValueVal = gst.taxableValue ?? Math.round(((order.subtotal || 0) / (1 + gstRateVal / 100)) * 100) / 100
    const invoiceData = {
      documentTitle: 'Tax Invoice',
      invoiceNumber: order.invoiceNumber,
      orderId: order.orderId,
      date: order.invoiceGeneratedAt || order.createdAt,

      company: {
        name: process.env.COMPANY_NAME || 'Gibbon Nutrition',
        address: process.env.COMPANY_ADDRESS || '',
        city: process.env.COMPANY_CITY || '',
        state: process.env.COMPANY_STATE || '',
        pincode: process.env.COMPANY_PINCODE || '',
        gstin: process.env.COMPANY_GSTIN || '',
        phone: process.env.COMPANY_PHONE || '',
        email: process.env.COMPANY_EMAIL || '',
      },
      companyStateCode: getStateCode(process.env.COMPANY_STATE, process.env.COMPANY_GSTIN),
      placeOfSupply: placeOfSupplyState,
      placeOfSupplyCode: getStateCode(placeOfSupplyState),
      recipientGstin: order.recipientGstin || '',

      customer: {
        name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.billingAddress || order.shippingAddress,
      },

      items:
        order.items?.map((item: any) => ({
          name: item.name,
          sku: item.sku || '',
          hsn: item.hsn || '',
          gstRate: item.gstRate || 5,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })) || [],

      subtotal: order.subtotal ?? order.totalAmount + (order.discount || 0) - (order.shipping || 0),
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
      total: order.totalAmount,
      totalAmountInWords: amountInWords(order.totalAmount || 0),
      reverseCharge: 'No',
      signatureNote: 'This is a computer-generated invoice and does not require a signature.',

      payment: {
        method: order.paymentMethod,
        status: order.paymentDetails?.paymentStatus || 'pending',
        transactionId: order.paymentDetails?.transactionId,
      },
    }

    return NextResponse.json(invoiceData)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}
