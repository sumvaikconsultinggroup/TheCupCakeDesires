'use client'

import Image from 'next/image'
import { getItemLogoUrls } from '@/lib/corporate-logos'

type Props = {
  logoUrls?: string[] | null
  logoUrl?: string | null
  variants?: { name?: string; option?: string }[] | null
  /** thumbnail | inline | admin */
  variant?: 'thumbnail' | 'inline' | 'admin'
  itemNoun?: 'cupcake' | 'slice'
  className?: string
}

export default function CorporateLogoStrip({
  logoUrls,
  logoUrl,
  variants,
  variant = 'inline',
  itemNoun = 'cupcake',
  className = '',
}: Props) {
  const urls = getItemLogoUrls({ logoUrls, logoUrl, variants })
  if (urls.length === 0) return null

  if (variant === 'thumbnail') {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
        {urls.map((url, i) => (
          <span
            key={url}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 py-0.5 pl-0.5 pr-2 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <span className="relative h-4 w-4 overflow-hidden rounded-full bg-white">
              <Image src={url} alt={`Logo ${i + 1}`} fill sizes="16px" className="object-contain p-px" unoptimized />
            </span>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300">
              {urls.length === 1 ? 'Logo added' : `Logo ${i + 1}`}
            </span>
          </span>
        ))}
      </span>
    )
  }

  if (variant === 'admin') {
    return (
      <div className={`mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 dark:border-amber-700 dark:bg-amber-950/40 ${className}`}>
        <p className="mb-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {urls.length === 1
            ? `Company logo attached — print on each ${itemNoun}`
            : `${urls.length} company logos attached — mix across the box`}
        </p>
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={url} className="flex items-center gap-2 rounded-md border border-amber-200 bg-white p-1.5 dark:border-amber-800 dark:bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Customer logo ${i + 1}`}
                className="h-10 w-10 rounded border border-neutral-200 bg-white object-contain p-0.5"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-900 dark:text-amber-100">
                  Logo {i + 1}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300"
                >
                  Open artwork
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <span className={`mt-1 inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {urls.map((url, i) => (
        <span
          key={url}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream/70 py-0.5 pl-0.5 pr-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Logo ${i + 1}`} className="h-5 w-5 rounded-full bg-white object-contain p-px" />
          <span className="text-[11px] font-medium text-cocoa">
            {urls.length === 1 ? 'Logo added' : `Logo ${i + 1}`}
          </span>
        </span>
      ))}
    </span>
  )
}
