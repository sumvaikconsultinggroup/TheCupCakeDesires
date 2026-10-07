import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Checkout | The Cupcake Desire',
  description: 'Checkout for The Cupcake Desire.',
  canonical: '/checkout',
  follow: false,
})

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
