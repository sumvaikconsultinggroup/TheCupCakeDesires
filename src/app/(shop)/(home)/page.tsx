import { getCollections } from '@/app/admin/collections/collection-actions'
import BestSellers from '@/components/HomePage/BestSellers'
import CategoryShowcase from '@/components/HomePage/CategoryShowcase'
import FlashDeals from '@/components/HomePage/FlashDeals'
import HeroCollage from '@/components/HomePage/HeroCollage'
import HeroScrollMask from '@/components/HomePage/HeroScrollMask'
import HeroSection from '@/components/HomePage/HeroSection'
import NewArrivals from '@/components/HomePage/NewArrivals'
import TrustStrip from '@/components/HomePage/TrustStrip'
import connectDb from '@/lib/mongodb'
import { applyPageSEOMetadata } from '@/lib/pageSEO'
import Product from '@/models/product.model'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import JsonLd from '@/components/SE0/JsonLd'

const BlogsSection = dynamic(() => import('@/components/HomePage/BlogsSection'))
const CollectionsShowcase = dynamic(() => import('@/components/HomePage/CollectionsShowcase'))
const ProductShowcase = dynamic(() => import('@/components/HomePage/ProductShowcase'))
const CombosDeals = dynamic(() => import('@/components/HomePage/CombosDeals'))
const OurStory = dynamic(() => import('@/components/HomePage/WhyGibbon'))
const TrendingProducts = dynamic(() => import('@/components/HomePage/TrendingProducts'))
const RunningBanner = dynamic(() => import('@/components/RuningBanner'))
const InstagramGallery = dynamic(() => import('@/components/HomePage/InstagramGallery'))
const FeaturedTestimonial = dynamic(() => import('@/components/HomePage/FeaturedTestimonial'))
const Testimonials = dynamic(() => import('@/components/HomePage/Testimonials'))
const FAQ = dynamic(() => import('@/components/HomePage/FAQ'))
const Newsletter = dynamic(() => import('@/components/HomePage/Newsletter'))
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'))

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'CupCake Desires — Hand-frosted Cupcakes, Baked to Order',
    description:
      'Small-batch cupcakes hand-frosted in our Narre Warren kitchen. Custom cupcakes for weddings, birthdays, and corporate events — please allow 2 days’ notice on every order. Online orders only.',
    alternates: {
      canonical: '/',
      languages: {
        'en-IN': 'https://cupcakedesires.com/',
        en: 'https://cupcakedesires.com/',
        'x-default': 'https://cupcakedesires.com/',
      },
    },
  }
  return await applyPageSEOMetadata('home', baseMetadata)
}

async function getProductsByHandles(handles: string[]) {
  if (!handles || handles.length === 0) return []
  try {
    await connectDb()
    const products = await Product.find({
      handle: { $in: handles },
      isDeleted: false,
      published: true,
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .lean()
    return JSON.parse(JSON.stringify(products))
  } catch (error) {
    console.error('Products by handles fetch error:', error)
    return []
  }
}

export default async function PageHome() {
  const { collections } = await getCollections({ published: true })

  const getCollectionData = async (location: string) => {
    const collection = collections?.find((c: any) => c.displaySettings?.locations?.includes(location))
    if (!collection) return { products: [], displaySettings: null, sortOrder: undefined, handle: null }
    const products = await getProductsByHandles(collection.productHandles || [])
    return {
      products,
      displaySettings: collection.displaySettings,
      sortOrder: collection.sortOrder,
      handle: collection.handle,
    }
  }

  const [bestSellers, flashDeals, newArrivals, trendingProducts, featured] = await Promise.all([
    getCollectionData('best_seller'),
    getCollectionData('flash_deals'),
    getCollectionData('new_arrival'),
    getCollectionData('trending'),
    getCollectionData('featured'),
  ])

  // Fall back to bestSellers if no dedicated 'featured' collection is configured
  const showcase =
    featured.products.length > 0
      ? featured
      : {
          products: bestSellers.products,
          displaySettings: bestSellers.displaySettings,
          sortOrder: bestSellers.sortOrder,
          handle: 'all',
        }

  return (
    <div className="nc-PageHome bg-ivory text-cocoa">
      <JsonLd />

      <HeroScrollMask />

      {/* <HeroCollage className="mt-10 md:mt-16 lg:mt-20" /> */}

      {/* <HeroSection /> */}

      {/* <TrustStrip /> */}

      <BestSellers
        products={bestSellers.products}
        displaySettings={bestSellers.displaySettings}
        sortOrder={bestSellers.sortOrder}
        collectionHandle={bestSellers.handle}
      />

      {/* Shop by Occasion — curated lifestyle collections */}
      <CollectionsShowcase />

      <CategoryShowcase />

      <FlashDeals
        products={flashDeals.products}
        displaySettings={flashDeals.displaySettings}
        sortOrder={flashDeals.sortOrder}
        collectionHandle={flashDeals.handle}
      />

      <NewArrivals
        products={newArrivals.products}
        displaySettings={newArrivals.displaySettings}
        sortOrder={newArrivals.sortOrder}
        collectionHandle={newArrivals.handle}
      />

      <OurStory />

      {/* Toggleable carousel ↔ grid product showcase */}
      <ProductShowcase
        products={showcase.products}
        displaySettings={showcase.displaySettings}
        sortOrder={showcase.sortOrder}
        collectionHandle={showcase.handle}
      />

      <CombosDeals />

      <RunningBanner />

      <TrendingProducts
        products={trendingProducts.products}
        displaySettings={trendingProducts.displaySettings}
        sortOrder={trendingProducts.sortOrder}
      />

      {/* Spotlight customer story */}
      {/* <FeaturedTestimonial /> */}

      <Testimonials />

      {/* Latest blog posts */}
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
