import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Your cart | The Cupcake Desire',
  description: 'Review the cupcakes in your cart before checkout.',
  canonical: '/cart',
  follow: true,
})

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
