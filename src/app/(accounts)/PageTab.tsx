'use client'

import { Link } from '@/components/Link'
import { Heart, Package, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

const pages = [
  { name: 'Settings', link: '/account', Icon: Settings },
  { name: 'Wishlists', link: '/account-wishlists', Icon: Heart },
  { name: 'Orders', link: '/orders', Icon: Package },
]

const PageTab = () => {
  const pathname = usePathname()

  return (
    <nav aria-label="Account sections" className="border-b border-line">
      <ul className="flex flex-wrap gap-1 sm:gap-2">
        {pages.map(({ name, link, Icon }) => {
          let isActive = pathname === link
          if (link === '/orders' && pathname.startsWith('/orders')) isActive = true

          return (
            <li key={link}>
              <Link
                href={link}
                className={`group relative inline-flex items-center gap-2 px-4 py-3 text-[14px] font-medium transition-colors sm:px-5 sm:py-4 sm:text-[15px] ${
                  isActive
                    ? 'text-cocoa'
                    : 'text-cocoa-soft hover:text-cocoa'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform ${
                    isActive ? 'text-rose-accent' : 'group-hover:scale-110'
                  }`}
                  strokeWidth={1.8}
                />
                <span className="font-bake-body">{name}</span>
                {/* Active underline */}
                <span
                  aria-hidden
                  className={`absolute -bottom-px left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${
                    isActive ? 'bg-rose-accent opacity-100' : 'bg-transparent opacity-0'
                  }`}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default PageTab
