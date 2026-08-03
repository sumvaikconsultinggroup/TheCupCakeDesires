import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
// import AsideProductQuickView from '@/components/aside-product-quickview'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import { ActivityTrackingWrapper } from '@/components/ActivityTrackingWrapper'
import 'rc-slider/assets/index.css'
import React, { ReactNode } from 'react'

interface ComponentProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

const ApplicationLayout: React.FC<ComponentProps> = ({ children, header, footer }) => {
  return (
    <ActivityTrackingWrapper>
      <div className="font-bake-body bake-canvas relative min-h-screen overflow-x-hidden antialiased">
        {header ? header : <Header hasBorderBottom={true} />}
        <main>{children}</main>
        {footer ? footer : <Footer />}

        {/* ASIDES */}
        <AsideSidebarNavigation />
        <AsideSidebarCart />
        {/* <AsideProductQuickView /> */}
      </div>
    </ActivityTrackingWrapper>
  )
}

export { ApplicationLayout }
