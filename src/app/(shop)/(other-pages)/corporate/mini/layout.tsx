import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mini Corporate Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Bite-size branded mini cupcakes for offices and events. Boxes of 24 ($84), 100, 300 or 500 with edible logos. Baked in Narre Warren, delivered across Melbourne Metro.',
  alternates: { canonical: '/corporate/mini' },
  openGraph: {
    title: 'Mini Corporate Cupcakes Melbourne | The Cupcake Desire',
    description: 'Branded mini cupcakes with edible logos, from 24 to 500. Melbourne Metro delivery.',
    url: absoluteUrl('/corporate/mini'),
    type: 'website',
  },
}

export default function CorporateMiniLayout({ children }: { children: React.ReactNode }) {
  return children
}
