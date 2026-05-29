'use client'

import NcInputNumber from '@/components/NcInputNumber'
import Prices from '@/components/Prices'
import { CartItem, PromoCode, useCart } from '@/components/useCartStore'
import Breadcrumb from '@/shared/Breadcrumb'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import { CheckIcon } from '@heroicons/react/24/outline'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface PromoResponse {
  success: boolean
  message: string
  promoCode?: PromoCode
  applicableProductIds?: string[]
}

const CartPage = () => {
  const {
    items,
    removeItem,
    updateItemQuantity,
    applyPromoCode,
    appliedPromoCode,
    removePromoCode,
    applicableProductIds,
  } = useCart()
  const [subtotal, setSubtotal] = useState(0)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [discount, setDiscount] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return
    setIsLoading(true)
    setPromoMessage(null)
    try {
      const response = await fetch('/api/coupons/promo-code/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          cartItems: items.map((item) => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      })

      const data: PromoResponse = await response.json()
      if (!response.ok || !data.success) {
        setPromoMessage({ type: 'error', text: data.message || 'Invalid promo code.' })
        removePromoCode()
        return
      }

      if (data.promoCode) {
        // For 'all' type coupons, pass all product IDs or empty array
        const productIds = data.applicableProductIds || []
        applyPromoCode(data.promoCode, productIds)
        setPromoMessage({ type: 'success', text: data.message })
        setPromoCodeInput('') // Clear input after successful application
      }
    } catch (error) {
      console.error('An error occurred while applying the promo code:', error)
      setPromoMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate subtotal, discount, and total
  useEffect(() => {
    const newSubtotal = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0)
    setSubtotal(newSubtotal)

    let newDiscount = 0

    if (appliedPromoCode) {
      let applicableSubtotal = 0

      // If applies to all, use full subtotal
      if (appliedPromoCode.appliesTo === 'all') {
        applicableSubtotal = newSubtotal
      } else {
        // Calculate subtotal of only applicable products
        const applicableItems = items.filter((item) => {
          const itemId = item.productId || item.id
          return applicableProductIds.includes(itemId)
        })

        applicableSubtotal = applicableItems.reduce((acc, item) => {
          return acc + (item.price || 0) * item.quantity
        }, 0)
      }

      // Calculate discount based on type
      if (appliedPromoCode.discountType === 'percentage') {
        newDiscount = (applicableSubtotal * appliedPromoCode.discountValue) / 100
      } else if (appliedPromoCode.discountType === 'fixed') {
        newDiscount = Math.min(applicableSubtotal, appliedPromoCode.discountValue)
      }
    }

    setDiscount(newDiscount)
    const finalTotal = Math.max(0, newSubtotal - newDiscount)
    setTotal(finalTotal)
  }, [items, appliedPromoCode, applicableProductIds])

  const renderStatusInstock = () => {
    return (
      <div className="flex items-center justify-center rounded-full border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
        <CheckIcon className="h-3.5 w-3.5" />
        <span className="ml-1 leading-none">In Stock</span>
      </div>
    )
  }

  const renderDiscountStatus = (item: CartItem) => {
    if (!appliedPromoCode) return null

    let isApplicable = false
    if (appliedPromoCode.appliesTo === 'all') {
      isApplicable = true
    } else {
      isApplicable = applicableProductIds.includes(item.productId)
    }

    const text = isApplicable ? 'Eligible' : 'Not eligible'
    const colorClass = isApplicable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'

    return <div className={`mt-2 inline-block rounded px-2 py-1 text-xs font-medium ${colorClass}`}>{text}</div>
  }

  const renderProduct = (item: CartItem) => {
    const { imageUrl, price, name, handle, id, quantity, variants } = item

    return (
      <div key={id} className="relative flex py-8 first:pt-0 last:pb-0 sm:py-10 xl:py-12">
        <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-32">
          {imageUrl && (
            <Image
              fill
              src={imageUrl || '/placeholder-images.webp'}
              alt={name}
              sizes="300px"
              className="rounded-xl object-contain object-center"
              priority
            />
          )}
          <Link href={'/products/' + handle} className="absolute inset-0"></Link>
        </div>

        <div className="ml-3 flex flex-1 flex-col sm:ml-6">
          <div>
            <div className="flex justify-between">
              <div className="flex-[1.5]">
                <h3 className="text-base font-semibold">
                  <Link href={'/products/' + handle}>{name}</Link>
                </h3>
                {variants && variants.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-y-1 text-sm text-neutral-600 sm:mt-2.5 dark:text-neutral-300">
                    {variants.map((variant) => (
                      <div key={variant.name}>{`${variant.name}: ${variant.option}`}</div>
                    ))}
                  </div>
                )}
                {renderDiscountStatus(item)}

                <div className="mt-3 flex w-full justify-between sm:hidden">
                  <NcInputNumber defaultValue={quantity} onChange={(value) => updateItemQuantity(id, value)} />
                  <Prices contentClass="py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium h-full" price={price || 0} />
                </div>
              </div>

              <div className="hidden text-center sm:block">
                <NcInputNumber defaultValue={quantity} onChange={(value) => updateItemQuantity(id, value)} />
              </div>

              <div className="hidden flex-1 justify-end sm:flex">
                <Prices price={price || 0} className="mt-0.5" />
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-4 text-sm">
            {renderStatusInstock()}

            <div
              className="mt-3 flex cursor-pointer items-center text-sm font-medium text-primary-600 hover:text-primary-500"
              onClick={() => removeItem(id)}
              role="button"
            >
              <span>Remove</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nc-CartPage">
      <main className="container py-16 lg:pt-20 lg:pb-28">
        <div className="mb-12 sm:mb-16">
          <h2 className="block text-2xl font-semibold sm:text-3xl lg:text-4xl">Shopping Cart</h2>
          <Breadcrumb breadcrumbs={[{ id: 1, name: 'Home', href: '/' }]} currentPage="Shopping Cart" className="mt-5" />
        </div>

        <hr className="my-10 border-neutral-200 xl:my-12 dark:border-neutral-700" />

        <div className="flex flex-col lg:flex-row">
          <div className="w-full divide-y divide-neutral-200 lg:w-[60%] xl:w-[55%] dark:divide-neutral-700">
            {items.map(renderProduct)}
          </div>
          <div className="my-10 shrink-0 border-t border-neutral-200 lg:mx-10 lg:my-0 lg:border-t-0 lg:border-l xl:mx-16 2xl:mx-20 dark:border-neutral-700"></div>
          <div className="flex-1">
            <div className="sticky top-10">
              <h3 className="text-lg font-semibold">Order Summary</h3>
              <div className="mt-7 divide-y divide-neutral-200/70 text-sm text-neutral-500 dark:divide-neutral-700/80 dark:text-neutral-400">
                <div className="flex justify-between pb-4">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span>Shipping estimate</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                    Will be Calculated at checkout
                  </span>
                </div>
                {appliedPromoCode && (
                  <div className="flex justify-between py-4">
                    <div className="flex items-center gap-x-2">
                      <span>Discount</span>
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium dark:bg-neutral-700">
                        {appliedPromoCode.code}
                      </span>
                      <span
                        className="cursor-pointer text-red-500"
                        onClick={() => {
                          removePromoCode()
                          setPromoMessage(null)
                        }}
                        title="Remove promo code"
                      >
                        (Remove)
                      </span>
                    </div>
                    <span className="font-semibold text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-4">
                  <span>Tax</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">Inclusive of GST</span>
                </div>
                <div className="flex justify-between pt-4 text-base font-semibold text-neutral-900 dark:text-neutral-200">
                  <span>Order total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              {promoMessage && (
                <div
                  className={`mt-4 rounded-lg p-4 text-sm ${
                    promoMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {promoMessage.text}
                </div>
              )}
              <div className="mt-5 flex justify-between">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    setPromoCodeInput(e.currentTarget.value)
                    if (promoMessage) setPromoMessage(null)
                  }}
                  className="form-input w-full rounded-lg border-neutral-200 bg-transparent px-4 py-3 text-sm dark:border-neutral-700"
                  placeholder="Gift card or discount code"
                />
                <button
                  onClick={handleApplyPromoCode}
                  disabled={isLoading}
                  className="ml-4 flex-shrink-0 rounded-lg bg-neutral-200 px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                >
                  {isLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>

              <ButtonPrimary href="/checkout" className="mt-8 w-full">
                Checkout
              </ButtonPrimary>
              <div className="mt-5 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                <p className="relative block pl-5">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={16}
                    color="currentColor"
                    className="absolute top-0.5 -left-1"
                    strokeWidth={1.5}
                  />
                  Learn more{` `}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="##"
                    className="font-medium text-neutral-900 underline dark:text-neutral-200"
                  >
                    Taxes
                  </a>
                  <span>
                    {` `}and{` `}
                  </span>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="##"
                    className="font-medium text-neutral-900 underline dark:text-neutral-200"
                  >
                    Shipping
                  </a>
                  {` `} infomation
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CartPage
