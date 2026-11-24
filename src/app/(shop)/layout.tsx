import ShopLoadingShell from '@/components/ShopLoadingShell'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopLoadingShell />
      {children}
    </>
  )
}
