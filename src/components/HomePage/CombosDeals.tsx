'use client'

import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getActiveCombos } from '../../app/admin/combos/combo-actions'
import ImagePlaceholder from '../ImagePlaceholder'
import { CakeSection, SectionHeader } from './_shared'

interface ComboItem {
  productId: string
  titleSnapshot: string
  priceSnapshot: number
  imageSnapshot?: string
  variantId?: string
  variantDetails?: {
    option1Value?: string
    option2Value?: string
    option3Value?: string
    sku?: string
    image?: string
  }
}

interface Combo {
  _id: string
  handle: string
  title: string
  description?: string
  image: string
  items: ComboItem[]
  totalOriginalPrice: number
  totalPrice: number
  totalQuantity: number
  discount: number
  discountPercentage: number
  savingsAmount: number
  status: string
}

export default function CombosDeals() {
  const { addMultipleToCart } = useCart()
  const { open: openAside } = useAside()
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const f = async () => {
      try {
        const r = await getActiveCombos(12)
        if (r.success) setCombos(r.combos || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [])

  const handleAdd = (combo: Combo) => {
    const ratio = combo.totalOriginalPrice > 0 ? combo.totalPrice / combo.totalOriginalPrice : 1
    const items = combo.items.map((item) => ({
      productId: item.productId,
      name: item.titleSnapshot,
      price: item.priceSnapshot * ratio,
      imageUrl: item.imageSnapshot || '',
      handle: combo.handle,
      variant:
        item.variantDetails && item.variantId
          ? {
              _id: item.variantId,
              id: item.variantId,
              name: item.titleSnapshot,
              option1Value: item.variantDetails.option1Value,
              option2Value: item.variantDetails.option2Value,
              option3Value: item.variantDetails.option3Value,
              sku: item.variantDetails.sku,
              price: item.priceSnapshot,
              image: item.variantDetails.image,
            }
          : undefined,
    }))
    addMultipleToCart(items as any)
    openAside('cart')
  }

  if (loading || combos.length === 0) return null
  const active = combos.filter((c) => c.status === 'active')
  if (active.length === 0) return null

  return (
    <CakeSection background="ivory">
      <SectionHeader
        eyebrow="Curated gift boxes"
        title="Boxes that"
        titleAccent="travel well."
        description="Six, twelve, or twenty-four hand-picked cupcakes in our signature kraft box — ribbon-wrapped and ready to gift, with optional hand-written notes."
        ctaLabel="See all boxes"
        ctaHref="/combos"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {active.slice(0, 6).map((combo, i) => (
          <motion.div
            key={combo._id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.3) }}
          >
            <div className="bake-card bake-img-zoom relative">
              <Link href={`/combos/${combo.handle}`}>
                <div className="relative aspect-4/5 overflow-hidden">
                  {combo.image ? (
                    <Image
                      src={combo.image}
                      alt={combo.title}
                      fill
                      sizes="(max-width:768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      ratio="absolute inset-0"
                      tone={(['cream', 'rose', 'mint', 'beige', 'gold'] as const)[i % 5]}
                      rounded="none"
                      label="Box photography"
                      hint={`${combo.title} — overhead box composition`}
                    />
                  )}
                  <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
                    <span className="bake-badge">Box of {combo.totalQuantity || combo.items.length}</span>
                    {combo.discountPercentage > 0 && (
                      <span className="bake-badge bake-badge-rose">Save {combo.discountPercentage}%</span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="px-6 py-6">
                <Link href={`/combos/${combo.handle}`}>
                  <h3 className="font-bake-display text-[22px] font-medium text-cocoa line-clamp-2 transition-colors hover:text-rose-accent">
                    {combo.title}
                  </h3>
                </Link>
                {combo.description && (
                  <p className="bake-body-sm mt-2 line-clamp-2">{combo.description}</p>
                )}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-bake-display text-[22px] font-semibold text-cocoa">
                    ${combo.totalPrice.toLocaleString()}
                  </span>
                  {combo.totalOriginalPrice > combo.totalPrice && (
                    <span className="bake-body-sm text-taupe line-through">
                      ${combo.totalOriginalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => handleAdd(combo)} className="bake-btn bake-btn-sm">
                    Add box <span aria-hidden>+</span>
                  </button>
                  <Link href={`/combos/${combo.handle}`} className="bake-btn bake-btn-sm bake-btn-ghost">
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </CakeSection>
  )
}
