import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Profile | The Cupcake Desire',
  description: 'Your Cupcake Desire profile.',
  canonical: '/profile',
  follow: false,
})

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
