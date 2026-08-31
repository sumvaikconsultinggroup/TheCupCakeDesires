import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { loadResolvedHomepageSectionsSafe } from '@/lib/homepage-sections-server'
import connectDb from '@/lib/mongodb'
import HeroSettings from '@/models/HeroSettings'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import JsonLd from '@/components/SE0/JsonLd'
import BestSellers from '@/components/HomePage/BestSellers'
import FlashDeals from '@/components/HomePage/FlashDeals'
import HomeHero from '@/components/HomePage/HomeHero'
import NewArrivals from '@/components/HomePage/NewArrivals'
import CorporateGiftingShowcase from '@/components/HomePage/CorporateGiftingShowcase'

const BlogsSection = dynamic(() => import('@/components/HomePage/BlogsSection'))
const CollectionsShowcase = dynamic(() => import('@/components/HomePage/CollectionsShowcase'))
const ProductShowcase = dynamic(() => import('@/components/HomePage/ProductShowcase'))
const CombosDeals = dynamic(() => import('@/components/HomePage/CombosDeals'))
const OurStory = dynamic(() => import('@/components/HomePage/WhyGibbon'))
const TrendingProducts = dynamic(() => import('@/components/HomePage/TrendingProducts'))
const RunningBanner = dynamic(() => import('@/components/RuningBanner'))
const InstagramGallery = dynamic(() => import('@/components/HomePage/InstagramGallery'))
const Testimonials = dynamic(() => import('@/components/HomePage/Testimonials'))
const FAQ = dynamic(() => import('@/components/HomePage/FAQ'))
const Newsletter = dynamic(() => import('@/components/HomePage/Newsletter'))
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'))
const CategoryShowcase = dynamic(() => import('@/components/HomePage/CategoryShowcase'))

type HeroSettingsData = {
  enabled?: boolean
  images?: string[]
  topLeft?: { line1: string; line2: string }
  topRight?: { line1: string; line2: string }
  bottomLeft?: { line1: string; line2: string }
  bottomRight?: { line1: string; line2: string }
  center?: { eyebrow: string; title: string; footer: string }
}

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'The Cupcake Desire — Hand-frosted Cupcakes, Baked to Order',
    description:
      'Small-batch cupcakes hand-frosted in our Narre Warren kitchen. Custom cupcakes for weddings, birthdays, and corporate events — next-day delivery on a single box, 3 days’ notice for cakes. Online orders only.',
    alternates: {
      canonical: '/',
      languages: {
        'en-AU': absoluteUrl('/'),
        en: absoluteUrl('/'),
        'x-default': absoluteUrl('/'),
      },
    },
  }
  return await applyPageSEOMetadata('home', baseMetadata)
}

export default async function PageHome() {
  const {
    bestSellers,
    flashDeals,
    newArrivals,
    trending,
    featured,
    occasionShowcase,
    categoryShowcase,
  } = await loadResolvedHomepageSectionsSafe()

  let heroSettings: HeroSettingsData | null = null

  try {
    await connectDb()
    const heroDoc: Record<string, unknown> | null = (await HeroSettings.findOne({
      storeId: 'default',
    }).lean()) as Record<string, unknown> | null

    heroSettings = heroDoc
      ? (JSON.parse(JSON.stringify(heroDoc)) as HeroSettingsData)
      : null
  } catch (error) {
    console.error('[homepage] Failed to load hero settings:', error)
  }

  return (
    <div className="nc-PageHome bg-ivory text-cocoa">
      <JsonLd />

      {heroSettings?.enabled !== false && (
        <HomeHero
          images={heroSettings?.images}
          topLeft={heroSettings?.topLeft}
          topRight={heroSettings?.topRight}
          bottomLeft={heroSettings?.bottomLeft}
          bottomRight={heroSettings?.bottomRight}
          center={heroSettings?.center}
        />
      )}

      <CorporateGiftingShowcase />

      {bestSellers.enabled && (
        <BestSellers
          products={bestSellers.products as any}
          displaySettings={bestSellers.displaySettings}
          sortOrder={bestSellers.sortOrder}
          collectionHandle={bestSellers.collectionHandle}
          eyebrow={bestSellers.copy.eyebrow}
          title={bestSellers.copy.title}
          titleAccent={bestSellers.copy.titleAccent}
          description={bestSellers.copy.description}
          ctaLabel={bestSellers.copy.ctaLabel}
          ctaHref={bestSellers.copy.ctaHref}
        />
      )}

      {occasionShowcase.enabled && occasionShowcase.tiles.length > 0 && (
        <CollectionsShowcase section={occasionShowcase} />
      )}

      {categoryShowcase.enabled && categoryShowcase.tiles.length > 0 && (
        <CategoryShowcase section={categoryShowcase} />
      )}

      {flashDeals.enabled && (
        <FlashDeals
          products={flashDeals.products as any}
          displaySettings={flashDeals.displaySettings}
          sortOrder={flashDeals.sortOrder}
          collectionHandle={flashDeals.collectionHandle}
          eyebrow={flashDeals.copy.eyebrow}
          title={flashDeals.copy.title}
          titleAccent={flashDeals.copy.titleAccent}
          description={flashDeals.copy.description}
          ctaLabel={flashDeals.copy.ctaLabel}
          ctaHref={flashDeals.copy.ctaHref}
        />
      )}

      {newArrivals.enabled && (
        <NewArrivals
          products={newArrivals.products as any}
          displaySettings={newArrivals.displaySettings}
          sortOrder={newArrivals.sortOrder}
          collectionHandle={newArrivals.collectionHandle}
          eyebrow={newArrivals.copy.eyebrow}
          title={newArrivals.copy.title}
          titleAccent={newArrivals.copy.titleAccent}
          description={newArrivals.copy.description}
          ctaLabel={newArrivals.copy.ctaLabel}
          ctaHref={newArrivals.copy.ctaHref}
        />
      )}

      <OurStory />

      {featured.enabled && (
        <ProductShowcase
          products={featured.products as any}
          displaySettings={featured.displaySettings}
          sortOrder={featured.sortOrder}
          collectionHandle={featured.collectionHandle}
          eyebrow={featured.copy.eyebrow}
          title={featured.copy.title}
          titleAccent={featured.copy.titleAccent}
          description={featured.copy.description}
          ctaHref={featured.copy.ctaHref}
        />
      )}

      <CombosDeals />

      <RunningBanner />

      {trending.enabled && (
        <TrendingProducts
          products={trending.products as any}
          displaySettings={trending.displaySettings}
          sortOrder={trending.sortOrder}
          collectionHandle={trending.collectionHandle}
          eyebrow={trending.copy.eyebrow}
          title={trending.copy.title}
          titleAccent={trending.copy.titleAccent}
          description={trending.copy.description}
          ctaLabel={trending.copy.ctaLabel}
          ctaHref={trending.copy.ctaHref}
        />
      )}

      <Testimonials />

      <BlogsSection />

      <InstagramGallery />

      <div id="faq">
        <FAQ />
      </div>

      <Newsletter />

      <ScrollToTop />
    </div>
  )
}
