import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Track your order | The Cupcake Desire',
  description: 'Look up a Cupcake Desire order.',
  canonical: '/track-order',
  follow: true,
})

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children
}
