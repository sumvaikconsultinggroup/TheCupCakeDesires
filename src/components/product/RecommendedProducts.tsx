'use client'

import Image from 'next/image'
import Link from 'next/link'

interface Product {
  _id: string
  handle: string
  title: string
  images?: { src: string }[]
  variants?: { price: number }[]
}

interface RecommendedProductsProps {
  products?: Product[]
  className?: string
}

export default function RecommendedProducts({ products = [], className = '' }: RecommendedProductsProps) {
  if (!products || products.length === 0) return null

  return (
    <div className={className}>
      <h3 className="mb-4 text-lg font-bold">You May Also Like</h3>
      <div className="grid grid-cols-2 gap-4">
        {products.slice(0, 4).map((product) => (
          <Link key={product._id} href={`/products/${product.handle}`} className="group">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={product.images?.[0]?.src || '/placeholder-images.webp'}
                alt={product.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <h4 className="mt-2 text-sm font-semibold line-clamp-2">{product.title}</h4>
            <p className="text-sm font-bold text-[#1B198F]">${product.variants?.[0]?.price || 0}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
