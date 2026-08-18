import { toast } from 'react-hot-toast'
import { toast as sonnerToast } from 'sonner'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Helper function to check auth status
let getAuthStatus: (() => boolean) | null = null

export const setAuthStatusGetter = (getter: () => boolean) => {
  getAuthStatus = getter
}

// ─── Cart recovery identity ────────────────────────────────────────────────
// A stable per-browser session id so GUEST carts can be tracked, abandoned,
// emailed, and resumed — without an account. Plus a remembered email/name
// captured at checkout so later cart edits keep the recovery contact.
const CART_SESSION_KEY = 'tcd_cart_session'
const CART_IDENTITY_KEY = 'tcd_cart_identity'

export function getCartSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(CART_SESSION_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `sess_${crypto.randomUUID()}`
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(CART_SESSION_KEY, id)
  }
  return id
}

function getStoredIdentity(): { email?: string; userName?: string } {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CART_IDENTITY_KEY) || '{}')
  } catch {
    return {}
  }
}

export function rememberCartIdentity(email?: string, userName?: string) {
  if (typeof window === 'undefined') return
  const current = getStoredIdentity()
  localStorage.setItem(
    CART_IDENTITY_KEY,
    JSON.stringify({
      email: email || current.email,
      userName: userName || current.userName,
    })
  )
}

// Show a one-per-session nudge so guests aren't toast-spammed
let guestNudgeShown = false

function notifyAddedToBag(itemName: string) {
  const isSignedIn = getAuthStatus?.() ?? false
  sonnerToast(`${itemName} added to your box`, {
    description: 'Open the side cart to review your order.',
  })

  if (!isSignedIn && !guestNudgeShown) {
    guestNudgeShown = true
    setTimeout(() => {
      sonnerToast('Sign in to save your box', {
        description:
          "We're holding your cart in this browser. Sign in and we'll keep it safe across your devices.",
        action: {
          label: 'Sign in',
          onClick: () => {
            if (typeof window !== 'undefined') {
              window.location.href = `/sign-in?redirect_url=${encodeURIComponent(
                window.location.pathname
              )}`
            }
          },
        },
        duration: 8000,
      })
    }, 600)
  }
}

const syncCartWithServer = async (items: CartItem[]) => {
  if (!getAuthStatus || !getAuthStatus()) {
    return // Skip API call if user is not signed in
  }

  try {
    await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
  } catch (err) {
    console.error('Failed to sync cart:', err)
  }
}

const syncCartEdit = async (action: string, item: CartItem) => {
  if (!getAuthStatus || !getAuthStatus()) {
    return // Skip API call if user is not signed in
  }

  try {
    await fetch('/api/cart/sync/edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, item }),
    })
  } catch (err) {
    console.error('Failed to sync cart edit:', err)
  }
}

// Track cart for abandonment/recovery (debounced). Works for guests via the
// per-browser session id, and carries the remembered checkout email so a cart
// edited AFTER contact capture keeps its recovery contact.
let abandonedCartTimeout: NodeJS.Timeout | null = null

const postCartTracking = async (
  items: CartItem[],
  opts?: { email?: string; userName?: string; status?: 'active' | 'checkout_started' }
) => {
  const identity = getStoredIdentity()
  try {
    await fetch('/api/analytics/track-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
          variants: item.variants,
          handle: item.handle,
          category: item.category,
        })),
        sessionId: getCartSessionId(),
        email: opts?.email || identity.email,
        userName: opts?.userName || identity.userName,
        status: opts?.status || 'active',
      }),
    })
  } catch (err) {
    console.error('Failed to track cart:', err)
  }
}

const trackAbandonedCart = (items: CartItem[], email?: string, userName?: string) => {
  if (abandonedCartTimeout) {
    clearTimeout(abandonedCartTimeout)
  }
  // Debounce: only track after 2 seconds of inactivity
  abandonedCartTimeout = setTimeout(() => {
    postCartTracking(items, { email, userName })
  }, 2000)
}

export interface PromoCode {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  appliesTo?: 'all' | 'products' | 'categories'
  productIds?: string[]
  categoryNames?: string[]
}

export interface ProductVariant {
  id?: string
  name: string
  option: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  imageUrl?: string
  variants?: ProductVariant[]
  variant?: {
    id: string
    name: string
    option1Value?: string
    option2Value?: string
    option3Value?: string
    sku?: string
    price?: number
    compareAtPrice?: number
    image?: string
    inventoryQty?: number
    inventoryPolicy?: 'deny' | 'continue'
  }
  quantity: number
  comapreAtPrice?: number
  handle: string
  category?: string
  /** Corporate logo artwork uploaded for this line (Cloudinary URL). */
  logoUrl?: string
  /** Smallest quantity this line can be reduced to (e.g. 3 for per-cupcake pricing). */
  minOrderQty?: number
}

export interface OrderDetails {
  orderId: string
  name: string
  phone: string
  address: string
  email: string
  cartItems: CartItem[]
  price: number
  discount: number
  paymentMethod: string
}

interface CartStore {
  items: CartItem[]
  totalItems: number
  appliedPromoCode: PromoCode | null
  applicableProductIds: string[]
  orderDetails: OrderDetails | null
  userInfo: {
    name: string
    lastName: string
    phone: string
    address: string
    email: string
    city: string
    state: string
    country: string
    zipcode: string
    addressType?: string
    gender?: string
    dob?: string
    id?: string
  } | null
  orderSummary: {
    subtotal: number
    discount: number
    shipping: number
    taxes: number
    total: number
    isExpressDelivery?: boolean
  } | null
  orderSuccess: boolean
  paymentMethod: string | null
  addItem: (data: Omit<CartItem, 'id'>) => void
  addMultipleToCart: (data: Omit<CartItem, 'quantity' | 'id'>[]) => void
  removeItem: (id: string) => void
  updateItemQuantity: (id: string, quantity: number) => void
  removeAll: () => void
  applyPromoCode: (promoCode: PromoCode, applicableProductIds: string[]) => void
  removePromoCode: () => void
  validatePromoCode: () => void
  setOrderDetails: (details: OrderDetails) => void
  setUserInfo: (info: {
    name: string
    lastName: string
    phone: string
    address: string
    email: string
    city: string
    state: string
    country: string
    zipcode: string
    addressType?: string
    gender?: string
    dob?: string
    id?: string
  }) => void
  setOrderSummary: (summary: {
    subtotal: number
    discount: number
    shipping: number
    taxes: number
    total: number
    isExpressDelivery?: boolean
  }) => void
  setOrderSuccess: (status: boolean) => void
  setPaymentMethod: (method: string | null) => void
  refreshPrices: () => Promise<void>
  /** Capture checkout contact (guest or user) for cart-recovery emails. */
  captureCheckoutContact: (email: string, userName?: string) => void
  /** Replace the local cart with items restored from a recovery link. */
  resumeCartFromServer: (
    items: Array<{
      id?: string
      productId: string
      productName?: string
      name?: string
      imageUrl?: string
      price: number
      quantity: number
      handle?: string
      variant?: CartItem['variant']
      variants?: CartItem['variants']
      category?: string
    }>
  ) => void
}

const generateCartItemId = (productId: string, variants?: ProductVariant[]): string => {
  if (!variants || variants.length === 0) {
    return productId
  }
  const variantString = variants
    .map((v) => `${v.name}:${v.option}`)
    .sort()
    .join('-')
  return `${productId}-${variantString}`
}

export const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      totalItems: 0,
      appliedPromoCode: null,
      applicableProductIds: [],
      orderDetails: null,
      userInfo: null,
      orderSummary: null,
      orderSuccess: false,
      paymentMethod: null,
      addItem: (data) => {
        const { productId, variants, quantity, variant } = data

        // Check if product has stock information
        if (variant && typeof variant.inventoryQty === 'number') {
          if (variant.inventoryQty === 0) {
            toast.error('This item is out of stock')
            return
          }

          if (variant.inventoryQty < quantity) {
            toast.error(`Only ${variant.inventoryQty} items available in stock`)
            return
          }
        }

        const qtyRequested = quantity && quantity > 0 ? quantity : 1
        const minQty = Math.max(1, data.minOrderQty || 1)
        const qtyToAdd = qtyRequested
        const cartItemId = generateCartItemId(productId, variants)
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === cartItemId)

        if (existingItem) {
          // Check stock when updating quantity
          const newQuantity = existingItem.quantity + qtyToAdd
          if (variant && typeof variant.inventoryQty === 'number' && newQuantity > variant.inventoryQty) {
            toast.error(`Only ${variant.inventoryQty} items available in stock`)
            return
          }

          notifyAddedToBag(data.name || 'Item')
          set({
            items: currentItems.map((item) =>
              item.id === cartItemId ? { ...item, quantity: item.quantity + qtyToAdd } : item
            ),
            totalItems: get().totalItems + qtyToAdd,
          })
        } else {
          const newItem: CartItem = {
            ...data,
            id: cartItemId,
            quantity: Math.max(qtyToAdd, minQty),
            ...(minQty > 1 ? { minOrderQty: minQty } : {}),
          }

          notifyAddedToBag(data.name || 'Item')
          set({ items: [...currentItems, newItem], totalItems: get().totalItems + Math.max(qtyToAdd, minQty) })
        }
        get().validatePromoCode()

        // Sync cart with server (automatically checks auth status)
        syncCartWithServer(get().items)

        // Track abandoned cart
        trackAbandonedCart(get().items)
      },
      addMultipleToCart: (itemsToAdd) => {
        const currentItems = get().items
        let newTotalItems = get().totalItems
        const updatedItems = [...currentItems]

        itemsToAdd.forEach((itemData) => {
          const { productId, variants } = itemData
          const cartItemId = generateCartItemId(productId, variants)
          const existingItemIndex = updatedItems.findIndex((item) => item.id === cartItemId)

          if (existingItemIndex > -1) {
            const existingItem = updatedItems[existingItemIndex]
            updatedItems[existingItemIndex] = { ...existingItem, quantity: existingItem.quantity + 1 }
            newTotalItems++
          } else {
            const minQty = Math.max(1, itemData.minOrderQty || 1)
            const newItem: CartItem = {
              ...itemData,
              id: cartItemId,
              quantity: minQty,
              ...(minQty > 1 ? { minOrderQty: minQty } : {}),
            }
            updatedItems.push(newItem)
            newTotalItems += newItem.quantity
          }
        })

        toast.success(`${itemsToAdd.length} items added to cart.`)
        set({ items: updatedItems, totalItems: newTotalItems })
        get().validatePromoCode()

        // Sync cart with server (automatically checks auth status)
        syncCartWithServer(get().items)
      },
      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        // Sync with server (automatically checks auth status)
        syncCartEdit('remove', item)

        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          totalItems: Math.max(0, state.totalItems - item.quantity),
        }))
        toast.success('Item removed.')

        // Track abandoned cart
        trackAbandonedCart(get().items)
      },
      updateItemQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        const item = get().items.find((i) => i.id === id)
        if (!item) return

        // Never let a line drop below the product's minimum order quantity.
        if (item.minOrderQty && quantity < item.minOrderQty) {
          quantity = item.minOrderQty
        }

        // Sync with server (automatically checks auth status)
        syncCartEdit('updateQty', { ...item, quantity })

        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          totalItems: Math.max(0, state.totalItems + (quantity - item.quantity)),
        }))

        // Track abandoned cart
        trackAbandonedCart(get().items)
      },
      removeAll: () =>
        set({
          items: [],
          totalItems: 0,
          appliedPromoCode: null,
          applicableProductIds: [],
          userInfo: null,
          orderSummary: null,
          orderSuccess: false,
          paymentMethod: null
        }),
      applyPromoCode: (promoCode: PromoCode, applicableProductIds: string[]) => {
        set({ appliedPromoCode: promoCode, applicableProductIds })
        toast.success('Promo code applied!')
      },
      removePromoCode: () => {
        set({ appliedPromoCode: null, applicableProductIds: [] })
      },
      validatePromoCode: () => {
        const { items, appliedPromoCode, applicableProductIds, removePromoCode } = get()
        if (!appliedPromoCode) return

        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
        if (appliedPromoCode.minOrderAmount && subtotal < appliedPromoCode.minOrderAmount) {
          removePromoCode()
          toast.error(`Promo code removed. Order total is below the minimum of $${appliedPromoCode.minOrderAmount}.`)
          return
        }

        if (appliedPromoCode.appliesTo === 'products' && appliedPromoCode.productIds) {
          const hasApplicableItem = items.some((item) => appliedPromoCode.productIds?.includes(item.productId))
          if (!hasApplicableItem) {
            removePromoCode()
            toast.error('Promo code removed as applicable products are no longer in the cart.')
          }
        }

        if (appliedPromoCode.appliesTo === 'categories' && appliedPromoCode.categoryNames) {
          const hasApplicableCategory = items.some((item) =>
            item.category && appliedPromoCode.categoryNames?.includes(item.category)
          )
          if (!hasApplicableCategory) {
            removePromoCode()
            toast.error('Promo code removed as applicable categories are no longer in the cart.')
          }
        }
      },
      setOrderDetails: (details: OrderDetails) => {
        set({ orderDetails: details })
      },
      setUserInfo: (info) => {
        set({ userInfo: info })
      },
      setOrderSummary: (summary) => {
        set({ orderSummary: summary })
      },
      setOrderSuccess: (status) => set({ orderSuccess: status }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      captureCheckoutContact: (email, userName) => {
        if (!email) return
        rememberCartIdentity(email, userName)
        // Fire immediately (no debounce) — reaching checkout with contact info
        // is the strongest recovery signal we get for guests.
        postCartTracking(get().items, { email, userName, status: 'checkout_started' })
      },
      resumeCartFromServer: (serverItems) => {
        const items: CartItem[] = (serverItems || [])
          .filter((it) => it && it.productId && typeof it.price === 'number')
          .map((it) => ({
            id: it.id || (it.variants?.length
              ? generateCartItemId(it.productId, it.variants)
              : it.variant?.id
                ? `${it.productId}-${it.variant.id}`
                : it.productId),
            productId: it.productId,
            name: it.productName || it.name || 'Item',
            price: it.price,
            imageUrl: it.imageUrl,
            handle: it.handle || '',
            variant: it.variant,
            variants: it.variants,
            category: it.category,
            quantity: Math.max(1, it.quantity || 1),
          }))
        if (items.length === 0) return
        set({
          items,
          totalItems: items.reduce((n, i) => n + i.quantity, 0),
        })
        syncCartWithServer(items)
      },
      refreshPrices: async () => {
        const items = get().items
        if (items.length === 0) return

        try {
          const productIds = [...new Set(items.map((i) => i.productId))]
          // Fetch each product individually
          const results = await Promise.all(
            productIds.map((id) =>
              fetch(`/api/products/id/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
            )
          )

          const priceMap = new Map<string, number>()
          for (const p of results) {
            if (!p || !p._id) continue
            if (p.variants && p.variants.length > 0) {
              for (const v of p.variants) {
                if (v._id) priceMap.set(`${p._id}-${v._id}`, v.price)
              }
              if (p.variants[0]?.price) priceMap.set(p._id, p.variants[0].price)
            } else if (p.variant?.price) {
              priceMap.set(p._id, p.variant.price)
            }
          }

          const updated = items.map((item) => {
            const variantKey = item.variant?.id ? `${item.productId}-${item.variant.id}` : null
            const freshPrice = (variantKey && priceMap.get(variantKey)) || priceMap.get(item.productId)
            if (freshPrice && freshPrice !== item.price) {
              return { ...item, price: freshPrice, variant: item.variant ? { ...item.variant, price: freshPrice } : item.variant }
            }
            return item
          })

          set({ items: updated })
        } catch (err) {
          console.error('Failed to refresh cart prices:', err)
        }
      },

      // ← ADD THIS METHOD AT THE END
      syncCart: async () => {
        const items = get().items
        if (items.length === 0) {
          return
        }

        try {
          const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
          })

          if (response.ok) {
          } else {
            console.error('❌ Manual cart sync failed')
          }
        } catch (error) {
          console.error('❌ Cart sync error:', error)
        }
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        ({
          items: state.items,
          totalItems: state.totalItems,
          appliedPromoCode: state.appliedPromoCode,
          applicableProductIds: state.applicableProductIds,
          userInfo: state.userInfo,
          // orderSummary, orderDetails, orderSuccess, paymentMethod are NOT persisted
          // — they must be recomputed fresh each checkout session
        }) as CartStore,
    }
  )
)
