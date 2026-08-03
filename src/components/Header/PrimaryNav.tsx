'use client'

import { Link } from '@/components/Link'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import { buildNavItems } from '@/lib/mega-menu-utils'
import type { MegaNavItem, NavItem } from '@/types/mega-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const FALLBACK_NAV = buildNavItems(DEFAULT_MEGA_MENUS)

// Grid sizing adapts to however many columns a menu actually has, so adding
// or removing a column (e.g. from the admin panel) never requires a code
// change — the layout just reflows.
function getEventGridClasses(columnCount: number) {
  if (columnCount >= 4) {
    return { columns: 'col-span-6 grid-cols-4', featured: 'col-span-3 grid-cols-3' }
  }
  if (columnCount === 3) {
    return { columns: 'col-span-5 grid-cols-3', featured: 'col-span-4 grid-cols-3' }
  }
  return { columns: 'col-span-4 grid-cols-2', featured: 'col-span-5 grid-cols-3' }
}

interface PrimaryNavProps {
  nav?: NavItem[]
}

interface HoverPreview {
  src: string
  alt: string
  href: string
  label: string
}

export default function PrimaryNav({ nav = FALLBACK_NAV }: PrimaryNavProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null)
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

  // Reset the hovered preview whenever the open menu changes.
  useEffect(() => {
    setHoverPreview(null)
  }, [openKey])

  const activeItem =
    openKey && (nav.find((n) => n.label === openKey) as MegaNavItem | undefined)

  return (
    <>
      <nav
        className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center md:flex"
        onMouseLeave={scheduleClose}
      >
        {nav.map((item) => {
          const isMega = (item as MegaNavItem).mega
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
              className="font-bake-body absolute left-0 right-0 top-full -mt-px z-40 hidden border-b border-line bg-ivory text-cocoa shadow-[0_30px_60px_-30px_rgba(46,31,21,0.35)] md:block"
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

                {activeItem.layout === 'product-list' ? (
                  <>
                    {/* Center — product link list (split into 2 columns when many items) */}
                    <div className="col-span-5" onMouseLeave={() => setHoverPreview(null)}>
                      {activeItem.columns.map((col) => (
                        <div key={col.heading}>
                          <p className="bake-caption text-rose-accent">{col.heading}</p>
                          <ul
                            className={`mt-3 ${
                              col.links.length > 5
                                ? 'grid grid-cols-2 gap-x-6 gap-y-2.5'
                                : 'space-y-2.5'
                            }`}
                          >
                            {col.links.map((l) => (
                              <li key={l.href}>
                                <Link
                                  href={l.href}
                                  onClick={() => setOpenKey(null)}
                                  onMouseEnter={() =>
                                    l.image &&
                                    setHoverPreview({
                                      src: l.image,
                                      alt: l.label,
                                      href: l.href,
                                      label: l.label,
                                    })
                                  }
                                  onFocus={() =>
                                    l.image &&
                                    setHoverPreview({
                                      src: l.image,
                                      alt: l.label,
                                      href: l.href,
                                      label: l.label,
                                    })
                                  }
                                  className="font-bake-body group inline-flex items-center gap-1.5 text-[14px] text-cocoa-soft transition-colors hover:text-rose-accent"
                                >
                                  <span className="transition-transform group-hover:translate-x-0.5">
                                    {l.label}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Right — hero image that follows the hovered link */}
                    {(activeItem.heroImage || hoverPreview) && (
                      <div className="col-span-4">
                        {(() => {
                          const src = hoverPreview?.src || activeItem.heroImage!
                          const alt = hoverPreview?.alt || activeItem.heroImageAlt || activeItem.label
                          const href = hoverPreview?.href || activeItem.href
                          const caption = hoverPreview
                            ? `Shop ${hoverPreview.label}`
                            : `Shop all ${activeItem.label.toLowerCase()}`
                          return (
                            <Link
                              href={href}
                              onClick={() => setOpenKey(null)}
                              className="group block"
                            >
                              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-line bg-cream-deep">
                                <AnimatePresence mode="popLayout" initial={false}>
                                  <motion.div
                                    key={src}
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute inset-0"
                                  >
                                    <Image
                                      src={src}
                                      alt={alt}
                                      fill
                                      sizes="(max-width: 1320px) 32vw, 420px"
                                      className="object-cover"
                                    />
                                  </motion.div>
                                </AnimatePresence>
                                <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-ivory/95 px-3 py-1.5 text-[11px] font-medium tracking-[0.04em] text-cocoa backdrop-blur transition-all group-hover:bg-rose-accent group-hover:text-ivory">
                                  {caption}
                                  <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                                </span>
                              </div>
                            </Link>
                          )
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Link columns — width adapts to however many columns exist */}
                    <div
                      className={`grid gap-x-6 gap-y-2 ${
                        getEventGridClasses(activeItem.columns.length).columns
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
                        getEventGridClasses(activeItem.columns.length).featured
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
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
