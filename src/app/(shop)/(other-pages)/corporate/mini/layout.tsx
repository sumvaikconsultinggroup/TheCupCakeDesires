import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mini Corporate Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Branded mini cupcakes with edible logos for offices and events — boxes of 24 ($84), 100, 300 or 500. Baked in Narre Warren, delivered across Melbourne.',
  alternates: { canonical: '/corporate/mini' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Mini Corporate Cupcakes Melbourne | The Cupcake Desire',
    description: 'Branded mini cupcakes with edible logos, from 24 to 500. Melbourne Metro delivery.',
    url: absoluteUrl('/corporate/mini'),
    type: 'website',
  },
}

export default function CorporateMiniLayout({ children }: { children: React.ReactNode }) {
  return children
}
