import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import {
  CHRISTMAS_CORPORATE_DESCRIPTION,
  CHRISTMAS_CORPORATE_TITLE,
} from '@/data/christmas-corporate'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: CHRISTMAS_CORPORATE_TITLE,
  description: CHRISTMAS_CORPORATE_DESCRIPTION,
  alternates: { canonical: '/corporate/christmas' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: CHRISTMAS_CORPORATE_TITLE,
    description: CHRISTMAS_CORPORATE_DESCRIPTION,
    url: absoluteUrl('/corporate/christmas'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: CHRISTMAS_CORPORATE_TITLE,
    description: CHRISTMAS_CORPORATE_DESCRIPTION,
  },
}

export default function CorporateChristmasLayout({ children }: { children: React.ReactNode }) {
  return children
}
