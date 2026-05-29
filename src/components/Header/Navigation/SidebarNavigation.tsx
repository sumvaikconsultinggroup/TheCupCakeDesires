'use client'

import { TNavigationItem } from '@/data/navigation'
import SocialsList from '@/shared/SocialsList/SocialsList'
import { Link } from '@/shared/link'
import { Disclosure, DisclosureButton, DisclosurePanel, useClose } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

interface SidebarNavigationProps {
  data: TNavigationItem[]
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ data }) => {
  const handleClose = useClose()
  const [categories, setCategories] = useState<{ name: string; handle: string }[]>([])
  const [allProducts, setAllProducts] = useState<{ name: string; link: string }[]>([])

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/admin/navigation?activeOnly=true')
        const data = await res.json()
        if (data.success) {
          const cats = data.data
            .filter((item: any) => item.type === 'category')
            .sort((a: any, b: any) => a.position - b.position)
            .map((item: any) => ({ name: item.name, handle: item.handle }))
          setCategories(cats)

          const prods = data.data
            .filter((item: any) => item.type === 'mega-product')
            .sort((a: any, b: any) => a.position - b.position)
            .map((item: any) => ({ name: item.name, link: item.link }))
          setAllProducts(prods)
        }
      } catch (error) {
        console.error('Error fetching navigation:', error)
      }
    }
    fetchNavigation()
  }, [])

  const _renderMenuChild = (
    item: TNavigationItem,
    itemClass = 'pl-3 text-neutral-900 dark:text-neutral-200 font-medium'
  ) => {
    return (
      <ul className="nav-mobile-sub-menu pb-1 pl-6 text-base">
        {item.children?.map((childMenu, index) => (
          <Disclosure key={index} as="li">
            <Link
              href={childMenu.href || '#'}
              className={`mt-0.5 flex rounded-lg pr-4 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${itemClass}`}
            >
              <span className={`py-2.5 ${!childMenu.children ? 'block w-full' : ''}`}>{childMenu.name}</span>
              {childMenu.children && (
                <span className="flex grow items-center" onClick={(e) => e.preventDefault()}>
                  <DisclosureButton as="span" className="flex grow justify-end">
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-neutral-500" aria-hidden="true" />
                  </DisclosureButton>
                </span>
              )}
            </Link>
            {childMenu.children && (
              <DisclosurePanel>
                {_renderMenuChild(childMenu, 'pl-3 text-neutral-600 dark:text-neutral-400')}
              </DisclosurePanel>
            )}
          </Disclosure>
        ))}
      </ul>
    )
  }

  const _renderItem = (menu: TNavigationItem, index: number) => {
    return (
      <Disclosure key={index} as="li" className="text-neutral-900 dark:text-white">
        <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <Link
            href={menu.href || '#'}
            className={clsx(!menu.children?.length && 'flex-1', 'block py-2.5')}
            onClick={handleClose}
          >
            {menu.name}
          </Link>
          {menu.children?.length && (
            <div className="flex flex-1 justify-end">
              <ChevronDownIcon className="ml-2 h-4 w-4 self-center text-neutral-500" aria-hidden="true" />
            </div>
          )}
        </DisclosureButton>
        {menu.children && <DisclosurePanel>{_renderMenuChild(menu)}</DisclosurePanel>}
      </Disclosure>
    )
  }

  const _renderCategories = () => {
    return (
      <Disclosure as="li" className="text-neutral-900 dark:text-white">
        <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800 py-2.5">
          <span className="flex-1">SHOP BY GOALS</span>
          <div className="flex flex-1 justify-end">
            <ChevronDownIcon className="ml-2 h-4 w-4 self-center text-neutral-500" aria-hidden="true" />
          </div>
        </DisclosureButton>
        <DisclosurePanel as="ul" className="nav-mobile-sub-menu pb-1 pl-6 text-base">
          {categories.map((item, index) => (
            <li key={index}>
              <Link
                href={`/collections/${item.handle}`}
                className="mt-0.5 flex rounded-lg pr-4 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 pl-3 text-neutral-600 dark:text-neutral-400 py-2.5"
                onClick={handleClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </DisclosurePanel>
      </Disclosure>
    )
  }

  const _renderAllProducts = () => {
    return (
      <Disclosure as="li" className="text-neutral-900 dark:text-white">
        <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800 py-2.5">
          <span className="flex-1">ALL PRODUCTS</span>
          <div className="flex flex-1 justify-end">
            <ChevronDownIcon className="ml-2 h-4 w-4 self-center text-neutral-500" aria-hidden="true" />
          </div>
        </DisclosureButton>
        <DisclosurePanel as="ul" className="nav-mobile-sub-menu pb-1 pl-6 text-base">
          {allProducts.map((item, index) => (
            <li key={index}>
              <Link
                href={item.link}
                className="mt-0.5 flex rounded-lg pr-4 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 pl-3 text-neutral-600 dark:text-neutral-400 py-2.5"
                onClick={handleClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </DisclosurePanel>
      </Disclosure>
    )
  }

  const _renderExtraLinks = () => {
    const links = [
      { name: 'Build your box', href: '/cupcake-builder' },
      { name: 'Birthday parties', href: '/bday-party' },
      { name: 'Cupcake Club', href: '/subscription' },
      { name: 'Stories', href: '/blog' },
      { name: 'Customer notes', href: '/reviews' },
      { name: 'Allergens & ingredients', href: '/allergen-info' },
      { name: 'Contact', href: '/contact' },
    ]

    return links.map((item) => (
      <li key={item.name} className="text-neutral-900 dark:text-white">
        <Link
          href={item.href}
          className="flex w-full cursor-pointer rounded-lg px-3 py-2.5 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={handleClose}
        >
          {item.name}
        </Link>
      </li>
    ))
  }

  return (
    <div>
      <ul className="flex flex-col gap-y-1 px-2 py-6">
        {_renderCategories()}
        {_renderAllProducts()}
        {_renderExtraLinks()}
        {data?.map(_renderItem)}
      </ul>
      
      <div className="mt-4 flex items-center justify-between px-2">
        <SocialsList />
      </div>
    </div>
  )
}

export default SidebarNavigation
