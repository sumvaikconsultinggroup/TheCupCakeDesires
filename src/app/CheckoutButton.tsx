'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'

export default function CheckoutButton() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  const handleCheckout = () => {
    // Proceed to checkout (guest or logged in)
    router.push('/checkout')
  }

  // We wait for Clerk to load before rendering the button
  if (!isLoaded) {
    return <div className="h-12 w-36 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
  }

  return <ButtonPrimary onClick={handleCheckout}>Proceed to Checkout</ButtonPrimary>
}