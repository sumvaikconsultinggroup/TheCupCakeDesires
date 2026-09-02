import type { MetadataRoute } from 'next'

/** Static storefront routes managed in admin SEO → Pages and included in sitemap.xml. */
export type StorefrontPageDefinition = {
  pageId: string
  pageName: string
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

export const STOREFRONT_PAGE_DEFINITIONS: StorefrontPageDefinition[] = [
  { pageId: 'home', pageName: 'Home Page', path: '/', changeFrequency: 'daily', priority: 1.0 },
  { pageId: 'about', pageName: 'About Us', path: '/about-us', changeFrequency: 'monthly', priority: 0.5 },
  { pageId: 'contact', pageName: 'Contact Us', path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { pageId: 'deals', pageName: 'Deals & Promo Codes', path: '/deals', changeFrequency: 'daily', priority: 0.8 },
  { pageId: 'allergen-info', pageName: 'Allergens & Ingredients', path: '/allergen-info', changeFrequency: 'monthly', priority: 0.4 },
  { pageId: 'blog', pageName: 'Stories Main Page', path: '/blogs', changeFrequency: 'daily', priority: 0.7 },
  { pageId: 'reviews', pageName: 'Customer Notes', path: '/reviews', changeFrequency: 'weekly', priority: 0.6 },
  { pageId: 'faq', pageName: 'FAQ', path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'site-map', pageName: 'Site Map', path: '/site-map', changeFrequency: 'weekly', priority: 0.4 },
  { pageId: 'cupcake-builder', pageName: 'Build Your Box', path: '/cupcake-builder', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'gift-voucher', pageName: 'Gift Voucher', path: '/gift-voucher', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'collections-all', pageName: 'All Items Collection', path: '/collections/all-items', changeFrequency: 'weekly', priority: 0.8 },
  { pageId: 'collections-all-cupcakes', pageName: 'All Cupcakes Collection', path: '/collections/all-cupcakes', changeFrequency: 'weekly', priority: 0.8 },
  { pageId: 'branded-cupcakes', pageName: 'Branded Cupcakes Melbourne', path: '/branded-cupcakes-melbourne', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'nut-free-cakes', pageName: 'Nut Free Cakes', path: '/nut-free-cakes', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'vegan-cakes', pageName: 'Vegan Cakes', path: '/vegan-cakes', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'gluten-free-cupcakes', pageName: 'Gluten Free Cupcakes', path: '/gluten-free-cupcakes', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'corporate', pageName: 'Corporate Gifting', path: '/corporate', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'corporate-mini', pageName: 'Corporate Mini Cupcakes', path: '/corporate/mini', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'corporate-cake-slices', pageName: 'Corporate Cake Slices', path: '/corporate/cake-slices', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'corporate-round-cake', pageName: 'Corporate Logo Cakes', path: '/corporate/logo-cakes', changeFrequency: 'monthly', priority: 0.6 },
  { pageId: 'bday-party', pageName: 'Birthday Party', path: '/bday-party', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'custom-dress-cake', pageName: 'Custom Dress Cake', path: '/custom-dress-cake', changeFrequency: 'monthly', priority: 0.7 },
  { pageId: 'refund-policy', pageName: 'Refund Policy', path: '/refund-policy', changeFrequency: 'yearly', priority: 0.3 },
  { pageId: 'privacy-policy', pageName: 'Privacy Policy', path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { pageId: 'shipping-policy', pageName: 'Delivery Policy', path: '/shipping-policy', changeFrequency: 'yearly', priority: 0.3 },
  { pageId: 'terms', pageName: 'Terms of Service', path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
]

export const ADMIN_SEO_PAGES = STOREFRONT_PAGE_DEFINITIONS.map(({ pageId, pageName, path }) => ({
  pageId,
  pageName,
  path,
}))
