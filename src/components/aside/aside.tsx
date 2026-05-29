'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Drawer component that opens on user click.
 * @param heading - string. Shown at the top of the drawer.
 * @param open - boolean state. if true opens the drawer.
 * @param onClose - function should set the open state.
 * @param openFrom - right, left
 * @param children - react children node.
 */
export function Aside({
  heading,
  logoOnHeading = false,
  openFrom = 'right',
  children ='',
  type,
  className,
  contentMaxWidthClassName = 'max-w-lg',
  showHeading = true,
  noPadding = false,
}: {
  heading?: string
  logoOnHeading?: boolean
  openFrom: 'right' | 'left'
  children: React.ReactNode
  type: AsideType
  className?: string
  contentMaxWidthClassName?: string
  showHeading?: boolean
  noPadding?: boolean
}) {
  const { type: activeType, close } = useAside()
  const open = type === activeType

  const onClose = close

  const hasHeading = !!heading || logoOnHeading

  return (
    <Dialog as="div" className={`relative z-50 ${className}`} onClose={onClose} open={open}>
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-900/50 duration-300 ease-out data-closed:opacity-0"
      />

      <div className="fixed inset-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className={clsx('fixed inset-y-0 flex max-w-full', openFrom === 'right' && 'right-0')}>
            <DialogPanel
              transition
              className={clsx(
                contentMaxWidthClassName,
                'h-screen w-screen translate-x-0 overflow-hidden bg-white text-start align-middle shadow-xl transition duration-200 ease-in-out dark:bg-neutral-800',
                openFrom === 'left' && 'data-closed:-translate-x-20 data-closed:opacity-0',
                openFrom === 'right' && 'data-closed:translate-x-20 data-closed:opacity-0'
              )}
            >
          <div className={clsx('flex h-full flex-col', !noPadding && 'px-4 md:px-8')}>
                {showHeading ? (
                  <header
                    className={`flex h-16 flex-shrink-0 items-center  border-b border-neutral-900/10 md:h-20 ${
                      hasHeading ? 'justify-between' : 'justify-end'
                    }`}
                  >
                    {hasHeading && (
                      <>
                        {!!heading && !logoOnHeading && (
                          <DialogTitle>
                            <span className="font-family-antonio text-[14px] font-medium">{heading}</span>
                          </DialogTitle>
                        )}
                        {logoOnHeading && (
                          <Link href="/" className="block" onClick={onClose}>
                            <Image
                              src="/images/Cupcake-Logo.png"
                              alt="CupCake Desires Logo"
                              width={160}
                              height={50}
                              className="h-14 w-auto"
                            />
                          </Link>
                        )}
                      </>
                    )}

                    <button type="button" className="group -m-4 cursor-pointer p-4" onClick={onClose}>
                      <HugeiconsIcon
                        className="transition-transform duration-200 group-hover:rotate-90"
                        icon={Cancel01Icon}
                        size={24}
                        strokeWidth={1}
                      />
                    </button>
                  </header>
                ) : null}
                <div className="flex-1 overflow-hidden">{children}</div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/* Use for associating arialabelledby with the title*/
Aside.Title = DialogTitle

export function useDrawer(openDefault = false) {
  const [isOpen, setIsOpen] = useState(openDefault)

  function openDrawer() {
    setIsOpen(true)
  }

  function closeDrawer() {
    setIsOpen(false)
  }

  return {
    isOpen,
    openDrawer,
    closeDrawer,
  }
}

type AsideType = 'search' | 'cart' | 'closed' | 'sidebar-navigation' | 'category-filters' | 'product-quick-view'
type AsideContextValue = {
  type: AsideType
  open: (mode: AsideType) => void
  close: () => void
  productQuickViewHandle?: string
  setProductQuickViewHandle: (handle: string) => void
}
//
const AsideContext = createContext<AsideContextValue | null>(null)

export function AsideProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<AsideType>('closed')
  const [productQuickViewHandle, setProductQuickViewHandle] = useState<string>()

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
        productQuickViewHandle,
        setProductQuickViewHandle,
      }}
    >
      {children}
    </AsideContext.Provider>
  )
}

export function useAside() {
  const aside = useContext(AsideContext)
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider')
  }
  return aside
}
