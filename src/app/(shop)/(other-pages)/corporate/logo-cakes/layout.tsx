import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Logo Cakes | The Cupcake Desire',
  description:
    'Branded logo cakes for offices and events: 6" $70, 8" $90, 10" $110 in Vanilla or Chocolate. Upload your logo — trim matched to your brand. Melbourne delivery.',
  alternates: { canonical: '/corporate/logo-cakes' },
  openGraph: {
    title: 'Corporate Logo Cakes | The Cupcake Desire',
    description:
      'A branded logo cake with edible logo and matching buttercream trim. 6, 8 or 10 inch — Vanilla or Chocolate.',
    url: absoluteUrl('/corporate/logo-cakes'),
    type: 'website',
    images: [{ url: absoluteUrl('/images/corporate-round-cake.png') }],
  },
}

export default function CorporateLogoCakesLayout({ children }: { children: React.ReactNode }) {
  return children
}
