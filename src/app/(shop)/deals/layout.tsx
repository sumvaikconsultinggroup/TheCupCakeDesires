export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// COMMENTED OUT - Deals layout disabled
// import Footer from '@/components/Footer'
// import Header from '@/components/Header/Header'
// import { applyPageSEOMetadata } from '@/lib/pageSEO'
// import { Metadata } from 'next'
//
// export async function generateMetadata(): Promise<Metadata> {
//   const baseMetadata: Metadata = {
//     title: 'Deals & Promo Codes - Save on Supplements | Gibbon Nutrition',
//     description: 'Discover exclusive deals, discount codes, and special offers on premium sports nutrition supplements. Save big on whey protein, mass gainers, and more.',
//     alternates: {
//       canonical: '/deals',
//     },
//   }
//
//   return await applyPageSEOMetadata('deals', baseMetadata)
// }
//
// export default function DealsLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <>
//       <Header />
//       <main>{children}</main>
//       <Footer />
//     </>
//   )
// }
