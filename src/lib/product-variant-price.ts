/** Resolve server-authoritative variant price for a cart line. */
export function resolveVariantPrice(
  product: {
    variants?: Array<{
      _id?: string
      option1Value?: string
      option2Value?: string
      price?: number
    }>
    variant?: { price?: number }
  } | null,
  cartVariant?: {
    id?: string
    _id?: string
    option1Value?: string
    option2Value?: string
  } | null
): number | null {
  if (!product) return null

  const variants = product.variants
  if (!variants?.length) {
    return typeof product.variant?.price === 'number' ? product.variant.price : null
  }

  const cartId = cartVariant?.id || cartVariant?._id
  if (cartId) {
    const byId = variants.find((v) => v._id && String(v._id) === String(cartId))
    if (typeof byId?.price === 'number') return byId.price
  }

  if (cartVariant?.option1Value) {
    const byOptions = variants.find(
      (v) =>
        v.option1Value === cartVariant.option1Value &&
        String(v.option2Value || '') === String(cartVariant.option2Value || '')
    )
    if (typeof byOptions?.price === 'number') return byOptions.price
  }

  return null
}

export function normalizeCartVariantId(variant?: {
  id?: string
  _id?: string
} | null): string | undefined {
  if (!variant) return undefined
  const id = variant.id || variant._id
  return id ? String(id) : undefined
}
