/** Shared “inside view” shot shown on every giant cupcake product. */
export const GIANT_CUPCAKE_INSIDE_CAPTION =
  'Inside shown is vanilla.\nGiant Cupcakes are two full cakes joined together — colours vary by flavour.'

export const GIANT_CUPCAKE_INSIDE_IMAGE = {
  src: '/images/1000051655.jpeg',
  altText:
    'Inside shown is vanilla. Giant Cupcakes are two full cakes joined together — colours vary by flavour.',
} as const

export function isGiantCupcakeInsideImage(src?: string | null): boolean {
  if (!src) return false
  return src === GIANT_CUPCAKE_INSIDE_IMAGE.src || src.endsWith('/1000051655.jpeg')
}

type ProductLike = {
  handle?: string
  tags?: string[]
  productCategory?: string
  images?: { src?: string; altText?: string }[]
}

export function isGiantCupcakeProduct(product: ProductLike): boolean {
  const handle = (product.handle || '').toLowerCase()
  if (handle.includes('giant-cupcake')) return true

  const tags = (product.tags || []).map((t) => String(t).toLowerCase())
  if (tags.some((t) => t.includes('giant-cupcake') || t.includes('giant cupcake'))) return true

  const category = (product.productCategory || '').toLowerCase()
  return category.includes('giant cupcake')
}

/**
 * Append the inside-view image after the product’s existing photos.
 * Use `force` on the giant-cupcakes collection so every listed item gets it.
 */
export function withGiantCupcakeInsideImage<T extends ProductLike>(
  product: T,
  options?: { force?: boolean }
): T {
  if (!options?.force && !isGiantCupcakeProduct(product)) return product

  const existing = Array.isArray(product.images) ? product.images : []
  if (existing.some((img) => img?.src === GIANT_CUPCAKE_INSIDE_IMAGE.src)) {
    return product
  }

  return {
    ...product,
    images: [
      ...existing,
      {
        src: GIANT_CUPCAKE_INSIDE_IMAGE.src,
        altText: GIANT_CUPCAKE_INSIDE_IMAGE.altText,
      },
    ],
  }
}

export function withGiantCupcakeInsideImages<T extends ProductLike>(
  products: T[],
  options?: { force?: boolean }
): T[] {
  return products.map((p) => withGiantCupcakeInsideImage(p, options))
}
