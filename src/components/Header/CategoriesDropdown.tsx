'use client'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { Link } from '../Link'

interface Category {
  _id?: string
  name: string
  handle: string
  description: string
  icon: string
}

interface Props {
  className?: string
}

const ICONS: Record<string, string> = {
  'health-and-wellness': `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
    </svg>`,
  'build-muscle': `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 7H18V6A2 2 0 0 0 16 4H8A2 2 0 0 0 6 6V7H5A3 3 0 0 0 2 10V19A3 3 0 0 0 5 22H19A3 3 0 0 0 22 19V10A3 3 0 0 0 19 7M8 6H16V7H8V6Z"/>
    </svg>`,
  'weight-management': `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.5 4.5C15.55 4.5 13.45 4.9 11.5 6C9.55 4.9 7.45 4.5 5.5 4.5C3.5 4.5 2 6 2 8S3.5 11.5 5.5 11.5C7.45 11.5 9.55 11.1 11.5 10C13.45 11.1 15.55 11.5 17.5 11.5C19.5 11.5 21 10 21 8S19.5 4.5 17.5 4.5M17.5 9.5C16.06 9.5 14.56 9.11 13.5 8.5C14.56 7.89 16.06 7.5 17.5 7.5C18.33 7.5 19 7.17 19 8S18.33 9.5 17.5 9.5M5.5 9.5C4.67 9.5 4 8.83 4 8S4.67 6.5 5.5 6.5C6.94 6.5 8.44 6.89 9.5 7.5C8.44 8.11 6.94 8.5 5.5 8.5M12 13V19H14V21H10V13H12Z"/>
    </svg>`,
  'pre-workout': `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L4.86 7.71L13.43 16.29L9.86 19.86L11.29 21.29L12.71 19.86L14.14 21.29L16.29 19.14L17.71 20.57L19.14 19.14L17.71 17.71L19.86 15.57L20.57 14.86Z"/>
    </svg>`,
  'muscle-recovery': `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.5 14H20.5L22 15.5V20.5L20.5 22H15.5L14 20.5V15.5L15.5 14M16 16V20H20V16H16M10.5 2H13.5L15 3.5V6.5L13.5 8H10.5L9 6.5V3.5L10.5 2M11 4V6H13V4H11M8.5 9H11.5L13 10.5V13.5L11.5 15H8.5L7 13.5V10.5L8.5 9M9 11V13H11V11H9M3.5 7H6.5L8 8.5V11.5L6.5 13H3.5L2 11.5V8.5L3.5 7M4 9V11H6V9H4"/>
    </svg>`,
}

const DEFAULT_ICON = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/></svg>`

export default function CategoriesDropdown({ className }: Props) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/navigation?activeOnly=true')
        const data = await res.json()
        if (data.success) {
          const filtered = data.data
            .filter((item: any) => item.type === 'category')
            .sort((a: any, b: any) => a.position - b.position)
            .map((item: any) => ({
              _id: item._id,
              name: item.name,
              handle: item.handle,
              description: item.description,
              icon: ICONS[item.handle] || DEFAULT_ICON,
            }))

          setCategories(filtered)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className={className}>
      <Popover className="group">
        <PopoverButton className="flex items-center gap-1 rounded-md p-2.5 text-xl font-bold text-black transition-colors duration-200 hover:text-primary-600 focus:ring-0 focus:outline-hidden active:outline-none md:text-lg dark:hover:text-primary-400">
          <span className="font-family-antonio text-[18px] font-bold">SHOP BY GOALS</span>
          <ChevronDownIcon
            className="size-7 text-neutral-700 transition-transform duration-200 group-data-open:rotate-180 dark:text-neutral-300"
            aria-hidden="true"
          />
        </PopoverButton>

        <PopoverPanel
          anchor="bottom start"
          transition
          className="z-10 mt-4 w-80 rounded-2xl border border-neutral-100 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0 sm:px-0 dark:border-neutral-800 dark:ring-white/10"
        >
          <div className="relative grid grid-cols-1 gap-1 bg-white p-4 dark:bg-neutral-900">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Shop by Goals</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Find the perfect supplements for your fitness goals
              </p>
            </div>

            {categories.map((item, index) => (
              <Link
                key={item._id || index}
                href={`/collections/${item.handle}`}
                className="group flex items-center rounded-xl p-2 transition-all duration-200 hover:bg-neutral-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-neutral-800"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: item.icon }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-all duration-200 group-hover:scale-110 group-hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:group-hover:bg-primary-900/30"
                />
                <div className="ms-4 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-neutral-100 dark:group-hover:text-primary-400">
                    {item.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{item.description}</p>
                </div>
                <svg
                  className="h-4 w-4 text-neutral-400 transition-colors duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* FOOTER */}
          <div className="rounded-b-2xl bg-linear-to-r from-primary-50 to-primary-100 p-4 dark:from-neutral-800 dark:to-neutral-700">
            <Link
              href="/collections/all-items"
              className="group flex items-center justify-between transition-transform duration-200 hover:translate-x-1"
            >
              <div>
                <span className="block text-sm font-semibold text-neutral-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-neutral-100 dark:group-hover:text-primary-400">
                  Browse All Products
                </span>
                <span className="mt-1 block text-xs text-neutral-600 dark:text-neutral-400">
                  Discover our complete supplement collection
                </span>
              </div>
              <svg
                className="h-5 w-5 text-primary-600 transition-transform duration-200 group-hover:translate-x-1 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </PopoverPanel>
      </Popover>
    </div>
  )
}
