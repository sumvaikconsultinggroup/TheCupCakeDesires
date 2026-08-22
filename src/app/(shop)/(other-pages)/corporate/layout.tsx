import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Cupcakes & Gifting | The Cupcake Desire',
  description:
    "Australia's most-loved corporate cupcake partner. Edible logos, branded packaging, multi-venue delivery across Melbourne, Sydney, Brisbane, Adelaide & Perth — from 50-box client thank-yous to 5,000-box annual gifting programs. 24h quote. Price-match + 5%.",
  alternates: { canonical: '/corporate' },
  openGraph: {
    title: 'Corporate Cupcakes & Gifting | The Cupcake Desire',
    description:
      'Trusted by 500+ brands. Hand-crafted corporate cupcakes with edible logos, custom branding, and multi-venue delivery across Melbourne and beyond.',
    url: absoluteUrl('/corporate'),
    type: 'website',
  },
}

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
