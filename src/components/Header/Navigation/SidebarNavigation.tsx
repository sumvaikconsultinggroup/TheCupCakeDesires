'use client'

import { Link } from '@/shared/link'
import SocialsList from '@/shared/SocialsList/SocialsList'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import { buildNavItems } from '@/lib/mega-menu-utils'
import type { DropdownNavItem, MegaNavItem, NavItem } from '@/types/mega-menu'
import { Disclosure, DisclosureButton, DisclosurePanel, useClose } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import React from 'react'

interface SidebarNavigationProps {
  nav?: NavItem[]
}

const FALLBACK_NAV = buildNavItems(DEFAULT_MEGA_MENUS)

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ nav = FALLBACK_NAV }) => {
  const handleClose = useClose()

  const renderLinks = (links: { label: string; href: string }[], nested = false) => (
    <ul className={clsx('pb-1 text-base', nested ? 'pl-3' : 'pl-4')}>
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          <Link
            href={link.href}
            onClick={handleClose}
            className="mt-0.5 block rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-cocoa dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )

  const renderMega = (item: MegaNavItem) => (
    <Disclosure as="li" key={item.label} className="text-neutral-900 dark:text-white">
      {({ open }) => (
        <>
          <div className="flex w-full items-center rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Link href={item.href} onClick={handleClose} className="flex-1 py-2.5">
              {item.label}
            </Link>
            <DisclosureButton
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label={`Toggle ${item.label} submenu`}
            >
              <ChevronDownIcon
                className={clsx('h-4 w-4 text-neutral-500 transition-transform', open && 'rotate-180')}
                aria-hidden="true"
              />
            </DisclosureButton>
          </div>
          <DisclosurePanel>
            {item.columns.map((column) =>
              item.columns.length > 1 ? (
                <Disclosure as="div" key={column.heading} className="pl-3">
                  {({ open: colOpen }) => (
                    <>
                      <DisclosureButton className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-taupe hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <span className="flex-1">{column.heading}</span>
                        <ChevronDownIcon
                          className={clsx(
                            'h-3.5 w-3.5 text-neutral-400 transition-transform',
                            colOpen && 'rotate-180'
                          )}
                        />
                      </DisclosureButton>
                      <DisclosurePanel>{renderLinks(column.links, true)}</DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <div key={column.heading}>{renderLinks(column.links)}</div>
              )
            )}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )

  const renderDropdown = (item: DropdownNavItem) => (
    <Disclosure as="li" key={item.label} className="text-neutral-900 dark:text-white">
      {({ open }) => (
        <>
          <div className="flex w-full items-center rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Link href={item.href} onClick={handleClose} className="flex-1 py-2.5">
              {item.label}
            </Link>
            <DisclosureButton
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label={`Toggle ${item.label} submenu`}
            >
              <ChevronDownIcon
                className={clsx('h-4 w-4 text-neutral-500 transition-transform', open && 'rotate-180')}
                aria-hidden="true"
              />
            </DisclosureButton>
          </div>
          <DisclosurePanel>{renderLinks(item.links)}</DisclosurePanel>
        </>
      )}
    </Disclosure>
  )

  const renderSimple = (item: { label: string; href: string }) => (
    <li key={item.label} className="text-neutral-900 dark:text-white">
      <Link
        href={item.href}
        onClick={handleClose}
        className="flex w-full cursor-pointer rounded-lg px-3 py-2.5 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {item.label}
      </Link>
    </li>
  )

  return (
    <div>
      <ul className="flex flex-col gap-y-1 px-2 py-6">
        {nav.map((item) => {
          if ((item as MegaNavItem).mega) return renderMega(item as MegaNavItem)
          if ((item as DropdownNavItem).dropdown) return renderDropdown(item as DropdownNavItem)
          return renderSimple(item)
        })}
        {renderSimple({ label: 'Home', href: '/' })}
      </ul>

      <div className="mt-4 flex items-center justify-between px-4">
        <SocialsList />
      </div>
    </div>
  )
}

export default SidebarNavigation
