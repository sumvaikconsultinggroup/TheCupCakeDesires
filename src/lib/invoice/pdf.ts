import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

import { formatInvoiceAddress, money } from '@/lib/invoice/build-invoice'
import type { InvoiceData } from '@/lib/invoice/types'

const MARGIN = 48
const PAGE_WIDTH = 595.28 // A4
const PAGE_HEIGHT = 841.89
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const COCOA = rgb(0.18, 0.12, 0.08)
const TAUPE = rgb(0.35, 0.27, 0.2)
const MUTED = rgb(0.545, 0.451, 0.349)
const RULE = rgb(0.839, 0.769, 0.682)

function drawLine(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.8,
    color: RULE,
  })
}

function drawText(
  page: PDFPage,
  text: string,
  opts: {
    x: number
    y: number
    size: number
    font: PDFFont
    color?: ReturnType<typeof rgb>
    maxWidth?: number
    align?: 'left' | 'right'
  }
) {
  const color = opts.color ?? COCOA
  const maxWidth = opts.maxWidth ?? CONTENT_WIDTH
  let drawX = opts.x
  if (opts.align === 'right') {
    const width = opts.font.widthOfTextAtSize(text, opts.size)
    drawX = opts.x + maxWidth - width
  }
  page.drawText(text, {
    x: drawX,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color,
    maxWidth,
  })
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Render a Tax Invoice PDF for email attachment / download.
 * Uses pdf-lib + StandardFonts (no AFM/font files) so it works on Vercel serverless.
 */
export async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${invoice.documentTitle} ${invoice.invoiceNumber}`)
  pdf.setAuthor(invoice.company.name)

  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  // pdf-lib y grows upward from bottom-left
  let y = PAGE_HEIGHT - MARGIN

  const ensureSpace = (need: number) => {
    if (y - need < MARGIN + 40) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  // Header
  drawText(page, invoice.company.name, {
    x: MARGIN,
    y: y - 14,
    size: 16,
    font: bold,
    maxWidth: CONTENT_WIDTH / 2,
  })
  drawText(page, invoice.documentTitle.toUpperCase(), {
    x: MARGIN + CONTENT_WIDTH / 2,
    y: y - 14,
    size: 14,
    font: bold,
    maxWidth: CONTENT_WIDTH / 2,
    align: 'right',
  })
  y -= 28

  const companyLines = [
    invoice.company.address,
    [invoice.company.city, invoice.company.state, invoice.company.pincode].filter(Boolean).join(', '),
    invoice.company.gstin ? `ABN/GSTIN: ${invoice.company.gstin}` : '',
    invoice.company.phone ? `Phone: ${invoice.company.phone}` : '',
    invoice.company.email || '',
  ].filter(Boolean)

  let leftY = y
  for (const line of companyLines) {
    drawText(page, line, { x: MARGIN, y: leftY, size: 9, font: regular, color: TAUPE, maxWidth: CONTENT_WIDTH / 2 })
    leftY -= 12
  }

  const dateStr = new Date(invoice.date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Melbourne',
  })
  const meta = [
    `Invoice #: ${invoice.invoiceNumber}`,
    `Order #: ${invoice.orderId}`,
    `Date: ${dateStr}`,
    invoice.payment.status ? `Payment: ${String(invoice.payment.status).toUpperCase()}` : '',
  ].filter(Boolean)

  let rightY = y
  for (const line of meta) {
    drawText(page, line, {
      x: MARGIN + CONTENT_WIDTH / 2,
      y: rightY,
      size: 9,
      font: regular,
      color: TAUPE,
      maxWidth: CONTENT_WIDTH / 2,
      align: 'right',
    })
    rightY -= 12
  }

  y = Math.min(leftY, rightY) - 8
  drawLine(page, y)
  y -= 18

  drawText(page, 'BILL TO', { x: MARGIN, y, size: 10, font: bold })
  y -= 14
  drawText(page, invoice.customer.name || 'Customer', { x: MARGIN, y, size: 9, font: regular, color: TAUPE })
  y -= 12
  if (invoice.customer.email) {
    drawText(page, invoice.customer.email, { x: MARGIN, y, size: 9, font: regular, color: TAUPE })
    y -= 12
  }
  if (invoice.customer.phone) {
    drawText(page, invoice.customer.phone, { x: MARGIN, y, size: 9, font: regular, color: TAUPE })
    y -= 12
  }
  for (const line of formatInvoiceAddress(invoice.customer.address)) {
    drawText(page, line, { x: MARGIN, y, size: 9, font: regular, color: TAUPE, maxWidth: CONTENT_WIDTH })
    y -= 12
  }
  if (invoice.recipientGstin) {
    drawText(page, `Recipient GSTIN: ${invoice.recipientGstin}`, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: TAUPE,
    })
    y -= 12
  }
  if (invoice.placeOfSupply) {
    drawText(
      page,
      `Place of supply: ${invoice.placeOfSupply}${
        invoice.placeOfSupplyCode ? ` (${invoice.placeOfSupplyCode})` : ''
      }`,
      { x: MARGIN, y, size: 9, font: regular, color: TAUPE }
    )
    y -= 12
  }

  y -= 8
  drawLine(page, y)
  y -= 14

  const colItem = MARGIN
  const colQty = MARGIN + CONTENT_WIDTH * 0.52
  const colPrice = MARGIN + CONTENT_WIDTH * 0.66
  const colTotal = MARGIN + CONTENT_WIDTH * 0.82
  const wItem = CONTENT_WIDTH * 0.5
  const wQty = CONTENT_WIDTH * 0.12
  const wPrice = CONTENT_WIDTH * 0.14
  const wTotal = CONTENT_WIDTH * 0.18

  drawText(page, 'ITEM', { x: colItem, y, size: 8, font: bold, color: MUTED, maxWidth: wItem })
  drawText(page, 'QTY', { x: colQty, y, size: 8, font: bold, color: MUTED, maxWidth: wQty, align: 'right' })
  drawText(page, 'PRICE', { x: colPrice, y, size: 8, font: bold, color: MUTED, maxWidth: wPrice, align: 'right' })
  drawText(page, 'TOTAL', { x: colTotal, y, size: 8, font: bold, color: MUTED, maxWidth: wTotal, align: 'right' })
  y -= 10
  drawLine(page, y)
  y -= 14

  for (const item of invoice.items) {
    const variant = (item.variants || [])
      .map((v) => v.option)
      .filter(Boolean)
      .join(' · ')
    const nameLines = wrapLines(item.name, regular, 9, wItem)
    const variantLines = variant ? wrapLines(variant, regular, 8, wItem) : []
    const blockHeight = nameLines.length * 11 + variantLines.length * 10 + 8
    ensureSpace(blockHeight + 8)

    let lineY = y
    for (const line of nameLines) {
      drawText(page, line, { x: colItem, y: lineY, size: 9, font: regular, maxWidth: wItem })
      lineY -= 11
    }
    for (const line of variantLines) {
      drawText(page, line, { x: colItem, y: lineY, size: 8, font: regular, color: MUTED, maxWidth: wItem })
      lineY -= 10
    }

    drawText(page, String(item.quantity), {
      x: colQty,
      y,
      size: 9,
      font: regular,
      maxWidth: wQty,
      align: 'right',
    })
    drawText(page, money(item.price), {
      x: colPrice,
      y,
      size: 9,
      font: regular,
      maxWidth: wPrice,
      align: 'right',
    })
    drawText(page, money(item.total), {
      x: colTotal,
      y,
      size: 9,
      font: regular,
      maxWidth: wTotal,
      align: 'right',
    })
    y = lineY - 6
  }

  y -= 4
  ensureSpace(160)
  drawLine(page, y)
  y -= 16

  const summaryX = MARGIN + CONTENT_WIDTH * 0.55
  const summaryW = CONTENT_WIDTH * 0.45
  const row = (label: string, value: string, useBold = false) => {
    ensureSpace(16)
    const font = useBold ? bold : regular
    drawText(page, label, { x: summaryX, y, size: 9, font, maxWidth: summaryW * 0.55 })
    drawText(page, value, {
      x: summaryX + summaryW * 0.55,
      y,
      size: 9,
      font,
      maxWidth: summaryW * 0.45,
      align: 'right',
    })
    y -= 14
  }

  row('Subtotal', money(invoice.subtotal))
  if (invoice.discount > 0) row('Discount', `-${money(invoice.discount)}`)
  if (invoice.shipping > 0) row('Delivery', money(invoice.shipping))
  if (invoice.gstDetails.taxableValue > 0) row('Taxable value', money(invoice.gstDetails.taxableValue))
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

  y -= 2
  drawLine(page, y)
  y -= 12
  row('Total (AUD)', money(invoice.total), true)

  y -= 8
  ensureSpace(80)
  for (const line of wrapLines(`Amount in words: ${invoice.totalAmountInWords}`, regular, 8, CONTENT_WIDTH)) {
    drawText(page, line, { x: MARGIN, y, size: 8, font: regular, color: MUTED, maxWidth: CONTENT_WIDTH })
    y -= 11
  }
  y -= 8

  if (invoice.payment.transactionId) {
    drawText(page, `Transaction: ${invoice.payment.transactionId}`, {
      x: MARGIN,
      y,
      size: 8,
      font: regular,
      color: MUTED,
      maxWidth: CONTENT_WIDTH,
    })
    y -= 12
  }

  drawText(page, `Reverse charge: ${invoice.reverseCharge}`, {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: MUTED,
  })
  y -= 16

  for (const line of wrapLines(invoice.signatureNote, regular, 8, CONTENT_WIDTH)) {
    drawText(page, line, {
      x: MARGIN,
      y,
      size: 8,
      font: regular,
      color: rgb(0.659, 0.58, 0.471),
      maxWidth: CONTENT_WIDTH,
    })
    y -= 11
  }

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}
