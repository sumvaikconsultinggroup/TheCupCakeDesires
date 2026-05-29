// src/components/Header/AccountDropdown.jsx
'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Heart, LogOut, Package, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const AccountDropdown = () => {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return
      try {
        const { data } = await axios.get('/api/wishlists')
        if (data && data.wishlist) {
          setWishlistCount(data.wishlist.length)
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      }
    }

    if (user) {
      fetchWishlist()
    }

    const handleWishlistUpdate = () => fetchWishlist()
    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate)
  }, [user])

  if (!isLoaded || !user) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-cream-deep" />
  }

  const initial =
    (user.firstName?.[0] || user.fullName?.[0] || user.primaryEmailAddress?.emailAddress?.[0] || 'C')
      .toUpperCase()

  return (
    <div className="group relative flex h-full items-center">
      <button
        aria-label="Account menu"
        className="font-bake-display flex h-10 w-10 items-center justify-center rounded-full bg-cocoa text-[15px] font-medium leading-none text-ivory ring-2 ring-transparent transition-all hover:ring-rose-accent/40"
      >
        {initial}
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-60 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_18px_40px_-18px_rgba(46,31,21,0.25)]">
          <div className="border-b border-line bg-cream px-4 py-3">
            <p className="font-bake-display truncate text-[15px] font-medium text-cocoa">
              {user.fullName || 'Guest'}
            </p>
            <p className="bake-body-sm truncate text-taupe">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <div className="py-2">
            <Link
              href="/account"
              className="font-bake-body flex items-center gap-3 px-4 py-2.5 text-[14px] text-cocoa transition-colors hover:bg-cream-deep"
            >
              <UserIcon className="h-4 w-4" strokeWidth={1.8} />
              <span>Account</span>
            </Link>
            <Link
              href="/account-wishlists"
              className="font-bake-body flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] text-cocoa transition-colors hover:bg-cream-deep"
            >
              <span className="flex items-center gap-3">
                <Heart className="h-4 w-4" strokeWidth={1.8} />
                Wishlist
              </span>
              {wishlistCount > 0 && (
                <span className="font-bake-body flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-accent px-1.5 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="font-bake-body flex items-center gap-3 px-4 py-2.5 text-[14px] text-cocoa transition-colors hover:bg-cream-deep"
            >
              <Package className="h-4 w-4" strokeWidth={1.8} />
              <span>View orders</span>
            </Link>
          </div>
          <div className="border-t border-line py-2">
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="font-bake-body flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-rose-accent transition-colors hover:bg-cream-deep"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountDropdown
