/** Storefront pages that render an FAQ section — all managed from /admin/faqs */
export const FAQ_PAGES = [
  { id: 'homepage', label: 'Homepage', path: '/#faq', needsRef: false },
  { id: 'corporate', label: 'Corporate', path: '/corporate', needsRef: false },
  { id: 'bday-party', label: 'Birthday Party', path: '/bday-party', needsRef: false },
  { id: 'gift-voucher', label: 'Gift Voucher', path: '/gift-voucher', needsRef: false },
  { id: 'collection', label: 'Collection', path: '/collections', needsRef: true, refLabel: 'Collection' },
  { id: 'product', label: 'Product', path: '/products', needsRef: true, refLabel: 'Product' },
] as const

export type FaqPageId = (typeof FAQ_PAGES)[number]['id']

export function getFaqPage(id: string) {
  return FAQ_PAGES.find((p) => p.id === id)
}

export function buildFaqPreviewPath(page: string, pageRef?: string) {
  const def = getFaqPage(page)
  if (!def) return '/'
  if (def.needsRef && pageRef) {
    if (page === 'collection') return `/collections/${pageRef}`
    if (page === 'product') return `/products/${pageRef}`
  }
  return def.path
}
