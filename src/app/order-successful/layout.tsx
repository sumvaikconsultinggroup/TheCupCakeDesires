import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Order confirmed | The Cupcake Desire',
  description: 'Your Cupcake Desire order is confirmed.',
  canonical: '/order-successful',
  follow: false,
})

// The root layout already renders <html>/<body> (and the GTM/GA4 tags this page's
// purchase event depends on) — a nested <html> here caused invalid markup and
// hydration errors on the confirmation page.
export default function OrderSuccessfulLayout({ children }: { children: React.ReactNode }) {
  return children
}
