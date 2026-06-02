'use client'

import { Link } from '@/components/Link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface SimpleItem {
  label: string
  href: string
  mega?: false
}

interface MegaColumn {
  heading: string
  links: { label: string; href: string }[]
}

interface FeaturedCard {
  title: string
  subtitle: string
  href: string
  image: string
  badge?: string
}

interface MegaItem {
  label: string
  href: string
  mega: true
  description?: string
  columns: MegaColumn[]
  featured: FeaturedCard[]
  columnLayout?: 2 | 3
}

type NavItem = SimpleItem | MegaItem

const NAV: NavItem[] = [
  {
    label: 'Shop',
    href: '/collections/all-items',
    mega: true,
    description:
      'Hand-frosted cupcakes, custom cakes and almond-meal macarons — baked to order in our Narre Warren kitchen.',
    columns: [
      {
        heading: 'Cupcake range',
        links: [
          { label: 'Standard Cupcakes', href: '/collections/standard-cupcakes' },
          { label: 'Deluxe Cupcakes', href: '/collections/deluxe-cupcakes' },
          { label: 'Mini Cupcakes', href: '/collections/mini-cupcakes' },
        ],
      },
      {
        heading: 'More to gift',
        links: [
          { label: 'Macarons', href: '/collections/macarons' },
          { label: 'Cakes', href: '/collections/cakes' },
          { label: 'Gift Voucher', href: '/collections/gift-voucher' },
        ],
      },
    ],
    featured: [
      {
        title: 'Deluxe box of 3',
        subtitle: 'Salted caramel, hazelnut, molten chocolate',
        href: '/products/deluxe-cupcake-box-3',
        image:
          'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
        badge: 'Bestseller',
      },
      {
        title: 'Macaron box of 12',
        subtitle: 'Six flavours, twelve perfect shells',
        href: '/products/macaron-box-12',
        image:
          'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&q=80',
      },
      {
        title: 'Round cakes',
        subtitle: '6-inch and 8-inch — same-day finish',
        href: '/collections/cakes',
        image:
          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
      },
    ],
  },
  {
    label: 'Event',
    href: '/collections/all-items',
    mega: true,
    columnLayout: 3,
    description:
      'Themed boxes of 12 hand-piped cupcakes for every occasion — from baby showers to Australia Day.',
    columns: [
      {
        heading: 'Personal moments',
        links: [
          { label: 'Birthday Cupcakes', href: '/collections/birthday-cupcakes' },
          { label: 'Anniversary Cupcakes', href: '/collections/anniversary-cupcakes' },
          { label: 'I Love U Cupcakes', href: '/collections/i-love-u-cupcakes' },
          { label: 'Sorry Cupcakes', href: '/collections/sorry-cupcakes' },
          { label: 'Thank U Cupcakes', href: '/collections/thank-u-cupcakes' },
        ],
      },
      {
        heading: 'Family & milestones',
        links: [
          { label: 'Wedding Cupcakes', href: '/collections/wedding-cupcakes' },
          { label: 'Baby Girl Cupcakes', href: '/collections/baby-girl-cupcakes' },
          { label: 'Baby Boy Cupcakes', href: '/collections/baby-boy-cupcakes' },
          { label: 'Baby Neutral Cupcakes', href: '/collections/baby-neutral-cupcakes' },
          { label: 'Gender Reveal Cupcakes', href: '/collections/gender-reveal-cupcakes' },
        ],
      },
      {
        heading: 'Seasonal & holidays',
        links: [
          { label: 'Christmas Cupcakes', href: '/collections/christmas-cupcakes' },
          { label: 'Easter Cupcakes', href: '/collections/easter-cupcakes' },
          { label: "Valentine's Day Cupcakes", href: '/collections/valentines-day-cupcakes' },
          { label: "Mother's Day Cupcakes", href: '/collections/mothers-day-cupcakes' },
          { label: "Father's Day Cupcakes", href: '/collections/fathers-day-cupcakes' },
          { label: 'Diwali Cupcakes', href: '/collections/diwali-cupcakes' },
          { label: 'Australia Day Cupcakes', href: '/collections/australia-day-cupcakes' },
        ],
      },
    ],
    featured: [
      {
        title: 'Birthday box',
        subtitle: '12 hand-piped birthday cupcakes',
        href: '/collections/birthday-cupcakes',
        image:
          'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80',
        badge: 'Most loved',
      },
      {
        title: 'Wedding box',
        subtitle: 'Custom colours, your flavour combo',
        href: '/collections/wedding-cupcakes',
        image:
          'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80',
      },
      {
        title: 'Christmas box',
        subtitle: 'Gingerbread, peppermint, festive piping',
        href: '/collections/christmas-cupcakes',
        image:
          'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
      },
    ],
  },
  { label: 'Corporate', href: '/corporate' },
  { label: 'Birthdays', href: '/bday-party' },
  { label: 'About', href: '/about-us' },
  { label: 'Stories', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export default function PrimaryNav() {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpenKey(null), 120)
  }

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeItem =
    openKey && (NAV.find((n) => n.label === openKey) as MegaItem | undefined)

  return (
    <>
      <nav
        className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center md:flex"
        onMouseLeave={scheduleClose}
      >
        {NAV.map((item) => {
          const isMega = (item as MegaItem).mega
          const isOpen = openKey === item.label
          return (
            <div
              key={item.label}
              className="relative h-full"
              onMouseEnter={() => {
                cancelClose()
                if (isMega) setOpenKey(item.label)
                else setOpenKey(null)
              }}
            >
              <Link
                href={item.href}
                className={`group relative inline-flex h-full items-center gap-1 px-4 text-[14px] font-medium transition-colors ${
                  isOpen ? 'text-cocoa' : 'text-cocoa-soft hover:text-cocoa'
                }`}
              >
                {item.label}
                {isMega && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      isOpen ? 'rotate-180 text-rose-accent' : ''
                    }`}
                    strokeWidth={1.8}
                  />
                )}
                <span
                  aria-hidden
                  className={`absolute bottom-[26px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-rose-accent transition-all duration-300 ${
                    isOpen ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-4 group-hover:opacity-60'
                  }`}
                />
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Mega menu panel */}
      <AnimatePresence>
        {activeItem && (
          <>
            {/* Backdrop hint — soft fade behind so the menu feels anchored */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none fixed inset-x-0 top-20 z-30 hidden h-[calc(100vh-5rem)] bg-cocoa/15 backdrop-blur-[2px] md:block md:top-24 md:h-[calc(100vh-6rem)]"
              aria-hidden
            />

            <motion.div
              key={activeItem.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              role="region"
              aria-label={`${activeItem.label} menu`}
              className="font-bake-body absolute left-0 right-0 top-full z-40 hidden border-b border-line bg-ivory text-cocoa shadow-[0_30px_60px_-30px_rgba(46,31,21,0.35)] md:block"
            >
              <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-8 px-8 py-10 lg:gap-12 lg:px-12 lg:py-12">
                {/* Left intro column */}
                <div className="col-span-3">
                  <p className="bake-eyebrow text-taupe">{activeItem.label}</p>
                  <h3 className="font-bake-display mt-3 text-[22px] font-medium leading-tight text-cocoa">
                    Browse the{' '}
                    <span className="bake-display-italic text-rose-accent">menu.</span>
                  </h3>
                  {activeItem.description && (
                    <p className="bake-body-sm mt-3 text-cocoa-soft">
                      {activeItem.description}
                    </p>
                  )}
                  <Link
                    href={activeItem.href}
                    className="font-bake-body mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                    onClick={() => setOpenKey(null)}
                  >
                    Shop all {activeItem.label.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </Link>
                </div>

                {/* Link columns — width adapts to 2 or 3 columns */}
                <div
                  className={`grid gap-x-6 gap-y-2 ${
                    activeItem.columnLayout === 3
                      ? 'col-span-5 grid-cols-3'
                      : 'col-span-4 grid-cols-2'
                  }`}
                >
                  {activeItem.columns.map((col) => (
                    <div key={col.heading}>
                      <p className="bake-caption text-rose-accent">{col.heading}</p>
                      <ul className="mt-3 space-y-2">
                        {col.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              onClick={() => setOpenKey(null)}
                              className="font-bake-body inline-flex items-center text-[14px] text-cocoa-soft transition-colors hover:text-rose-accent"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Featured cards — image on top, text below */}
                <div
                  className={`grid gap-4 ${
                    activeItem.columnLayout === 3
                      ? 'col-span-4 grid-cols-3'
                      : 'col-span-5 grid-cols-3'
                  }`}
                >
                  {activeItem.featured.map((f, idx) => (
                    <Link
                      key={f.href + idx}
                      href={f.href}
                      onClick={() => setOpenKey(null)}
                      className="group block"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream-deep">
                        <Image
                          src={f.image}
                          alt={f.title}
                          fill
                          sizes="(max-width: 1320px) 20vw, 220px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {f.badge && (
                          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-ivory/95 px-2.5 py-1 text-[10px] font-medium tracking-[0.06em] text-cocoa backdrop-blur">
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-bake-display text-[14px] font-medium leading-tight text-cocoa transition-colors group-hover:text-rose-accent">
                          {f.title}
                        </p>
                        <p className="bake-caption mt-1 text-taupe">{f.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
