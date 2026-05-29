import { redirect } from 'next/navigation'

export default function DealsPage() {
  redirect('/')
}

// COMMENTED OUT - Deals page disabled, users redirected to home
// 'use client'
// import { useCart } from '@/components/useCartStore'
// import { motion } from 'framer-motion'
// import {
//   Calendar,
//   Check,
//   ChevronRight,
//   Clock,
//   Copy,
//   Gift,
//   Info,
//   Package,
//   Percent,
//   ShoppingBag,
//   Sparkles,
//   Tag,
//   Users,
//   Zap,
// } from 'lucide-react'
// import Link from 'next/link'
// import { useEffect, useState } from 'react'
// import { toast } from 'react-hot-toast'
//
// interface PromoCode {
//   _id: string
//   code: string
//   discountType: 'percentage' | 'fixed'
//   discountValue: number
//   minOrderAmount?: number
//   usageLimit?: number
//   usageCount: number
//   startsAt?: string
//   expiresAt?: string
//   isActive: boolean
//   appliesTo: 'all' | 'products' | 'categories'
//   productIds?: string[]
//   categoryNames?: string[]
//   createdAt?: string
// }
//
// export default function DealsPage() {
//   const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
//   const [loading, setLoading] = useState(true)
//   const [copiedCode, setCopiedCode] = useState<string | null>(null)
//   const [selectedFilter, setSelectedFilter] = useState<'all' | 'percentage' | 'fixed'>('all')
//   const { items } = useCart()
//
//   useEffect(() => {
//     fetchPromoCodes()
//   }, [])
//
//   const fetchPromoCodes = async () => {
//     try {
//       const res = await fetch('/api/promoCode/getPromoCodes')
//       if (res.ok) {
//         const data = await res.json()
//         if (data.success) {
//           // Filter only active promo codes that haven't expired
//           const activePromoCodes = (data.data || []).filter((promo: PromoCode) => {
//             if (!promo.isActive) return false
//             if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return false
//             if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return false
//             return true
//           })
//           setPromoCodes(activePromoCodes)
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching promo codes:', error)
//       toast.error('Failed to load deals')
//     } finally {
//       setLoading(false)
//     }
//   }
//
//   const copyToClipboard = (code: string) => {
//     navigator.clipboard.writeText(code)
//     setCopiedCode(code)
//     toast.success(`Copied "${code}" to clipboard!`)
//     setTimeout(() => setCopiedCode(null), 2000)
//   }
//
//   const getDaysRemaining = (expiresAt?: string) => {
//     if (!expiresAt) return null
//     const now = new Date()
//     const expiry = new Date(expiresAt)
//     const diffTime = expiry.getTime() - now.getTime()
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     return diffDays > 0 ? diffDays : 0
//   }
//
//   const getUsagePercentage = (usageCount: number, usageLimit?: number) => {
//     if (!usageLimit) return 0
//     return Math.min((usageCount / usageLimit) * 100, 100)
//   }
//
//   const isEligibleForCart = (promo: PromoCode) => {
//     const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
//     if (promo.minOrderAmount && cartTotal < promo.minOrderAmount) {
//       return { eligible: false, message: `Add $${(promo.minOrderAmount - cartTotal).toFixed(0)} more to cart` }
//     }
//     return { eligible: true, message: 'Eligible for your cart!' }
//   }
//
//   const filteredPromoCodes = promoCodes.filter((promo) => {
//     if (selectedFilter === 'all') return true
//     return promo.discountType === selectedFilter
//   })
//
//   const stats = {
//     total: promoCodes.length,
//     percentage: promoCodes.filter((p) => p.discountType === 'percentage').length,
//     fixed: promoCodes.filter((p) => p.discountType === 'fixed').length,
//     expiringSoon: promoCodes.filter((p) => {
//       const days = getDaysRemaining(p.expiresAt)
//       return days !== null && days <= 7
//     }).length,
//   }
//
//   return (
//     <div className="bg-gradient-to-b from-indigo-50 via-white to-blue-50">
//       {/* Hero Section */}
//       <section className="relative overflow-hidden bg-gradient-to-r from-[#1B198F] via-indigo-600 to-blue-600 py-20">
//         <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
//         <div className="relative container mx-auto px-4">
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mx-auto max-w-4xl text-center"
//           >
//             <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
//               <Sparkles className="h-5 w-5 text-yellow-300" />
//               <span className="text-sm font-semibold text-white">Limited Time Offers</span>
//             </div>
//             <h1 className="mb-6 text-5xl font-black text-white md:text-6xl lg:text-7xl">
//               Exclusive Deals & <span className="text-yellow-300">Discounts</span>
//             </h1>
//             <p className="mb-8 text-xl text-indigo-100">
//               Save big on your favorite products with our special promo codes
//             </p>
//
//             {/* Stats */}
//             <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
//               {[
//                 { label: 'Active Deals', value: stats.total, icon: Tag },
//                 { label: 'Percentage Off', value: stats.percentage, icon: Percent },
//                 { label: 'Fixed Discounts', value: stats.fixed, icon: Gift },
//                 { label: 'Ending Soon', value: stats.expiringSoon, icon: Clock },
//               ].map((stat, idx) => (
//                 <motion.div
//                   key={stat.label}
//                   initial={{ opacity: 0, scale: 0.8 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   transition={{ delay: idx * 0.1 }}
//                   className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
//                 >
//                   <stat.icon className="mx-auto mb-2 h-6 w-6 text-yellow-300" />
//                   <div className="text-3xl font-bold text-white">{stat.value}</div>
//                   <div className="text-xs text-indigo-200">{stat.label}</div>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </section>
//
//       {/* Filter Tabs */}
//       <section className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
//         <div className="container mx-auto px-4">
//           <div className="flex items-center gap-4 overflow-x-auto py-4">
//             {[
//               { label: 'All Deals', value: 'all', count: stats.total },
//               { label: 'Percentage Off', value: 'percentage', count: stats.percentage },
//               { label: 'Fixed Amount', value: 'fixed', count: stats.fixed },
//             ].map((filter) => (
//               <button
//                 key={filter.value}
//                 onClick={() => setSelectedFilter(filter.value as any)}
//                 className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
//                   selectedFilter === filter.value
//                     ? 'bg-[#1B198F] text-white shadow-lg shadow-[#1B198F]/30'
//                     : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
//                 }`}
//               >
//                 {filter.label}
//                 <span
//                   className={`rounded-full px-2 py-0.5 text-xs ${
//                     selectedFilter === filter.value ? 'bg-white/20' : 'bg-neutral-200'
//                   }`}
//                 >
//                   {filter.count}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>
//
//       {/* Deals Grid */}
//       <section className="container mx-auto px-4 py-12">
//         {loading ? (
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="h-96 animate-pulse rounded-3xl bg-neutral-200" />
//             ))}
//           </div>
//         ) : filteredPromoCodes.length === 0 ? (
//           <div className="py-20 text-center">
//             <Tag className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
//             <h3 className="mb-2 text-2xl font-bold text-neutral-800">No deals available</h3>
//             <p className="text-neutral-500">Check back soon for new offers!</p>
//           </div>
//         ) : (
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//             {filteredPromoCodes.map((promo, index) => {
//               const daysRemaining = getDaysRemaining(promo.expiresAt)
//               const usagePercentage = getUsagePercentage(promo.usageCount, promo.usageLimit)
//               const cartEligibility = isEligibleForCart(promo)
//               const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7
//
//               return (
//                 <motion.div
//                   key={promo._id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg transition-all hover:shadow-2xl"
//                 >
//                   {/* Gradient Background */}
//                   <div
//                     className={`absolute inset-0 opacity-5 ${
//                       promo.discountType === 'percentage'
//                         ? 'bg-gradient-to-br from-[#1B198F] to-indigo-500'
//                         : 'bg-gradient-to-br from-blue-500 to-teal-500'
//                     }`}
//                   />
//
//                   {/* Expiring Soon Badge */}
//                   {isExpiringSoon && (
//                     <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
//                       <Zap className="h-3 w-3" />
//                       Ending Soon!
//                     </div>
//                   )}
//
//                   <div className="relative">
//                     {/* Discount Badge */}
//                     <div className="mb-6 inline-flex items-center gap-2">
//                       <div
//                         className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
//                           promo.discountType === 'percentage'
//                             ? 'bg-gradient-to-br from-[#1B198F] to-indigo-500'
//                             : 'bg-gradient-to-br from-blue-500 to-teal-500'
//                         }`}
//                       >
//                         {promo.discountType === 'percentage' ? (
//                           <div className="text-center">
//                             <div className="text-2xl font-black text-white">{promo.discountValue}</div>
//                             <div className="text-xs font-bold text-white">% OFF</div>
//                           </div>
//                         ) : (
//                           <div className="text-center">
//                             <div className="text-lg font-black text-white">${promo.discountValue}</div>
//                             <div className="text-xs font-bold text-white">OFF</div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//
//                     {/* Promo Code */}
//                     <div className="mb-4">
//                       <div className="mb-2 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
//                         Promo Code
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <div className="flex-1 rounded-xl border-2 border-dashed border-[#1B198F] bg-[#1B198F]/5 px-4 py-3">
//                           <code className="text-xl font-black text-[#1B198F]">{promo.code}</code>
//                         </div>
//                         <button
//                           onClick={() => copyToClipboard(promo.code)}
//                           className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B198F] text-white transition-all hover:bg-[#1B198F]/90"
//                         >
//                           {copiedCode === promo.code ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
//                         </button>
//                       </div>
//                     </div>
//
//                     {/* Details */}
//
//
//                     {/* Cart Eligibility */}
//                     {items.length > 0 && (
//                       <div
//                         className={`mt-4 rounded-xl p-3 ${
//                           cartEligibility.eligible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
//                         }`}
//                       >
//                         <div className="flex items-center gap-2 text-sm font-semibold">
//                           <Info className="h-4 w-4" />
//                           {cartEligibility.message}
//                         </div>
//                       </div>
//                     )}
//
//                     {/* CTA */}
//                     <Link
//                       href="/collections/all-items"
//                       className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F] to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-[#1B198F]/30 transition-all hover:shadow-xl"
//                     >
//                       Shop Now
//                       <ChevronRight className="h-4 w-4" />
//                     </Link>
//                   </div>
//                 </motion.div>
//               )
//             })}
//           </div>
//         )}
//       </section>
//
//       {/* How to Use Section */}
//       <section className="bg-gradient-to-br from-neutral-50 to-indigo-50 py-16">
//         <div className="container mx-auto px-4">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="mx-auto max-w-4xl text-center"
//           >
//             <h2 className="mb-4 text-3xl font-bold text-neutral-900">How to Use Promo Codes</h2>
//             <p className="mb-12 text-neutral-600">Follow these simple steps to save on your purchase</p>
//
//             <div className="grid gap-8 md:grid-cols-3">
//               {[
//                 {
//                   step: 1,
//                   title: 'Copy Code',
//                   description: 'Click the copy button on your favorite deal',
//                   icon: Copy,
//                 },
//                 {
//                   step: 2,
//                   title: 'Shop Products',
//                   description: 'Add items to your cart and proceed to checkout',
//                   icon: ShoppingBag,
//                 },
//                 {
//                   step: 3,
//                   title: 'Apply & Save',
//                   description: 'Paste the code at checkout and enjoy your discount',
//                   icon: Percent,
//                 },
//               ].map((item) => (
//                 <div key={item.step} className="relative">
//                   <div className="rounded-2xl bg-white p-8 shadow-lg">
//                     <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-indigo-600 text-2xl font-bold text-white">
//                       {item.step}
//                     </div>
//                     <item.icon className="mx-auto mb-4 h-12 w-12 text-[#1B198F]" />
//                     <h3 className="mb-2 text-xl font-bold text-neutral-900">{item.title}</h3>
//                     <p className="text-neutral-600">{item.description}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </section>
//
//       {/* Start Shopping CTA */}
//       <section className="bg-gradient-to-r from-[#1B198F] to-indigo-600 py-16">
//         <div className="container mx-auto px-4 text-center">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             className="mx-auto max-w-2xl"
//           >
//             <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-yellow-300" />
//             <h2 className="mb-4 text-3xl font-bold text-white">Ready to Save?</h2>
//             <p className="mb-8 text-indigo-100">
//               Browse our wide range of products and apply these amazing deals today!
//             </p>
//             <Link
//               href="/"
//               className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#1B198F] shadow-xl transition-all hover:scale-105"
//             >
//               Start Shopping
//               <ChevronRight className="h-5 w-5" />
//             </Link>
//           </motion.div>
//         </div>
//       </section>
//     </div>
//   )
// }
