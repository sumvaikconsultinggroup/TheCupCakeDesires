import { privatePageMetadata } from '@/lib/private-page'

export const metadata = privatePageMetadata({
  title: 'Sign in | The Cupcake Desire',
  description: 'Sign in to your Cupcake Desire account.',
  follow: false,
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
