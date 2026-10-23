import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Birthday Cupcakes Delivered | The Cupcake Desire',
  description:
    'Birthday cupcakes and cakes baked to order and delivered across Melbourne Metro for your party. Delivery only. No studio hosting or party packages.',
  alternates: { canonical: 'https://thecupcakedesire.com.au/bday-party' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function BdayPartyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
