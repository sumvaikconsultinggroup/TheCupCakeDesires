'use client'

import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { useAuth, useUser } from '@/context/UserAuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  ChevronDown,
  ChevronRight,
  Clock,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Percent,
  Phone,
  Search,
  Shield,
  ShoppingBag,
  Truck,
  User,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface NavItem {
  id: string
  name: string
  href: string
  type: 'category' | 'subcategory' | 'link' | 'megamenu'
  icon?: string
  badge?: string
  badgeColor?: string
  description?: string
  image?: { src: string; alt: string }
  showInMobile?: boolean
  openInNewTab?: boolean
  children?: NavItem[]
  featuredProducts?: {
    id: string
    title: string
    handle: string
    image?: string
    price?: number
  }[]
}

// Fallback categories if API fails
const fallbackCategories: NavItem[] = [
  {
    id: '1',
    name: 'Protein',
    href: '/collections/protein',
    type: 'megamenu',
    description: 'Premium protein for maximum muscle growth',
    image: { src: '/GibbonBanner-1.png', alt: 'Protein' },
    children: [
      { id: '1-1', name: 'Whey Protein', href: '/collections/whey-protein', type: 'subcategory', badge: 'Bestseller' },
      { id: '1-2', name: 'Whey Isolate', href: '/collections/whey-isolate', type: 'subcategory', badge: 'Premium' },
      { id: '1-3', name: 'Plant Protein', href: '/collections/plant-protein', type: 'subcategory', badge: 'Vegan' },
      { id: '1-4', name: 'Casein Protein', href: '/collections/casein', type: 'subcategory' },
    ],
  },
  {
    id: '2',
    name: 'Pre-Workout',
    href: '/collections/pre-workout',
    type: 'megamenu',
    description: 'Explosive energy for intense workouts',
    image: { src: '/GibbonBanner-2.png', alt: 'Pre-Workout' },
    children: [
      { id: '2-1', name: 'Stimulant Pre-Workout', href: '/collections/stimulant-pre-workout', type: 'subcategory' },
      { id: '2-2', name: 'Pump Formulas', href: '/collections/pump', type: 'subcategory' },
      { id: '2-3', name: 'Caffeine Free', href: '/collections/caffeine-free', type: 'subcategory' },
    ],
  },
  {
    id: '3',
    name: 'Vitamins & Health',
    href: '/collections/vitamins',
    type: 'category',
    children: [
      { id: '3-1', name: 'Multivitamins', href: '/collections/multivitamins', type: 'subcategory' },
      { id: '3-2', name: 'Omega 3', href: '/collections/omega-3', type: 'subcategory' },
      { id: '3-3', name: 'Vitamin D', href: '/collections/vitamin-d', type: 'subcategory' },
    ],
  },
]

const quickLinks = [
  { name: 'Bestsellers', href: '/collections/bestsellers', icon: Award },
  { name: 'New Arrivals', href: '/collections/new', icon: Clock },
  { name: 'Offers', href: '/collections/offers', icon: Percent },

]

// User Account Button Component
function UserAccountButton() {
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!isLoaded) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
  }

  if (!isSignedIn) {
    return (
      <>
        <Link
          href="/login"
          className="hidden items-center gap-2 rounded-full bg-[#1B198F] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1B198F]/90 sm:flex"
        >
          Sign In
        </Link>
        <Link
          href="/login"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 sm:hidden dark:hover:bg-neutral-800"
          aria-label="Sign In"
        >
          <User className="h-5 w-5" />
        </Link>
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B198F] text-white hover:bg-[#1B198F]/90"
      >
        {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
      </button>
      {showDropdown && (
        <div className="absolute top-12 right-0 z-50 w-48 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          <div className="border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
            <p className="text-sm font-medium">{user?.firstName || 'User'}</p>
            <p className="truncate text-xs text-neutral-500">{user?.email}</p>
          </div>
          <Link
            href="/account"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={() => setShowDropdown(false)}
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
            onClick={() => setShowDropdown(false)}
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
          <button
            onClick={() => {
              setShowDropdown(false)
              signOut()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function DynamicMegaHeader() {
  const [categories, setCategories] = useState<NavItem[]>(fallbackCategories)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  const { items } = useCart()
  const { open: openCart } = useAside()
  const cartItemCount = items.length

  // Fetch navigation from API
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/navigation')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data && data.data.length > 0) {
            setCategories(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching navigation:', error)
        // Use fallback categories
      }
    }

    fetchNavigation()
  }, [])

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      try {
        const res = await fetch(`/api/products?search=${searchQuery}&limit=5`)
        if (!res.ok) {
          console.error('Search failed:', res.status)
          setSearchResults([])
          return
        }
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          setSearchResults(data.products || data.data || [])
        } catch (e) {
          console.error('Failed to parse search response')
          setSearchResults([])
        }
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      }
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setActiveCategory(null)
  }, [pathname])

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? 'bg-white/95 shadow-md backdrop-blur-lg dark:bg-neutral-900/95' : 'bg-white dark:bg-neutral-900'
        }`}
      >
        {/* Top Bar */}
        <div className="hidden border-b border-neutral-100 bg-neutral-50 lg:block dark:border-neutral-800 dark:bg-neutral-950">
          <div className="container mx-auto flex items-center justify-between px-4 py-2 text-xs">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Phone className="h-3.5 w-3.5" />
                03 9876 5432
              </span>
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <MapPin className="h-3.5 w-3.5" />
                Australia-wide Delivery
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-green-600">
                <Truck className="h-3.5 w-3.5" />
                Free shipping on orders above $99
              </span>
              <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                <Shield className="h-3.5 w-3.5" />
                100% Authentic Products
              </span>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
              aria-label="Open Menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/images/Cupcake-Logo.png"
                alt="CupCake Desires"
                width={160}
                height={48}
                className="h-10 w-auto lg:h-12"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-1">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(category.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={category.href}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeCategory === category.name
                        ? 'text-[#1B198F]'
                        : 'text-neutral-700 hover:text-[#1B198F] dark:text-neutral-200'
                    }`}
                  >
                    {category.name}
                    {category.children && category.children.length > 0 && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${activeCategory === category.name ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                </div>
              ))}

              {/* Quick Links */}
              <div className="mx-2 h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-[#1B198F] dark:text-neutral-200"
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-12 right-0 z-50 w-80 rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl sm:w-96 dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pr-4 pl-10 text-sm outline-none focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                          {searchResults.map((product: any) => (
                            <Link
                              key={product._id || product.handle}
                              href={`/products/${product.handle}`}
                              onClick={() => {
                                setIsSearchOpen(false)
                                setSearchQuery('')
                              }}
                              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
                                {product.images?.[0]?.src && (
                                  <Image
                                    src={product.images[0].src}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                  {product.title}
                                </p>
                                <p className="text-sm font-bold text-[#1B198F]">${product.variants?.[0]?.price}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchQuery.length > 2 && searchResults.length === 0 && (
                        <p className="mt-4 text-center text-sm text-neutral-500">No products found</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 sm:flex dark:hover:bg-neutral-800"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={() => openCart('cart')}
                className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1B198F] text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Account */}
              <UserAccountButton />
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 left-0 hidden border-t border-neutral-200 bg-white shadow-2xl lg:block dark:border-neutral-700 dark:bg-neutral-900"
              onMouseEnter={() => setActiveCategory(activeCategory)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className="container mx-auto px-4 py-8">
                {categories
                  .filter((c) => c.name === activeCategory)
                  .map((category) => (
                    <div key={category.id} className="grid grid-cols-4 gap-8">
                      {/* Subcategories */}
                      <div className="col-span-2">
                        <h3 className="mb-4 text-xs font-bold tracking-wider text-neutral-500 uppercase">
                          Shop {category.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {category.children?.map((sub) => (
                            <Link
                              key={sub.id}
                              href={sub.href}
                              className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              <span className="font-medium text-neutral-700 group-hover:text-[#1B198F] dark:text-neutral-200">
                                {sub.name}
                              </span>
                              {sub.badge && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${sub.badgeColor || '#1B198F'}20`,
                                    color: sub.badgeColor || '#1B198F',
                                  }}
                                >
                                  {sub.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href={category.href}
                          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1B198F] hover:underline"
                        >
                          View All {category.name}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>

                      {/* Featured Image */}
                      {category.image && (
                        <div className="col-span-2">
                          <Link href={category.href} className="group relative block overflow-hidden rounded-2xl">
                            <div className="relative aspect-[2/1]">
                              <Image
                                src={category.image.src}
                                alt={category.image.alt || category.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                              <div className="absolute bottom-6 left-6">
                                <h4 className="mb-1 text-2xl font-bold text-white">{category.name}</h4>
                                <p className="text-sm text-white/80">{category.description}</p>
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}

                      {/* Featured Products */}
                      {category.featuredProducts && category.featuredProducts.length > 0 && (
                        <div className="col-span-4 mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                          <h4 className="mb-4 text-xs font-bold tracking-wider text-neutral-500 uppercase">
                            Featured Products
                          </h4>
                          <div className="grid grid-cols-4 gap-4">
                            {category.featuredProducts.slice(0, 4).map((product) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.handle}`}
                                className="group rounded-xl border border-neutral-100 p-3 transition-all hover:border-[#1B198F]/30 hover:shadow-lg dark:border-neutral-800"
                              >
                                {product.image && (
                                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-neutral-100">
                                    <Image
                                      src={product.image}
                                      alt={product.title}
                                      fill
                                      className="object-cover transition-transform group-hover:scale-105"
                                    />
                                  </div>
                                )}
                                <p className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-white">
                                  {product.title}
                                </p>
                                {product.price && (
                                  <p className="mt-1 text-sm font-bold text-[#1B198F]">${product.price}</p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="pb-safe fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm overflow-y-auto bg-white dark:bg-neutral-900"
              style={{ maxHeight: '100dvh' }}
            >
              {/* Header with safe area */}
              <div className="safe-area-top flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
                <Image src="/images/Cupcake-Logo.png" alt="CupCake Desires" width={120} height={36} className="h-8 w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-neutral-100 active:scale-95 dark:hover:bg-neutral-800"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4 pb-24">
                {categories.map((category) => (
                  <div key={category.id} className="border-b border-neutral-100 py-3 dark:border-neutral-800">
                    <Link
                      href={category.href}
                      className="flex min-h-[44px] items-center justify-between py-2 font-semibold text-neutral-900 active:opacity-70 dark:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {category.name}
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    </Link>
                    {category.children && category.children.length > 0 && (
                      <div className="mt-2 space-y-1 pl-4">
                        {category.children.slice(0, 4).map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            className="flex min-h-[40px] items-center justify-between py-2 text-sm text-neutral-600 active:opacity-70 dark:text-neutral-400"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub.name}
                            {sub.badge && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${sub.badgeColor || '#1B198F'}20`,
                                  color: sub.badgeColor || '#1B198F',
                                }}
                              >
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-6 space-y-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl bg-neutral-100 p-3 font-semibold active:scale-[0.98] dark:bg-neutral-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <link.icon className="h-5 w-5 text-[#1B198F]" />
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <Link
                    href="/wishlist"
                    className="flex min-h-[44px] items-center gap-3 py-2 text-neutral-700 active:opacity-70 dark:text-neutral-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart className="h-5 w-5" /> Wishlist
                  </Link>
                  <Link
                    href="/account"
                    className="flex min-h-[44px] items-center gap-3 py-2 text-neutral-700 active:opacity-70 dark:text-neutral-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" /> My Account
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
