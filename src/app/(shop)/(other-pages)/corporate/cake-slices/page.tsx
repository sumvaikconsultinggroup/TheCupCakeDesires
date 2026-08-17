'use client'

import CorporateShowcaseHero from '@/components/corporate/CorporateShowcaseHero'
import {
  CORPORATE_CAKE_SLICE_BULK_ENQUIRY_HREF,
  CORPORATE_CAKE_SLICE_FLAVOURS,
  CORPORATE_CAKE_SLICE_GALLERY,
  CORPORATE_CAKE_SLICE_HANDLE,
  CORPORATE_CAKE_SLICE_SIZES,
} from '@/lib/corporate-pages'
import Link from 'next/link'

export default function CorporateCakeSlicesPage() {
  return (
    <main className="bake-canvas">
      <CorporateShowcaseHero
        productHandle={CORPORATE_CAKE_SLICE_HANDLE}
        eyebrow="Corporate cake slices"
        title={
          <>
            Branded cake slices for{' '}
            <span className="bake-display-italic text-rose-accent">your next event.</span>
          </>
        }
        gallery={CORPORATE_CAKE_SLICE_GALLERY}
        galleryLayout="product"
        sizes={CORPORATE_CAKE_SLICE_SIZES}
        flavours={CORPORATE_CAKE_SLICE_FLAVOURS}
        flavourCaption="Choose your slice flavour"
        defaultSizeId="12"
        priceCaption="box price"
        maxSizeLabel="100"
        bulkEnquiryHref={CORPORATE_CAKE_SLICE_BULK_ENQUIRY_HREF}
        siblingHref="/corporate"
        siblingLabel="See corporate cupcakes →"
        footerNote="Edible logos · standard size cake slices · Melbourne delivery"
        lineItemName={(flavour) =>
          flavour === 'Mix' ? 'Assorted Mix Cake Slices' : `${flavour} Cake Slice`
        }
      />

      <section className="bg-ivory py-14 md:py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center md:px-10">
          <p className="bake-eyebrow justify-center">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            How it works
          </p>
          <h2 className="bake-display-lg mt-4">
            Pick a flavour, upload your logo,{' '}
            <span className="bake-display-italic text-rose-accent">we print &amp; finish.</span>
          </h2>
          <p className="bake-body-lg mt-5 text-taupe">
            Box of 12 $84 · Box of 36 $234 · Box of 50 $300 · Box of 100 $550 — with edible logo
            toppers on each slice. Choose a single flavour or Mix (all flavours in one box), then Add to
            cart.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/corporate/mini" className="bake-btn bake-btn-ghost">
              Mini corporate cupcakes
            </Link>
            <Link href="/collections/cake-slices" className="bake-btn bake-btn-ghost">
              Browse standard slices
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
