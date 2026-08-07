'use client'

import { useAuth } from '@clerk/nextjs'
import axios from 'axios'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const WishlistBtn = () => {
  const { isSignedIn } = useAuth()
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchWishlist = async () => {
    if (!isSignedIn) {
      setCount(0)
      return
    }
    try {
      const { data } = await axios.get('/api/wishlists')
      if (data && data.wishlist) {
        setCount(data.wishlist.length)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchWishlist()
    } else {
      setCount(0)
    }

    const handleWishlistUpdate = (e: any) => {
      if (e.detail && typeof e.detail.isLiked !== 'undefined') {
        setCount((prev) => (e.detail.isLiked ? prev + 1 : Math.max(0, prev - 1)))
      } else {
        fetchWishlist()
      }
    }

    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate)
    }
  }, [isSignedIn])

  if (!mounted) return null

  return (
    <Link
      href={
        isSignedIn
          ? '/account-wishlists'
          : '/sign-in?redirect_url=/account-wishlists'
      }
      aria-label="Wishlist"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-cocoa transition-colors hover:bg-cream-deep"
    >
      <Heart className="h-5 w-5" strokeWidth={1.8} />
      {count > 0 && (
        <span
          className="font-bake-body absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-accent px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-ivory"
        >
          {count}
        </span>
      )}
    </Link>
  )
}

export default WishlistBtn
