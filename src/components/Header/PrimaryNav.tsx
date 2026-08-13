'use client'

import { Link } from '@/components/Link'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import { buildNavItems } from '@/lib/mega-menu-utils'
import type { DropdownNavItem, MegaNavItem, NavItem } from '@/types/mega-menu'
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

  const activeMega =
    openKey &&
    (() => {
      const found = nav.find((n) => n.label === openKey)
      return found && (found as MegaNavItem).mega ? (found as MegaNavItem) : undefined
    })()

  const activeDropdown =
    openKey &&
    (() => {
      const found = nav.find((n) => n.label === openKey)
      return found && (found as DropdownNavItem).dropdown ? (found as DropdownNavItem) : undefined
    })()

  return (
    <>
      <nav
        className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center md:flex"
        onMouseLeave={scheduleClose}
      >
        {nav.map((item) => {
          const isMega = Boolean((item as MegaNavItem).mega)
          const isDropdown = Boolean((item as DropdownNavItem).dropdown)
          const isOpen = openKey === item.label
          return (
            <div
              key={item.label}
              className="relative h-full"
              onMouseEnter={() => {
                cancelClose()
                if (isMega || isDropdown) setOpenKey(item.label)
                else setOpenKey(null)
              }}
            >
              <Link
                href={item.href}
                className={`group relative inline-flex h-full items-center gap-1 px-4 text-[14px] font-medium transition-colors ${
                  isOpen ? 'text-cocoa' : 'text-cocoa-soft hover:text-cocoa'
                }`}
                aria-expanded={isMega || isDropdown ? isOpen : undefined}
                aria-haspopup={isMega || isDropdown ? 'true' : undefined}
              >
                {item.label}
                {(isMega || isDropdown) && (
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

              {/* Static compact dropdown (Corporate) */}
              <AnimatePresence>
                {isDropdown && isOpen && activeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    role="menu"
                    aria-label={`${item.label} menu`}
                    className="absolute left-1/2 top-full z-50 mt-0 w-[300px] -translate-x-1/2 pt-2"
                  >
                    <div className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_24px_48px_-24px_rgba(46,31,21,0.4)]">
                      <ul className="py-2">
                        {activeDropdown.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              role="menuitem"
                              onClick={() => setOpenKey(null)}
                              className="block px-4 py-3 transition-colors hover:bg-cream"
                            >
                              <span className="font-bake-body block text-[14px] font-medium text-cocoa">
                                {link.label}
                              </span>
                              {link.description && (
                                <span className="bake-caption mt-0.5 block text-taupe">
                                  {link.description}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Mega menu panel */}
      <AnimatePresence>
        {activeMega && (
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
              key={activeMega.label}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              role="region"
              aria-label={`${activeMega.label} menu`}
              className="font-bake-body absolute left-0 right-0 top-full -mt-px z-40 hidden border-b border-line bg-ivory text-cocoa shadow-[0_30px_60px_-30px_rgba(46,31,21,0.35)] md:block"
            >
              <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-8 px-8 py-10 lg:gap-12 lg:px-12 lg:py-12">
                {/* Left intro column */}
                <div className="col-span-3">
                  <p className="bake-eyebrow text-taupe">{activeMega.label}</p>
                  <h3 className="font-bake-display mt-3 text-[22px] font-medium leading-tight text-cocoa">
                    Browse the{' '}
                    <span className="bake-display-italic text-rose-accent">menu.</span>
                  </h3>
                  {activeMega.description && (
                    <p className="bake-body-sm mt-3 text-cocoa-soft">
                      {activeMega.description}
                    </p>
                  )}
                  <Link
                    href={activeMega.href}
                    className="font-bake-body mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                    onClick={() => setOpenKey(null)}
                  >
                    Shop all {activeMega.label.toLowerCase()}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </Link>
                </div>

                {activeMega.layout === 'product-list' ? (
                  <>
                    {/* Center — product link list (split into 2 columns when many items) */}
                    <div className="col-span-5" onMouseLeave={() => setHoverPreview(null)}>
                      {activeMega.columns.map((col, colIdx) => (
                        <div key={col.heading} className={colIdx > 0 ? 'mt-8' : undefined}>
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
                    {(activeMega.heroImage || hoverPreview) && (
                      <div className="col-span-4">
                        {(() => {
                          const src = hoverPreview?.src || activeMega.heroImage!
                          const alt = hoverPreview?.alt || activeMega.heroImageAlt || activeMega.label
                          const href = hoverPreview?.href || activeMega.href
                          const caption = hoverPreview
                            ? `Shop ${hoverPreview.label}`
                            : `Shop all ${activeMega.label.toLowerCase()}`
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
                        getEventGridClasses(activeMega.columns.length).columns
                      }`}
                    >
                      {activeMega.columns.map((col) => (
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
                        getEventGridClasses(activeMega.columns.length).featured
                      }`}
                    >
                      {activeMega.featured.map((f, idx) => (
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
