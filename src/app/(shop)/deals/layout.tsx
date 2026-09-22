import Header from '@/components/Header/Header'
import { ApplicationLayout } from '../application-layout'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flash Deals | The Cupcake Desire',
  description:
    'Limited-time offers on hand-frosted cupcakes. Same morning butter, same vanilla bean — at a friendlier price. Shop deals before they sell out.',
  alternates: {
    canonical: '/deals',
  },
  openGraph: {
    title: 'Flash Deals | The Cupcake Desire',
    description:
      'Limited-time offers on hand-frosted cupcakes. Same morning butter, same vanilla bean — at a friendlier price.',
    url: absoluteUrl('/deals'),
    type: 'website',
    siteName: 'The Cupcake Desire',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationLayout header={<Header />}>{children}</ApplicationLayout>
}
