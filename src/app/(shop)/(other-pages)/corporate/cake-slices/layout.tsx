import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Cake Slices Melbourne | The Cupcake Desire',
  description:
    'Branded cake slices for meetings and events. Boxes of 12 ($48), 36, 50 or 100 with your logo. Baked in Narre Warren, delivered across Melbourne Metro.',
  alternates: { canonical: '/corporate/cake-slices' },
  openGraph: {
    title: 'Corporate Cake Slices Melbourne | The Cupcake Desire',
    description: 'Branded cake slices for your next event, from 12 to 100. Melbourne Metro delivery.',
    url: absoluteUrl('/corporate/cake-slices'),
    type: 'website',
  },
}

export default function CorporateCakeSlicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
