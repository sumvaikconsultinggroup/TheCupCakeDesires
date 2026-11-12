import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Logo Cakes Melbourne | Round Cakes With Your Logo',
  description:
    "Round cakes with your logo printed on top, in 6, 8 or 10 inch, vanilla or chocolate, with buttercream trim matched to it. Cakes need 3 days' notice.",
  alternates: { canonical: '/corporate/logo-cakes' },
  openGraph: {
    title: 'Corporate Logo Cakes Melbourne | Round Cakes With Your Logo',
    description:
      "Round cakes with your logo printed on top, in 6, 8 or 10 inch, vanilla or chocolate, with buttercream trim matched to it. Cakes need 3 days' notice.",
    url: absoluteUrl('/corporate/logo-cakes'),
    type: 'website',
    images: [{ url: absoluteUrl('/images/corporate-round-cake.png') }],
  },
}

export default function CorporateLogoCakesLayout({ children }: { children: React.ReactNode }) {
  return children
}
