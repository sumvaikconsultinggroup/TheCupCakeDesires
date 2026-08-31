import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Round Cake | The Cupcake Desire',
  description:
    'Branded round cakes for offices and events. 6 inch $70, 8 inch $90, 10 inch $110 — Vanilla or Chocolate. Upload your logo; the cake trim is matched to your brand. Melbourne delivery.',
  alternates: { canonical: '/corporate/round-cake' },
  openGraph: {
    title: 'Corporate Round Cake | The Cupcake Desire',
    description:
      'A branded round cake with edible logo and matching buttercream trim. 6, 8 or 10 inch — Vanilla or Chocolate.',
    url: absoluteUrl('/corporate/round-cake'),
    type: 'website',
    images: [{ url: absoluteUrl('/images/corporate-round-cake.png') }],
  },
}

export default function CorporateRoundCakeLayout({ children }: { children: React.ReactNode }) {
  return children
}
