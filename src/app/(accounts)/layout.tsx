import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import { currentUser } from '@clerk/nextjs/server'
import React, { FC } from 'react'
import PageTab from './PageTab'

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = async ({ children }) => {
  const user = await currentUser().catch(() => null)
  const firstName = user?.firstName?.trim() || ''

  return (
    <>
      <Header />

      {/* ─── Editorial hero ─── */}
      <section className="font-bake-body relative overflow-hidden bg-cream py-16 md:py-24">
        {/* Soft brand blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-112 w-md rounded-full bg-cocoa/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-8">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Your account
              </p>
              <h1 className="bake-display-xl mt-6 max-w-[20ch]">
                {firstName ? `Welcome back, ` : `Welcome `}
                <span className="bake-display-italic text-rose-accent">
                  {firstName || 'friend.'}
                </span>
                {firstName && <span className="bake-display-italic text-rose-accent">.</span>}
              </h1>
              <p className="bake-body-lg mt-6 max-w-[58ch] text-cocoa-soft">
                Manage your details, browse the boxes you&rsquo;ve saved, and track every order
                that&rsquo;s in the oven.
              </p>
            </div>

            <div className="md:col-span-4 md:text-right">
              <p className="bake-caption text-taupe">
                Signed in as
              </p>
              <p className="font-bake-display mt-1 text-[16px] font-medium text-cocoa">
                {user?.primaryEmailAddress?.emailAddress || 'Guest'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tab navigation + content ─── */}
      <section className="font-bake-body bg-ivory pb-20 md:pb-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <PageTab />
          <div className="mt-10">{children}</div>
        </div>
      </section>

      <Footer />

      {/* ASIDES */}
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}

export default Layout
