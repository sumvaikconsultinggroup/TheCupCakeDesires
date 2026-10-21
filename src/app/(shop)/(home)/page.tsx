import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { loadResolvedHomepageSectionsSafe } from '@/lib/homepage-sections-server'
import connectDb from '@/lib/mongodb'
import { HALLOWEEN_HOME_BANNER } from '@/data/halloween-2026'
import HeroSettings from '@/models/HeroSettings'
import HomeBanner from '@/models/HomeBanner'
import { Metadata } from 'next'
import { preload } from 'react-dom'
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/cloudinary-url'
import dynamic from 'next/dynamic'
import JsonLd from '@/components/SE0/JsonLd'
import BestSellers from '@/components/HomePage/BestSellers'
import FlashDeals from '@/components/HomePage/FlashDeals'
import HomeHero from '@/components/HomePage/HomeHero'
import { DEFAULT_HERO_SLIDES, type HeroSlide } from '@/data/hero-defaults'
import NewArrivals from '@/components/HomePage/NewArrivals'
import CorporateGiftingShowcase from '@/components/HomePage/CorporateGiftingShowcase'
import MelbourneGuideLinks from '@/components/seo/MelbourneGuideLinks'
import OccasionLinks from '@/components/seo/OccasionLinks'

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

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Cupcakes Melbourne | Next Weekday Delivery Across the Metro',
    description:
      'Cupcakes delivered across Melbourne Metro on weekdays. Order before 12 noon for next-weekday delivery. Vegan range and an eggless version of every flavour.',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_AU',
      url: absoluteUrl('/'),
      siteName: 'The Cupcake Desire',
      title: 'Cupcakes Melbourne | The Cupcake Desire',
      description:
        'Hand-frosted cupcakes baked to order in Narre Warren. Melbourne Metro delivery.',
      images: [
        {
          url: absoluteUrl('/og-image.png'),
          width: 1200,
          height: 630,
          alt: 'The Cupcake Desire — Cupcakes Melbourne',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Cupcakes Melbourne | The Cupcake Desire',
      description:
        'Hand-frosted cupcakes baked to order in Narre Warren. Melbourne Metro delivery.',
      images: [absoluteUrl('/og-image.png')],
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
  let halloweenHeroSrc: string | null = null

  try {
    await connectDb()
    const heroDoc: Record<string, unknown> | null = (await HeroSettings.findOne({
      storeId: 'default',
    }).lean()) as Record<string, unknown> | null

    heroSettings = heroDoc
      ? (JSON.parse(JSON.stringify(heroDoc)) as HeroSettingsData)
      : null

    // Prefer an active HomeBanner Halloween slide (slot 1) without dropping the
    // existing HeroSettings set of 4. Falls back to the brief's static asset
    // until the endDate when no banner row exists yet.
    const now = new Date()
    const halloweenEnd = new Date(HALLOWEEN_HOME_BANNER.endDate)
    if (now < halloweenEnd) {
      const banner = (await HomeBanner.findOne({
        isActive: true,
        buttonLink: HALLOWEEN_HOME_BANNER.buttonLink,
        order: 0,
      })
        .select('image endDate isActive')
        .lean()) as { image?: { desktop?: string }; endDate?: Date; isActive?: boolean } | null

      const bannerOk =
        banner &&
        (!banner.endDate || new Date(banner.endDate) > now) &&
        Boolean(banner.image?.desktop?.trim())

      halloweenHeroSrc = bannerOk
        ? (banner!.image!.desktop as string)
        : HALLOWEEN_HOME_BANNER.image.desktop
    }
  } catch (error) {
    console.error('[homepage] Failed to load hero settings:', error)
    // Still show the static Halloween slide when DB is unavailable before endDate.
    if (new Date() < new Date(HALLOWEEN_HOME_BANNER.endDate)) {
      halloweenHeroSrc = HALLOWEEN_HOME_BANNER.image.desktop
    }
  }

  // Always keep the default 4 banners when HeroSettings is missing or empty
  // (DB error / no record), then prepend Halloween so all 5 slides show.
  const dbImages = heroSettings?.images?.filter((src) => Boolean(src?.trim())) || []
  const baseSlides: HeroSlide[] =
    dbImages.length > 0
      ? dbImages.map((src, i) => ({
          src,
          alt: DEFAULT_HERO_SLIDES[i]?.alt || 'Hand-frosted cupcakes from The Cupcake Desire',
        }))
      : DEFAULT_HERO_SLIDES.map((s) => ({ ...s }))

  const withoutHalloween = baseSlides.filter(
    (s) => s.src !== halloweenHeroSrc && !s.src.includes('/images/halloween/')
  )

  const heroSlides: HeroSlide[] = halloweenHeroSrc
    ? [
        {
          src: halloweenHeroSrc,
          alt: HALLOWEEN_HOME_BANNER.image.alt,
          href: HALLOWEEN_HOME_BANNER.buttonLink,
          ctaLabel: HALLOWEEN_HOME_BANNER.buttonText,
        },
        ...withoutHalloween,
      ]
    : withoutHalloween

  // Start the LCP hero image download from the document head, before hydration.
  const firstHero = heroSlides[0]?.src || '/images/Banner-1.webp'
  if (heroSettings?.enabled !== false) {
    preload(cloudinaryUrl(firstHero, 1440), {
      as: 'image',
      fetchPriority: 'high',
      imageSrcSet: cloudinarySrcSet(firstHero),
      imageSizes: '100vw',
    })
  }

  return (
    <div className="nc-PageHome bg-ivory text-cocoa">
      <JsonLd />

      {heroSettings?.enabled !== false && (
        <HomeHero
          slides={heroSlides}
          topLeft={heroSettings?.topLeft}
          topRight={heroSettings?.topRight}
          bottomLeft={heroSettings?.bottomLeft}
          bottomRight={heroSettings?.bottomRight}
          center={heroSettings?.center}
        />
      )}

      <CorporateGiftingShowcase />

      <OccasionLinks />

      <MelbourneGuideLinks />

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
