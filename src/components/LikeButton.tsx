// src/components/LikeButton.tsx

'use client'

import { useAuth } from '@clerk/nextjs'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  className?: string
  liked?: boolean
  productId?: string
  comboId?: string
  productName?: string
  variant?: any
  itemType?: 'product' | 'combo'
}

export const useWishlist = ({ 
  productId, 
  comboId,
  productName, 
  liked = false, 
  variant,
  itemType = 'product'
}: { 
  productId?: string
  comboId?: string
  productName?: string
  liked?: boolean
  variant?: any
  itemType?: 'product' | 'combo'
}) => {
  const [isLiked, setIsLiked] = useState(liked)
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const handleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!isSignedIn) {
      toast('Please login to add items to your wishlist.')
      router.push('/sign-in')
      return
    }

    setIsLoading(true)

    const previousState = isLiked
    const newState = !isLiked
    setIsLiked(newState)

    // Dispatch optimistic update
    const itemId = itemType === 'combo' ? comboId : productId
    window.dispatchEvent(new CustomEvent('wishlist-updated', { 
      detail: { 
        productId, 
        comboId,
        itemType,
        isLiked: newState 
      } 
    }))

    try {
      if (previousState) {
        await axios.delete('/api/wishlists', { 
          data: { 
            productId, 
            comboId,
            itemType 
          } 
        })
        toast.success(`${productName} removed from wishlist`)
      } else {
        await axios.post('/api/wishlists', { 
          productId,
          comboId,
          variant,
          productName,
          itemType
        })
        toast.success(`${productName} added to wishlist`)
      }
    } catch (error: any) {
      setIsLiked(previousState)
      // Revert optimistic update
      window.dispatchEvent(new CustomEvent('wishlist-updated', { 
        detail: { 
          productId, 
          comboId,
          itemType,
          isLiked: previousState 
        } 
      }))
      
      console.error('Error updating wishlist:', error)
      
      const errorMessage = error.response?.data?.error || 'Something went wrong. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return { isLiked, isLoading, handleLike }
}

const LikeButton: React.FC<Props> = ({ 
  className = '', 
  liked = false, 
  productId,
  comboId,
  productName,
  variant,
  itemType = 'product'
}) => {
  const { isLiked, isLoading, handleLike } = useWishlist({ 
    productId, 
    comboId,
    productName, 
    liked, 
    variant,
    itemType
  })

  return (
    <button
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 nc-shadow-lg dark:bg-neutral-900 dark:text-neutral-200 disabled:opacity-50 transition-all hover:scale-110 ${className}`}
      onClick={handleLike}
      disabled={isLoading}
      aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.63 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z"
          stroke={isLiked ? '#ef4444' : 'currentColor'}
          fill={isLiked ? '#ef4444' : 'none'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default LikeButton