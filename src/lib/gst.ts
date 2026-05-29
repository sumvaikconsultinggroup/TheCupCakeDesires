export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

// Indian state name → 2-digit GSTIN state code
export const STATE_CODE_MAP: Record<string, string> = {
  'jammu and kashmir': '01',
  'himachal pradesh': '02',
  punjab: '03',
  chandigarh: '04',
  uttarakhand: '05',
  haryana: '06',
  delhi: '07',
  rajasthan: '08',
  'uttar pradesh': '09',
  bihar: '10',
  sikkim: '11',
  'arunachal pradesh': '12',
  nagaland: '13',
  manipur: '14',
  mizoram: '15',
  tripura: '16',
  meghalaya: '17',
  assam: '18',
  'west bengal': '19',
  jharkhand: '20',
  odisha: '21',
  chhattisgarh: '22',
  'madhya pradesh': '23',
  gujarat: '24',
  'daman and diu': '25',
  'dadra and nagar haveli': '26',
  maharashtra: '27',
  'andhra pradesh': '28',
  karnataka: '29',
  goa: '30',
  lakshadweep: '31',
  kerala: '32',
  'tamil nadu': '33',
  puducherry: '34',
  'andaman and nicobar islands': '35',
  telangana: '36',
  'andhra pradesh (new)': '37',
  ladakh: '38',
}

export function validateGstin(gstin?: string): boolean {
  if (!gstin) return false
  return GSTIN_REGEX.test(gstin.trim().toUpperCase())
}

export function getStateCode(stateName?: string, gstin?: string): string {
  if (gstin && validateGstin(gstin)) return gstin.substring(0, 2)
  if (!stateName) return ''
  return STATE_CODE_MAP[stateName.trim().toLowerCase()] || ''
}

export interface GstSplit {
  taxableValue: number // backed-out base, 2 dp
  gstAmount: number // total GST, 2 dp
  cgst: number // half of gstAmount if intra
  sgst: number // half of gstAmount if intra
  igst: number // full gstAmount if inter
  isIntraState: boolean
  gstRate: number // 5
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Extract GST from an INCLUSIVE price.
 * If price = 100 and rate = 5, taxable = 95.24, gst = 4.76.
 */
export function extractGst(
  inclusivePrice: number,
  gstRate: number,
  supplierState?: string,
  customerState?: string
): GstSplit {
  const safeRate = gstRate || 5
  const taxableValue = round2(inclusivePrice / (1 + safeRate / 100))
  const gstAmount = round2(inclusivePrice - taxableValue)
  const supplier = (supplierState || '').trim().toLowerCase()
  const customer = (customerState || '').trim().toLowerCase()
  const isIntraState = !!supplier && !!customer && supplier === customer
  return {
    taxableValue,
    gstAmount,
    cgst: isIntraState ? round2(gstAmount / 2) : 0,
    sgst: isIntraState ? round2(gstAmount / 2) : 0,
    igst: isIntraState ? 0 : gstAmount,
    isIntraState,
    gstRate: safeRate,
  }
}

// Number to words (Indian system: lakh, crore)
const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigit(n: number): string {
  if (n < 20) return ones[n]
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
}

function threeDigit(n: number): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigit(r) : '')
}

export function amountInWords(amount: number): string {
  const num = Math.floor(amount)
  const paise = Math.round((amount - num) * 100)
  if (num === 0 && paise === 0) return 'Zero Rupees Only'
  let words = ''
  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const hundred = num % 1000
  if (crore) words += threeDigit(crore) + ' Crore '
  if (lakh) words += twoDigit(lakh) + ' Lakh '
  if (thousand) words += twoDigit(thousand) + ' Thousand '
  if (hundred) words += threeDigit(hundred)
  words = words.trim() + ' Rupees'
  if (paise) words += ' and ' + twoDigit(paise) + ' Paise'
  return words.trim() + ' Only'
}
