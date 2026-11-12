import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

/**
 * Preferred Flash Deals URL is /deals.
 * /flash-deals and /collections/flash-deals (with or without trailing slash)
 * one-hop 301 here via next.config + legacy-redirect-map. Keep this canonical
 * absolute on the production host so it stays self-referencing before and after
 * hydration, independent of preview/local NEXT_PUBLIC_SITE_URL.
 */
const FLASH_DEALS_CANONICAL = 'https://thecupcakedesire.com.au/deals'

export const metadata: Metadata = {
  title: 'Flash Deals | The Cupcake Desire',
  description:
    'Limited-time offers on hand-frosted cupcakes. Same morning butter, same vanilla bean — at a friendlier price. Shop deals before they sell out.',
  alternates: {
    canonical: FLASH_DEALS_CANONICAL,
  },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Flash Deals | The Cupcake Desire',
    description:
      'Limited-time offers on hand-frosted cupcakes. Same morning butter, same vanilla bean — at a friendlier price.',
    url: FLASH_DEALS_CANONICAL,
    type: 'website',
    siteName: 'The Cupcake Desire',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
