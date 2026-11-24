import ShopLoadingShell from '@/components/ShopLoadingShell'
import CakePauseListener from '@/components/order/CakePauseListener'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopLoadingShell />
      {children}
      <CakePauseListener />
    </>
  )
}
