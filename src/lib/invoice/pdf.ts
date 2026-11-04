import PDFDocument from 'pdfkit'

import { formatInvoiceAddress, money } from '@/lib/invoice/build-invoice'
import type { InvoiceData } from '@/lib/invoice/types'

const MARGIN = 48
const PAGE_WIDTH = 595.28 // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc
    .strokeColor('#d6c4ae')
    .lineWidth(0.8)
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .stroke()
}

/**
 * Render a Tax Invoice PDF for email attachment / download.
 * Uses built-in Helvetica so it works on Vercel serverless without font files.
 */
export async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, info: {
      Title: `${invoice.documentTitle} ${invoice.invoiceNumber}`,
      Author: invoice.company.name,
    } })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc
      .fillColor('#2e1f15')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(invoice.company.name, MARGIN, MARGIN, { width: CONTENT_WIDTH / 2 })

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#2e1f15')
      .text(invoice.documentTitle.toUpperCase(), MARGIN + CONTENT_WIDTH / 2, MARGIN, {
        width: CONTENT_WIDTH / 2,
        align: 'right',
      })

    let y = MARGIN + 28
    doc.font('Helvetica').fontSize(9).fillColor('#5a4634')
    const companyLines = [
      invoice.company.address,
      [invoice.company.city, invoice.company.state, invoice.company.pincode].filter(Boolean).join(', '),
      invoice.company.gstin ? `ABN/GSTIN: ${invoice.company.gstin}` : '',
      invoice.company.phone ? `Phone: ${invoice.company.phone}` : '',
      invoice.company.email || '',
    ].filter(Boolean)
    for (const line of companyLines) {
      doc.text(line, MARGIN, y, { width: CONTENT_WIDTH / 2 })
      y += 12
    }

    const metaY = MARGIN + 28
    doc.font('Helvetica').fontSize(9).fillColor('#5a4634')
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, MARGIN + CONTENT_WIDTH / 2, metaY, {
      width: CONTENT_WIDTH / 2,
      align: 'right',
    })
    doc.text(
      `Order #: ${invoice.orderId}`,
      MARGIN + CONTENT_WIDTH / 2,
      metaY + 12,
      { width: CONTENT_WIDTH / 2, align: 'right' }
    )
    doc.text(
      `Date: ${new Date(invoice.date).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Australia/Melbourne',
      })}`,
      MARGIN + CONTENT_WIDTH / 2,
      metaY + 24,
      { width: CONTENT_WIDTH / 2, align: 'right' }
    )
    if (invoice.payment.status) {
      doc.text(
        `Payment: ${String(invoice.payment.status).toUpperCase()}`,
        MARGIN + CONTENT_WIDTH / 2,
        metaY + 36,
        { width: CONTENT_WIDTH / 2, align: 'right' }
      )
    }

    y = Math.max(y, metaY + 56) + 8
    drawLine(doc, y)
    y += 16

    // Bill to
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e1f15').text('BILL TO', MARGIN, y)
    y += 14
    doc.font('Helvetica').fontSize(9).fillColor('#5a4634')
    doc.text(invoice.customer.name || 'Customer', MARGIN, y)
    y += 12
    if (invoice.customer.email) {
      doc.text(invoice.customer.email, MARGIN, y)
      y += 12
    }
    if (invoice.customer.phone) {
      doc.text(invoice.customer.phone, MARGIN, y)
      y += 12
    }
    for (const line of formatInvoiceAddress(invoice.customer.address)) {
      doc.text(line, MARGIN, y, { width: CONTENT_WIDTH })
      y += 12
    }
    if (invoice.recipientGstin) {
      doc.text(`Recipient GSTIN: ${invoice.recipientGstin}`, MARGIN, y)
      y += 12
    }
    if (invoice.placeOfSupply) {
      doc.text(
        `Place of supply: ${invoice.placeOfSupply}${
          invoice.placeOfSupplyCode ? ` (${invoice.placeOfSupplyCode})` : ''
        }`,
        MARGIN,
        y
      )
      y += 12
    }

    y += 10
    drawLine(doc, y)
    y += 12

    // Table header
    const colItem = MARGIN
    const colQty = MARGIN + CONTENT_WIDTH * 0.52
    const colPrice = MARGIN + CONTENT_WIDTH * 0.66
    const colTotal = MARGIN + CONTENT_WIDTH * 0.82

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#8b7359')
    doc.text('ITEM', colItem, y, { width: CONTENT_WIDTH * 0.5 })
    doc.text('QTY', colQty, y, { width: CONTENT_WIDTH * 0.12, align: 'right' })
    doc.text('PRICE', colPrice, y, { width: CONTENT_WIDTH * 0.14, align: 'right' })
    doc.text('TOTAL', colTotal, y, { width: CONTENT_WIDTH * 0.18, align: 'right' })
    y += 14
    drawLine(doc, y)
    y += 10

    doc.font('Helvetica').fontSize(9).fillColor('#2e1f15')
    for (const item of invoice.items) {
      if (y > 720) {
        doc.addPage()
        y = MARGIN
      }
      const variant = (item.variants || [])
        .map((v) => v.option)
        .filter(Boolean)
        .join(' · ')
      const nameHeight = doc.heightOfString(item.name + (variant ? `\n${variant}` : ''), {
        width: CONTENT_WIDTH * 0.5,
      })
      doc.text(item.name, colItem, y, { width: CONTENT_WIDTH * 0.5 })
      if (variant) {
        doc.fontSize(8).fillColor('#8b7359').text(variant, colItem, y + 11, {
          width: CONTENT_WIDTH * 0.5,
        })
        doc.fontSize(9).fillColor('#2e1f15')
      }
      doc.text(String(item.quantity), colQty, y, { width: CONTENT_WIDTH * 0.12, align: 'right' })
      doc.text(money(item.price), colPrice, y, { width: CONTENT_WIDTH * 0.14, align: 'right' })
      doc.text(money(item.total), colTotal, y, { width: CONTENT_WIDTH * 0.18, align: 'right' })
      y += Math.max(nameHeight, 16) + 8
    }

    y += 4
    drawLine(doc, y)
    y += 14

    const summaryX = MARGIN + CONTENT_WIDTH * 0.55
    const summaryW = CONTENT_WIDTH * 0.45
    const row = (label: string, value: string, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#2e1f15')
      doc.text(label, summaryX, y, { width: summaryW * 0.55 })
      doc.text(value, summaryX + summaryW * 0.55, y, { width: summaryW * 0.45, align: 'right' })
      y += 14
    }

    row('Subtotal', money(invoice.subtotal))
    if (invoice.discount > 0) row('Discount', `-${money(invoice.discount)}`)
    if (invoice.shipping > 0) row('Delivery', money(invoice.shipping))
    if (invoice.gstDetails.taxableValue > 0) {
      row('Taxable value', money(invoice.gstDetails.taxableValue))
    }
    if (invoice.gstDetails.cgstAmount > 0) {
      row(`CGST (${invoice.gstDetails.gstRate / 2}%)`, money(invoice.gstDetails.cgstAmount))
    }
    if (invoice.gstDetails.sgstAmount > 0) {
      row(`SGST (${invoice.gstDetails.gstRate / 2}%)`, money(invoice.gstDetails.sgstAmount))
    }
    if (invoice.gstDetails.igstAmount > 0) {
      row(`IGST (${invoice.gstDetails.gstRate}%)`, money(invoice.gstDetails.igstAmount))
    }
    if (
      invoice.gstDetails.totalGst > 0 &&
      !invoice.gstDetails.cgstAmount &&
      !invoice.gstDetails.sgstAmount &&
      !invoice.gstDetails.igstAmount
    ) {
      row(`GST (${invoice.gstDetails.gstRate}%)`, money(invoice.gstDetails.totalGst))
    }

    y += 2
    drawLine(doc, y)
    y += 10
    row('Total (AUD)', money(invoice.total), true)

    y += 10
    doc.font('Helvetica').fontSize(8).fillColor('#8b7359')
    doc.text(`Amount in words: ${invoice.totalAmountInWords}`, MARGIN, y, {
      width: CONTENT_WIDTH,
    })
    y += 20

    if (invoice.payment.transactionId) {
      doc.text(`Transaction: ${invoice.payment.transactionId}`, MARGIN, y, {
        width: CONTENT_WIDTH,
      })
      y += 14
    }

    doc.text(`Reverse charge: ${invoice.reverseCharge}`, MARGIN, y)
    y += 20
    doc.fontSize(8).fillColor('#a89478').text(invoice.signatureNote, MARGIN, y, {
      width: CONTENT_WIDTH,
    })

    doc.end()
  })
}
