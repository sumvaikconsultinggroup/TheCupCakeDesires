/**
 * Trading identity shown on tax invoices (PDF + email + print).
 * Env vars can override individual fields for staging; production defaults
 * match the official Event Cupcakes Pty Ltd / The Cupcake Desire letterhead.
 */

export interface InvoiceCompany {
  name: string
  legalName: string
  address: string
  city: string
  state: string
  pincode: string
  /** Australian Business Number (digits or spaced). */
  abn: string
  acn: string
  /** Legacy alias — same as ABN for AU tax invoices. */
  gstin: string
  phone: string
  mobile: string
  email: string
  website: string
  /** Public path under /public for PDF embedding + email <img>. */
  logoPath: string
}

function env(key: string, fallback: string): string {
  const v = process.env[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

/** Format 11-digit ABN as "XX XXX XXX XXX". */
export function formatAbn(abn: string): string {
  const digits = abn.replace(/\D/g, '')
  if (digits.length !== 11) return abn
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}

export function formatAcn(acn: string): string {
  const digits = acn.replace(/\D/g, '')
  if (digits.length !== 9) return acn
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

export function getInvoiceCompany(): InvoiceCompany {
  const abn = env('COMPANY_ABN', env('COMPANY_GSTIN', '15639762182'))
  const acn = env('COMPANY_ACN', '639762182')
  return {
    name: env('COMPANY_NAME', 'The Cupcake Desire'),
    legalName: env('COMPANY_LEGAL_NAME', 'Event Cupcakes Pty Ltd'),
    address: env('COMPANY_ADDRESS', ''),
    city: env('COMPANY_CITY', ''),
    state: env('COMPANY_STATE', 'VIC'),
    pincode: env('COMPANY_PINCODE', ''),
    abn,
    acn,
    gstin: abn,
    phone: env('COMPANY_PHONE', '(03) 9705 0051'),
    mobile: env('COMPANY_MOBILE', '0430 332 287'),
    email: env('COMPANY_EMAIL', 'info@thecupcakedesire.com.au'),
    website: env('COMPANY_WEBSITE', 'www.thecupcakedesire.com.au'),
    logoPath: env('COMPANY_LOGO_PATH', '/images/The-Cupcake-Desire-Logo.png'),
  }
}

export function companyLetterheadLines(company: InvoiceCompany): string[] {
  const lines: string[] = [company.legalName]
  const place = [company.address, [company.city, company.state, company.pincode].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(', ')
  if (place) lines.push(place)
  lines.push(`ABN: ${formatAbn(company.abn)}`)
  lines.push(`ACN: ${formatAcn(company.acn)}`)
  if (company.phone) lines.push(`Phone: ${company.phone}`)
  if (company.mobile) lines.push(`Mobile: ${company.mobile}`)
  if (company.website) lines.push(company.website)
  if (company.email) lines.push(company.email)
  return lines
}
