import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Payment failed | The Cupcake Desire',
  description: 'The payment for this Cupcake Desire order did not go through.',
  canonical: '/payment-failure',
  follow: false,
})

export default function PaymentFailureLayout({ children }: { children: React.ReactNode }) {
  return children
}
