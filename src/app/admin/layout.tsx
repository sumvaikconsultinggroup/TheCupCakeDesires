import { privatePageMetadata } from '@/lib/private-page'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata = privatePageMetadata({
  title: 'Admin | The Cupcake Desire',
  description: 'Cupcake Desire admin.',
  follow: false,
})

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
