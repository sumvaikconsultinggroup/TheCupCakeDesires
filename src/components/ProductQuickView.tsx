// 'use client'

// import GalleryImages from '@/app/(shop)/(other-pages)/products/GalleryImages'
// import ProductStatus from '@/app/(shop)/(other-pages)/products/ProductStatus'
// import RecommendedProducts from '@/app/(shop)/(other-pages)/products/[handle]/RecommendedProducts'
// import LikeButton from '@/components/LikeButton'
// import NcInputNumber from '@/components/NcInputNumber'
// import ProductColorOptions from '@/components/ProductForm/ProductColorOptions'
// import ProductForm from '@/components/ProductForm/ProductForm'
// import ProductSizeOptions from '@/components/ProductForm/ProductSizeOptions'
// import StarRating from '@/components/StarRating'
// import axios from 'axios'
// import { Info, Percent, X } from 'lucide-react'
// import Image from 'next/image'
// import { FC, useEffect, useState } from 'react'
// import { useAside } from './aside'

// interface ProductQuickViewProps {
//   className?: string
// }

// interface ProductOption {
//   name: string
//   values: string[]
// }

// interface Product {
//   _id: string
//   handle: string
//   title: string
//   status?: string
//   bodyHtml?: string
//   images: { src: string }[]
//   options: ProductOption[]
//   variants: { price: number; compareAtPrice?: number }[]
//   reviews: { star: number }[]
//   points?: number
//   nutrientsFactsImage?: string
//   ingredients?: string
//   recommendedProducts?: any[]
// }

// const ProductQuickView: FC<ProductQuickViewProps> = ({ className }) => {
//   const { productQuickViewHandle: handle } = useAside()
//   const [product, setProduct] = useState<Product | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [isDescExpanded, setIsDescExpanded] = useState(false)
//   const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false)
//   const [drawerContent, setDrawerContent] = useState<'nutrition' | 'ingredients' | null>(null)
//   const [selectedRecommendedProducts, setSelectedRecommendedProducts] = useState([])

//   useEffect(() => {
//     if (!handle) {
//       return
//     }

//     const fetchProduct = async () => {
//       setLoading(true)
//       try {
//         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
//         const response = await axios.get(`${baseUrl}/api/products/${handle}`)

//         if (response.data.data) {
//           setProduct(response.data.data)
//         }
//       } catch (error) {
//         console.error(`Error fetching product with handle ${handle}:`, error)
//         setProduct(null)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchProduct()
//   }, [handle])

//   if (loading) {
//     return (
//       <div className={`${className} flex h-96 items-center justify-center`}>
//         <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
//       </div>
//     )
//   }

//   if (!product) {
//     return null
//   }

//   // Calculate transformed product data
//   const ratingCount =
//     product.reviews?.length > 0
//       ? product.reviews.reduce((sum, review) => sum + review.star, 0) / product.reviews.length
//       : 0

//   const price = product.variants?.[0]?.price || 0
//   const compareAtPrice = product.variants?.[0]?.compareAtPrice
//   const rating = ratingCount.toFixed(1)
//   const reviewNumber = product.reviews?.length || 0

//   // Extract plain text from HTML
//   const plainText = product.bodyHtml
//     ? product.bodyHtml
//         .replace(/<[^>]*>?/gm, ' ')
//         .replace(/\s+/g, ' ')
//         .trim()
//     : ''

//   const initialLength = 80
//   const visibleLength = isDescExpanded ? 300 : initialLength
//   const isTruncatable = plainText.length > visibleLength
//   const descriptionContent = isTruncatable ? `${plainText.substring(0, visibleLength)}...` : plainText

//   // Default options
//   const defaultFlavorOption = product.options?.find((opt) => opt.name === 'Flavors')?.values?.[0] || ''
//   const defaultSizeOption = product.options?.find((opt) => opt.name === 'Net Weight')?.values?.[0] || ''

//   // Discount calculation
//   const discountedPrice = Math.round(price * 0.97)

//   // Gallery images
//   const galleryImages = product.images?.map((img) => img.src).filter(Boolean) || []

//   // Features
//   const features = [
//     { name: 'Authenticity', image: '/Feature1.webp' },
//     { name: 'Lab Tested', image: '/Feature2.webp' },
//     { name: 'Informed Choice', image: '/Feature3.webp' },
//   ]

//   const openDrawer = (key: 'nutrition' | 'ingredients') => {
//     setDrawerContent(key)
//     setIsDrawerOpen(true)
//   }

//   const closeDrawer = () => {
//     setIsDrawerOpen(false)
//     setTimeout(() => setDrawerContent(null), 300)
//   }

//   const transformedProduct = {
//     ...product,
//     price,
//     compareAtPrice,
//     rating,
//     reviewNumber,
//   }

//   return (
//     <div className={className}>
//       <div className="lg:flex lg:gap-8 lg:items-start">
//         {/* RIGHT SIDE - Product Info */}
//         <div className="w-full pt-6 font-family-antonio lg:w-[45%] lg:pt-0">
//           <div className="relative flex flex-col gap-y-6">
//             {/* HEADING */}
//             <div>
//               <h1 className="text-2xl font-semibold tracking-wider text-[#1b198f] uppercase md:text-3xl">
//                 {product.title}
//               </h1>

//               {/* Prepaid Discount Banner */}
//               <div className="mt-3 flex w-max items-center gap-x-2 rounded-md bg-linear-to-r from-[#1b198f] to-[#2a75b3] px-[18px] py-3 font-family-roboto text-white capitalize shadow-sm">
//                 <span className="font-family-roboto font-medium">
//                   <span className="text-[14px]">Get it for as low as </span>
//                   <span className="text-[16px]">${discountedPrice.toLocaleString('en-IN')}</span>
//                 </span>
//                 <button
//                   onClick={() => setIsDiscountModalOpen(true)}
//                   className="flex items-center justify-center rounded-full bg-white p-0.5 text-[#1b198f] hover:bg-neutral-100"
//                 >
//                   <Info className="h-3.5 w-3.5" />
//                 </button>
//               </div>

//               {/* Price Section */}
//               <div className="mt-4 flex flex-col gap-y-2">
//                 <div className="flex items-center gap-x-1 font-family-roboto text-[30px]">
//                   <span className="self-center text-[20px] font-semibold text-[#1b198f] md:text-[28px] dark:text-neutral-100">
//                     {price ? `$${price.toLocaleString()}` : 'Free'}
//                   </span>
//                   {compareAtPrice && (
//                     <>
//                       <del className="mx-2.5 self-center font-family-roboto text-[12px] font-medium text-black md:text-[20px]">
//                         ${compareAtPrice.toLocaleString('en-IN')}
//                       </del>
//                       {price && (
//                         <span className="self-center font-family-roboto text-[12px] font-bold text-green-600 md:text-[14px] dark:text-green-500">
//                           -{`${Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off`}
//                         </span>
//                       )}
//                     </>
//                   )}
//                 </div>

//                 <p className="font-family-roboto text-[16px] text-neutral-500 capitalize dark:text-neutral-400">
//                   Incl. of all taxes & shipping
//                 </p>

//                 {/* Rating and Status */}
//                 <div className="mt-2 flex items-center gap-x-3 font-family-roboto">
//                   <div className="flex items-center text-sm font-medium">
//                     <StarRating rating={parseFloat(rating)} reviews={reviewNumber} />
//                     <div className="ms-1.5 flex items-center gap-x-2 border-l border-neutral-300 pl-2 dark:border-neutral-600">
//                       <span className="text-black capitalize hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
//                         {reviewNumber} reviews
//                       </span>
//                     </div>
//                   </div>
//                   <ProductStatus status={product.status || 'active'} />
//                 </div>

//                 {/* Description Excerpt */}
//                 {plainText && (
//                   <div className="mt-2 font-family-roboto text-base text-[#000000f2] lowercase dark:text-neutral-400">
//                     <p className="inline-block font-light">
//                       {descriptionContent}{' '}
//                       {plainText.length > initialLength && (
//                         <button
//                           onClick={() => setIsDescExpanded(!isDescExpanded)}
//                           className="inline-block cursor-pointer text-[#1b198f] underline hover:underline dark:text-primary-400"
//                         >
//                           {isDescExpanded ? 'Read less' : 'Read more'}
//                         </button>
//                       )}
//                     </p>
//                   </div>
//                 )}

//                 {/* Points */}
//                 {product.points && (
//                   <div className="mt-3 inline-flex items-center gap-x-2 rounded-sm bg-primary-700 p-1 pl-3 font-family-roboto text-sm whitespace-nowrap text-white">
//                     <span className="inline-flex items-center gap-1 text-[14px]">
//                       Earn up to {product.points} Points on this purchase
//                       <span className="group relative inline-flex cursor-pointer items-center">
//                         <Info className="-mt-0.5 h-4 w-4" />
//                         <div className="wrap-break-words pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-80 -translate-x-1/2 rounded-md bg-[#F6F6F6] px-3 py-6 text-center text-xs font-bold whitespace-normal text-black opacity-0 shadow-md transition-all duration-300 ease-in-out group-hover:pointer-events-auto group-hover:opacity-100">
//                           Points will be rewarded once order is fulfilled
//                         </div>
//                       </span>
//                     </span>
//                   </div>
//                 )}

//                 {/* Features Section */}
//                 <div className="mt-4 border-y border-neutral-200 dark:border-neutral-700">
//                   <div className="-mx-4 flex">
//                     {features.map((feature) => (
//                       <div
//                         key={feature.name}
//                         className="flex flex-1 items-center justify-center gap-x-2 border-x border-neutral-200 px-3 py-2 first:border-l-0 last:border-r-0 dark:border-neutral-700"
//                       >
//                         <Image src={feature.image} alt={feature.name} width={32} height={32} />
//                         <span className="font-family-roboto text-[14px] font-medium text-neutral-700 normal-case dark:text-neutral-300">
//                           {feature.name}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Product Form */}
//             <ProductForm product={transformedProduct} selectedRecommendedProducts={selectedRecommendedProducts}>
//               <fieldset className="flex flex-col gap-y-6">
//                 {/* Variants and Size */}
//                 <div className="flex flex-col gap-y-6 font-family-roboto">
//                   <ProductColorOptions options={product.options[0]} defaultColor={defaultFlavorOption} />
//                   <ProductSizeOptions options={product.options} defaultSize={defaultSizeOption} />
//                 </div>

//                 {/* Recommended Products */}
//                 <RecommendedProducts
//                   currentProduct={product}
//                   mainProductPrice={price}
//                   onSelectionChange={setSelectedRecommendedProducts}
//                 />

//                 {/* Quantity and Add to Cart */}
//                 <div className="flex flex-col gap-y-3">
//                   <div className="flex gap-x-3.5">
//                     <div className="flex items-center justify-center border border-neutral-700 px-2 py-2 sm:p-2.5 dark:bg-neutral-800/70">
//                       <NcInputNumber name="quantity" defaultValue={1} />
//                     </div>

//                     <button
//                       type="submit"
//                       className="relative flex w-full cursor-pointer items-center justify-around overflow-hidden border-black bg-[#1B198F] py-1 font-family-roboto text-[18px] font-medium text-white uppercase shadow-[4px_6px_0px_black] transition-[box-shadow_250ms,transform_250ms,filter_50ms] before:absolute before:inset-0 before:z-[-1] before:-translate-x-full before:bg-[#2a75b3] before:transition-transform before:duration-250 before:content-[''] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] hover:before:translate-x-0"
//                     >
//                       Add to cart
//                     </button>
//                   </div>

//                   <div className="bg-[#1b198f] py-2 text-center font-family-roboto text-sm font-medium text-white">
//                     FREE SHIPPING + 3% PREPAID BONUS
//                   </div>
//                 </div>

//                 {/* Payment Methods */}
//                 <div className="flex justify-center border border-neutral-200 py-[15px] dark:border-neutral-900">
//                   <Image
//                     src="/PaymentMethod.webp"
//                     alt="Accepted payment methods"
//                     width={300}
//                     height={30}
//                     className="object-contain"
//                   />
//                 </div>
//               </fieldset>
//             </ProductForm>

//             {/* Info Links */}
//             {(product.nutrientsFactsImage || product.ingredients) && (
//               <div className="flex items-center justify-center gap-x-8 font-family-antonio">
//                 {product.nutrientsFactsImage && (
//                   <button
//                     type="button"
//                     onClick={() => openDrawer('nutrition')}
//                     className="cursor-pointer text-sm font-semibold underline hover:text-primary-600 dark:hover:text-primary-400"
//                   >
//                     Nutritional Facts
//                   </button>
//                 )}
//                 {product.ingredients && (
//                   <button
//                     type="button"
//                     onClick={() => openDrawer('ingredients')}
//                     className="cursor-pointer text-sm font-semibold underline hover:text-primary-600 dark:hover:text-primary-400"
//                   >
//                     Ingredients
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* LEFT SIDE - Gallery Images with Swiper */}
//         <div className="w-full lg:w-[55%] lg:sticky lg:top-10">
//           <div className="relative">
//             <GalleryImages images={galleryImages} />
//             <LikeButton className="absolute top-3 left-3 z-10" />
//           </div>
//         </div>
//       </div>

//       {/* Discount Modal */}
//       {isDiscountModalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-family-roboto backdrop-blur-sm">
//           <div className="relative w-full max-w-sm rounded-xl bg-white px-6 pt-10 pb-6 shadow-2xl">
//             <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-[#fff8e1] shadow-lg ring-4 ring-white">
//               <Percent className="h-6 w-6 text-[#fcd266]" />
//             </div>
//             <button
//               onClick={() => setIsDiscountModalOpen(false)}
//               className="absolute top-2 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 transition hover:bg-neutral-300 hover:text-neutral-900"
//             >
//               <X className="h-4 w-4" />
//             </button>

//             <h3 className="mb-1 text-center text-[24px] leading-tight font-bold text-black uppercase">
//               Get it for as low as ${discountedPrice.toLocaleString('en-IN')}
//             </h3>
//             <p className="text-center text-[15px] text-neutral-600 capitalize">3% Prepaid Discount</p>
//           </div>
//         </div>
//       )}

//       {/* Info Drawer */}
//       <div
//         className={`fixed inset-0 z-9999 flex transition-opacity duration-300 ease-in-out ${
//           isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
//         }`}
//       >
//         <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
//         <div
//           className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-neutral-900 ${
//             isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
//           }`}
//         >
//           <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700">
//             <h2 className="text-lg font-semibold capitalize">
//               {drawerContent === 'nutrition' ? 'Nutritional Facts' : 'Ingredients'}
//             </h2>
//             <button
//               type="button"
//               onClick={closeDrawer}
//               className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
//             >
//               <X className="h-5 w-5" />
//             </button>
//           </div>
//           <div className="flex-1 overflow-y-auto p-6">
//             {drawerContent === 'nutrition' && product.nutrientsFactsImage && (
//               <Image
//                 src={product.nutrientsFactsImage}
//                 alt="Nutritional Facts"
//                 width={500}
//                 height={700}
//                 className="h-auto w-full"
//               />
//             )}
//             {drawerContent === 'ingredients' && product.ingredients && (
//               <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
//                 {product.ingredients}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default ProductQuickView
