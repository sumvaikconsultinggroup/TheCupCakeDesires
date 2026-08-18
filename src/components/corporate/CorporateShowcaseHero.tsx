'use client'

import { useAside } from '@/components/aside/aside'
import CorporateLogoUploader from '@/components/product/CorporateLogoUploader'
import { useCart } from '@/components/useCartStore'
import { CORPORATE_FLAVOURS, findCorporatePageVariantIndex, isCorporateCakeSliceHandle, isCorporateCakeSliceMixFlavour } from '@/lib/corporate-pages'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

export type CorporateSizeOption = {
  id: string
  label: string
  price: number
  option1Value: string
  qty?: number
}

export type CorporateGalleryImage = {
  src: string
  alt: string
  /** When set, selecting this thumb also selects the matching flavour. */
  flavour?: string
}

type ProductVariant = {
  _id?: string
  option1Value?: string
  option2Value?: string
  price: number
  inventoryQty?: number
  inventoryPolicy?: 'deny' | 'continue'
  image?: string
  sku?: string
}

type ProductPayload = {
  _id: string
  handle: string
  title: string
  productCategory?: string
  allowLogoUpload?: boolean
  variants?: ProductVariant[]
  images?: { src: string; altText?: string }[]
}

type Props = {
  productHandle: string
  eyebrow: string
  title: React.ReactNode
  gallery: readonly CorporateGalleryImage[]
  sizes: readonly CorporateSizeOption[]
  /** Flavour option2 values. Defaults to Vanilla / Chocolate. */
  flavours?: readonly string[]
  flavourCaption?: string
  defaultSizeId?: string
  defaultFlavour?: string
  priceCaption?: string
  /** Max listed size label, e.g. "100" or "500 minis" */
  maxSizeLabel: string
  bulkEnquiryHref: string
  footerNote?: string
  siblingHref?: string
  siblingLabel?: string
  /**
   * `collage` — multi-image grid (corporate / mini pages).
   * `product` — large hero image synced to the selected flavour (cake slices).
   */
  galleryLayout?: 'collage' | 'product'
  /** Cart line title. Receives selected flavour for product-style naming. */
  lineItemName?: (flavour: string) => string
}

export default function CorporateShowcaseHero({
  productHandle,
  eyebrow,
  title,
  gallery,
  sizes,
  flavours = CORPORATE_FLAVOURS,
  flavourCaption = 'Choose your flavour',
  defaultSizeId,
  defaultFlavour,
  priceCaption = 'box price',
  maxSizeLabel,
  bulkEnquiryHref,
  footerNote = 'Edible logos · NDA-friendly · Melbourne delivery',
  siblingHref,
  siblingLabel,
  galleryLayout = 'collage',
  lineItemName,
}: Props) {
  const { addItem } = useCart()
  const { open: openAside } = useAside()
  const isProductLayout = galleryLayout === 'product'

  const flavourOptions = useMemo(
    () => (flavours.length > 0 ? [...flavours] : [...CORPORATE_FLAVOURS]),
    [flavours]
  )

  const [product, setProduct] = useState<ProductPayload | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [buying, setBuying] = useState(false)

  const [activeImage, setActiveImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedSizeId, setSelectedSizeId] = useState(defaultSizeId || sizes[0]?.id || '')
  const [selectedFlavour, setSelectedFlavour] = useState(
    defaultFlavour && flavourOptions.includes(defaultFlavour)
      ? defaultFlavour
      : flavourOptions[0]
  )
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)

  const selectedSize = sizes.find((s) => s.id === selectedSizeId) ?? sizes[0]

  const loadProduct = useCallback(async () => {
    setLoadingProduct(true)
    setLoadError('')
    try {
      const res = await fetch(`/api/products/${productHandle}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success || !json.data) {
        setLoadError(json.message || 'Could not load this product.')
        setProduct(null)
        return
      }
      setProduct(json.data as ProductPayload)
    } catch {
      setLoadError('Something went wrong loading this product.')
      setProduct(null)
    } finally {
      setLoadingProduct(false)
    }
  }, [productHandle])

  useEffect(() => {
    void loadProduct()
  }, [loadProduct])

  // Keep the big image in sync with the selected flavour (product layout).
  // Mix = all flavours in one box — show a random single-flavour image.
  useEffect(() => {
    if (!isProductLayout || gallery.length === 0) return
    if (isCorporateCakeSliceMixFlavour(selectedFlavour)) {
      setActiveImage(Math.floor(Math.random() * gallery.length))
      return
    }
    const byFlavour = gallery.findIndex((img) => img.flavour === selectedFlavour)
    if (byFlavour >= 0) {
      setActiveImage(byFlavour)
      return
    }
    const byIndex = flavourOptions.indexOf(selectedFlavour)
    if (byIndex >= 0 && byIndex < gallery.length) setActiveImage(byIndex)
  }, [isProductLayout, selectedFlavour, gallery, flavourOptions])

  const variants = product?.variants || []

  const activeVariant = useMemo(() => {
    if (!selectedSize || variants.length === 0) return null
    const idx = findCorporatePageVariantIndex(variants, selectedSize.option1Value, selectedFlavour)
    return idx >= 0 ? variants[idx] : null
  }, [variants, selectedSize, selectedFlavour])

  const displayPrice = activeVariant?.price ?? selectedSize?.price ?? 0
  const inStock =
    !!activeVariant &&
    (activeVariant.inventoryPolicy === 'continue' || (activeVariant.inventoryQty ?? 0) > 0)
  const variantMissing = !!product && !!selectedSize && !activeVariant && !loadingProduct

  const heroImage = gallery[activeImage] || gallery[0]
  const cartDisplayName =
    lineItemName?.(selectedFlavour) ||
    (isProductLayout
      ? isCorporateCakeSliceMixFlavour(selectedFlavour)
        ? 'Assorted Mix Cake Slices'
        : `${selectedFlavour} Cake Slice`
      : product?.title || 'Corporate product')

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') setActiveImage((i) => (i + 1) % gallery.length)
      if (e.key === 'ArrowLeft') {
        setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)
      }
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen, gallery.length])

  const selectGalleryImage = (index: number) => {
    setActiveImage(index)
    const img = gallery[index]
    if (img?.flavour && flavourOptions.includes(img.flavour)) {
      setSelectedFlavour(img.flavour)
    } else if (isProductLayout && flavourOptions[index]) {
      setSelectedFlavour(flavourOptions[index])
    }
  }

  const handleBuy = () => {
    if (!product || !activeVariant || !selectedSize || buying) return
    if (!inStock) return

    setBuying(true)
    try {
      const lineVariants: { name: string; option: string }[] = [
        { name: 'Size', option: activeVariant.option1Value || selectedSize.option1Value },
        {
          name: 'Flavour',
          option: isCorporateCakeSliceMixFlavour(selectedFlavour)
            ? 'Mix (all flavours)'
            : activeVariant.option2Value || selectedFlavour,
        },
      ]
      if (logoUrl) {
        lineVariants.push({ name: 'Logo', option: logoUrl })
      }

      // Mix boxes: attach a random single-flavour image each time they add to cart.
      const cartImageUrl = isCorporateCakeSliceMixFlavour(selectedFlavour)
        ? gallery[Math.floor(Math.random() * gallery.length)]?.src ||
          heroImage?.src ||
          product?.images?.[0]?.src ||
          gallery[0]?.src
        : heroImage?.src || product?.images?.[0]?.src || gallery[0]?.src

      addItem({
        productId: product._id,
        name: cartDisplayName,
        price: activeVariant.price,
        imageUrl: cartImageUrl,
        handle: product.handle,
        category: product.productCategory,
        variant: {
          ...(activeVariant._id
            ? { id: String(activeVariant._id), _id: String(activeVariant._id) }
            : {}),
          name: [activeVariant.option1Value, activeVariant.option2Value].filter(Boolean).join(' / '),
          option1Value: activeVariant.option1Value,
          option2Value: activeVariant.option2Value,
          sku: activeVariant.sku,
          price: activeVariant.price,
          inventoryQty: activeVariant.inventoryQty,
          inventoryPolicy: activeVariant.inventoryPolicy,
        },
        quantity: 1,
        variants: lineVariants,
        ...(logoUrl ? { logoUrl } : {}),
      } as any)
      openAside('cart')
    } finally {
      setBuying(false)
    }
  }

  return (
    <>
      <section className="bg-cream py-12 md:py-20">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
            {/* LEFT — gallery */}
            <div className="lg:col-span-6">
              {isProductLayout ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative block w-full overflow-hidden rounded-3xl bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-accent"
                    aria-label={`View ${heroImage?.alt || selectedFlavour}`}
                  >
                    <div className="relative aspect-square w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={heroImage?.src || activeImage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute inset-0"
                        >
                          {heroImage && (
                            <Image
                              src={heroImage.src}
                              alt={heroImage.alt}
                              fill
                              priority
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </button>

                  <p className="bake-caption mt-3 text-taupe">{selectedFlavour}</p>

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {gallery.map((img, i) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => selectGalleryImage(i)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                          activeImage === i
                            ? 'border-cocoa'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        aria-label={`Show ${img.flavour || img.alt}`}
                        aria-pressed={activeImage === i}
                      >
                        <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`grid gap-2.5 md:gap-3 ${
                      gallery.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
                    }`}
                  >
                    {gallery.map((img, i) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => {
                          setActiveImage(i)
                          setLightboxOpen(true)
                        }}
                        className={`group relative overflow-hidden rounded-2xl bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-accent md:rounded-3xl ${
                          activeImage === i ? 'ring-2 ring-cocoa' : ''
                        }`}
                        aria-label={`View ${img.alt}`}
                      >
                        <div
                          className={`relative w-full ${
                            gallery.length <= 3 ? 'aspect-square' : 'aspect-16/10'
                          }`}
                        >
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            priority={i < 2}
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="bake-caption mt-4 text-taupe">Tap any photo to open the gallery</p>
                </>
              )}
            </div>

            {/* RIGHT — buy panel */}
            <div className="lg:col-span-6 lg:sticky lg:top-28">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                {eyebrow}
              </p>
              {isProductLayout ? (
                <h1 className="bake-display-xl mt-4 max-w-[22ch]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={selectedFlavour}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      {selectedFlavour}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mt-1 block font-bake-display text-[22px] font-normal text-cocoa-soft md:text-[26px]">
                    Corporate cake slice
                  </span>
                </h1>
              ) : (
                <h1 className="bake-display-xl mt-4 max-w-[16ch]">{title}</h1>
              )}

              <div className="mt-6 flex items-baseline gap-3">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${selectedSizeId}-${selectedFlavour}-${displayPrice}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="font-bake-display text-[36px] font-semibold text-cocoa md:text-[40px]"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    ${displayPrice.toLocaleString()}
                  </motion.p>
                </AnimatePresence>
                <span className="bake-body-sm text-taupe">{priceCaption}</span>
              </div>

              <div className="mt-8">
                <p className="bake-caption text-taupe">Choose your size</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        selectedSizeId === size.id
                          ? 'border-cocoa bg-cocoa text-ivory'
                          : 'border-line bg-ivory text-cocoa hover:border-cocoa'
                      }`}
                    >
                      {size.label}
                      <span
                        className={`ml-1.5 ${
                          selectedSizeId === size.id ? 'text-ivory/80' : 'text-taupe'
                        }`}
                      >
                        ${size.price}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="bake-caption mt-3 text-taupe">
                  Need more than {maxSizeLabel}?{' '}
                  <Link
                    href={bulkEnquiryHref}
                    className="font-medium text-rose-accent underline underline-offset-2 hover:text-cocoa"
                  >
                    Enquire for a custom quote →
                  </Link>
                </p>
              </div>

              <div className="mt-6">
                <p className="bake-caption text-taupe">{flavourCaption}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {flavourOptions.map((flavour) => (
                    <button
                      key={flavour}
                      type="button"
                      onClick={() => setSelectedFlavour(flavour)}
                      className={`rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        selectedFlavour === flavour
                          ? 'border-cocoa bg-cocoa text-ivory'
                          : 'border-line bg-ivory text-cocoa hover:border-cocoa'
                      }`}
                    >
                      {flavour}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <CorporateLogoUploader
                  value={logoUrl}
                  onChange={setLogoUrl}
                  itemNoun={isCorporateCakeSliceHandle(productHandle) ? 'slice' : 'cupcake'}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={loadingProduct || buying || !product || !activeVariant || !inStock}
                  className="bake-btn bake-btn-rose min-w-[220px] disabled:opacity-60"
                >
                  {loadingProduct || buying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </span>
                  ) : variantMissing ? (
                    'Option unavailable'
                  ) : !inStock ? (
                    'Out of stock'
                  ) : (
                    <>
                      Add to cart <span aria-hidden>→</span>
                    </>
                  )}
                </button>
                <Link
                  href={bulkEnquiryHref}
                  className="font-bake-body text-[14px] font-medium text-cocoa underline decoration-rose-accent underline-offset-4 transition-colors hover:text-rose-accent"
                >
                  Or enquire for bulk
                </Link>
              </div>

              {loadError && (
                <p className="mt-3 text-[13px] text-rose-accent">
                  {loadError}{' '}
                  <button type="button" onClick={() => void loadProduct()} className="underline">
                    Retry
                  </button>
                </p>
              )}

              {siblingHref && siblingLabel && (
                <p className="bake-caption mt-4 text-taupe">
                  Looking for something else?{' '}
                  <Link
                    href={siblingHref}
                    className="font-medium text-rose-accent underline underline-offset-2 hover:text-cocoa"
                  >
                    {siblingLabel}
                  </Link>
                </p>
              )}

              <p className="bake-caption mt-5 text-taupe">
                {footerNote}
                {selectedSize && (
                  <>
                    {' '}
                    · {selectedSize.label}, {selectedFlavour}
                    {logoUrl ? ' · logo attached' : ''}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && heroImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label="Close gallery"
              className="absolute inset-0 bg-cocoa/70 backdrop-blur-sm"
              onClick={() => setLightboxOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Corporate gallery"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-4xl"
            >
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-cocoa shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)] md:aspect-16/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={gallery[activeImage].src}
                      alt={gallery[activeImage].alt}
                      fill
                      sizes="90vw"
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="bake-caption text-ivory/90">
                  {gallery[activeImage]?.flavour || gallery[activeImage]?.alt} · {activeImage + 1} /{' '}
                  {gallery.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={() =>
                      selectGalleryImage((activeImage - 1 + gallery.length) % gallery.length)
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 bg-ivory/10 text-ivory backdrop-blur transition hover:bg-ivory/20"
                  >
                    <ChevronLeft className="h-5 w-5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={() => selectGalleryImage((activeImage + 1) % gallery.length)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 bg-ivory/10 text-ivory backdrop-blur transition hover:bg-ivory/20"
                  >
                    <ChevronRight className="h-5 w-5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setLightboxOpen(false)}
                    className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 bg-ivory/10 text-ivory backdrop-blur transition hover:bg-ivory/20"
                  >
                    <X className="h-5 w-5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-1">
                {gallery.map((img, i) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => selectGalleryImage(i)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === i
                        ? 'border-ivory'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img.src} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
