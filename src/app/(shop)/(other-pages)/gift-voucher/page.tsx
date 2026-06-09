import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import connectDb from '@/lib/mongodb'
import GiftVoucherPage from '@/models/GiftVoucherPage'
import Product from '@/models/product.model'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GiftVoucherClient from './GiftVoucherClient'

export const revalidate = 60

const STORE_ID = 'default'

async function loadSettings() {
  await connectDb()
  let doc: any = await GiftVoucherPage.findOne({ storeId: STORE_ID }).lean()
  if (!doc) {
    const fresh = await GiftVoucherPage.create({ storeId: STORE_ID })
    doc = fresh.toObject()
  }
  return JSON.parse(JSON.stringify(doc))
}

async function loadVoucherProducts() {
  await connectDb()
  const products: any[] = await Product.find({
    productCategory: 'Gift Voucher',
    isDeleted: false,
    published: true,
    status: 'active',
  }).lean()
  return JSON.parse(JSON.stringify(products))
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSettings()
  const title = settings?.hero?.headline || 'Gift Voucher'
  const description = settings?.hero?.subheadline || ''
  return {
    title: `${title} | CupCake Desires`,
    description,
    alternates: { canonical: '/gift-voucher' },
    openGraph: {
      title: `${title} | CupCake Desires`,
      description,
      images: settings?.hero?.image ? [settings.hero.image] : undefined,
    },
  }
}

export default async function GiftVoucherRoute() {
  const settings = await loadSettings()

  if (!settings.enabled) {
    notFound()
  }

  const products = await loadVoucherProducts()

  return (
    <>
      <Header />
      <GiftVoucherClient settings={settings} products={products} />
      <Footer />
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}
