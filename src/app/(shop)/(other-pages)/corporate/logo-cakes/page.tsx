'use client'

import CorporateShowcaseHero from '@/components/corporate/CorporateShowcaseHero'
import {
  CORPORATE_ROUND_CAKE_BULK_ENQUIRY_HREF,
  CORPORATE_ROUND_CAKE_FLAVOURS,
  CORPORATE_ROUND_CAKE_GALLERY,
  CORPORATE_ROUND_CAKE_HANDLE,
  CORPORATE_ROUND_CAKE_SIZES,
} from '@/lib/corporate-pages'
import Link from 'next/link'

export default function CorporateLogoCakesPage() {
  return (
    <main className="bake-canvas">
      <CorporateShowcaseHero
        productHandle={CORPORATE_ROUND_CAKE_HANDLE}
        eyebrow="Corporate logo cakes"
        title={
          <>
            A branded logo cake for{' '}
            <span className="bake-display-italic text-rose-accent">your team.</span>
          </>
        }
        gallery={CORPORATE_ROUND_CAKE_GALLERY}
        galleryLayout="product"
        imageFit="contain"
        sizes={CORPORATE_ROUND_CAKE_SIZES}
        flavours={CORPORATE_ROUND_CAKE_FLAVOURS}
        flavourCaption="Choose your flavour"
        defaultSizeId="6"
        priceCaption="cake price"
        maxSizeLabel='10"'
        bulkEnquiryHref={CORPORATE_ROUND_CAKE_BULK_ENQUIRY_HREF}
        siblingHref="/corporate"
        siblingLabel="See corporate cupcakes →"
        footerNote="Edible logo · matching buttercream trim · Melbourne delivery"
        maxLogos={1}
        logoItemNoun="cake"
        logoHelperText="Upload one logo. We print it on the cake — the cake trim will be matched to your logo."
        lineItemName={(flavour) => `Corporate Logo Cake (${flavour})`}
      />

      <section className="bg-ivory py-14 md:py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center md:px-10">
          <p className="bake-eyebrow justify-center">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            How it works
          </p>
          <h2 className="bake-display-lg mt-4">
            Pick a size, upload your logo,{' '}
            <span className="bake-display-italic text-rose-accent">we match the trim.</span>
          </h2>
          <p className="bake-body-lg mt-5 text-taupe">
            6 inch $70 · 8 inch $90 · 10 inch $110 — Vanilla or Chocolate. Upload one logo and
            we&rsquo;ll print it on the cake. The cake trim will be matched to your logo.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/corporate" className="bake-btn bake-btn-ghost">
              Corporate cupcakes
            </Link>
            <Link href="/corporate/cake-slices" className="bake-btn bake-btn-ghost">
              Corporate cake slices
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
