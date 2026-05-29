'use client'

import { Share2, Volume2, VolumeX, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/navigation'

interface ReelProduct {
  productId: string
  productHandle: string
  productName: string
  productPrice: number
  productImage: string
  position?: { x: number; y: number }
  compareAtPrice?: number
}

interface Reel {
  id: string
  _id: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  products: ReelProduct[]
  stats?: {
    views: number
    likes: number
    shares: number
  }
}

interface ModalProps {
  reel: Reel
  reels: Reel[]
  onClose: () => void
}

function VideoModal({ reel, reels, onClose }: ModalProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(reels.findIndex((r) => r.id === reel.id))
  const [isMuted, setIsMuted] = useState(true)
  const modalVideoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const wasPlayingBeforeHidden = useRef(false)

  // Pause modal video on tab hide or blur, resume muted on return
  useEffect(() => {
    const getActiveVideo = () => modalVideoRefs.current[currentIndex]

    const handleHide = () => {
      const video = getActiveVideo()
      if (!video) return
      wasPlayingBeforeHidden.current = !video.paused
      video.pause()
    }

    const handleShow = () => {
      const video = getActiveVideo()
      if (!video) return
      // Always force mute when returning — never auto-unmute
      video.muted = true
      setIsMuted(true)
      if (wasPlayingBeforeHidden.current) {
        video.play().catch(() => {})
      }
    }

    const handleVisibility = () => {
      if (document.hidden) handleHide()
      else handleShow()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleHide)
    window.addEventListener('focus', handleShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleHide)
      window.removeEventListener('focus', handleShow)
    }
  }, [currentIndex])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleShare = (platform: string, productTitle?: string) => {
    const shareText = productTitle ? `Check out ${productTitle}!` : 'Check this out!'
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    let url = ''
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'instagram':
        navigator.clipboard.writeText(shareUrl)
        alert('Link copied! Open Instagram and paste in your story or post.')
        return
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative h-[94%] w-full max-w-[500px] overflow-hidden rounded-2xl bg-black shadow-2xl md:w-[90%] md:max-w-[400px] lg:w-[25%] lg:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 md:h-12 md:w-12"
        >
          <X className="h-5 w-5 text-white md:h-6 md:w-6" />
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
          className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 md:h-12 md:w-12"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white md:h-6 md:w-6" />
          ) : (
            <Volume2 className="h-5 w-5 text-white md:h-6 md:w-6" />
          )}
        </button>

        {/* Swiper for Videos */}
        <Swiper
          modules={[Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          initialSlide={currentIndex}
          onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
          className="h-full"
          style={
            {
              '--swiper-navigation-color': '#fff',
              '--swiper-navigation-size': '30px',
            } as React.CSSProperties
          }
        >
          {reels.map((currentReel, reelIndex) => {
            const currentProduct = currentReel.products?.[0]
            const currentPrice = currentProduct?.productPrice || 0
            const compareAtPrice = currentProduct?.compareAtPrice
            const discount =
              compareAtPrice && compareAtPrice > currentPrice
                ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)
                : 0

            return (
              <SwiperSlide key={currentReel.id}>
                <div className="relative h-full">
                  {/* Full Video */}
                  <video
                    ref={(el) => { modalVideoRefs.current[reelIndex] = el }}
                    src={currentReel.videoUrl}
                    className="h-full w-full object-cover"
                    autoPlay={reelIndex === currentIndex}
                    loop
                    muted={reelIndex !== currentIndex || isMuted}
                    playsInline
                    aria-label={currentProduct?.productName || 'Product video'}
                  />

                  {/* Share Button */}
                  <div className="absolute top-4 right-16 z-20 flex flex-col gap-2 md:right-20">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 md:h-12 md:w-12"
                    >
                      <Share2 className="h-5 w-5 text-white md:h-6 md:w-6" />
                    </button>

                    {/* Share Menu */}
                    {showShareMenu && (
                      <div className="animate-in slide-in-from-top-2 flex flex-col gap-2 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-md">
                        <button
                          onClick={() => handleShare('whatsapp', currentProduct?.productName)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-800">WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleShare('facebook', currentProduct?.productName)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2]">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-800">Facebook</span>
                        </button>

                        <button
                          onClick={() => handleShare('instagram', currentProduct?.productName)}
                          className="flex items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-[#FD5949] via-[#D6249F] to-[#285AEB]">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-800">Instagram</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Product Info Overlay - Centered */}
                  {currentProduct && (
                    <div className="absolute bottom-2 left-1/2 w-full -translate-x-1/2 rounded-2xl">
                      <div className="mx-3 rounded-2xl border-t border-white/10 bg-[#00000066] p-4 md:mx-[18px] md:p-6">
                        <div className="mb-3 flex items-center gap-3 md:mb-4 md:gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B198F] ring-2 ring-white/20 md:h-16 md:w-16">
                            {currentProduct.productImage ? (
                              <Image
                                src={currentProduct.productImage}
                                alt={currentProduct.productName}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-white md:text-2xl">
                                {currentProduct.productName.charAt(0)}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <h3 className="mb-1 text-xs font-bold text-white md:text-[13px]">
                              {currentProduct.productName}
                            </h3>
                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="text-xs font-bold text-white md:text-[13px]">${currentPrice}</span>
                              {compareAtPrice && compareAtPrice > currentPrice && (
                                <>
                                  <span className="text-[10px] text-gray-300 line-through md:text-[11px]">
                                    ${compareAtPrice}
                                  </span>
                                  <span className="rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white md:text-[11px]">
                                    {discount}% OFF
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/products/${currentProduct.productHandle}`}
                          className="w-full rounded-xl bg-[#1B198F] py-2 text-sm font-black text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#2770a8] hover:shadow-2xl md:text-[16px]"
                          style={{ display: 'block', textAlign: 'center' }}
                        >
                          View Porduct
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

interface VideoProductsSectionProps {
  className?: string
  showHeading?: boolean
}
export function VideoProductsSection({ className, showHeading = true }: VideoProductsSectionProps) {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const previewVideoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Ensure preview videos always stay muted — covers tab switch, extension clicks, alt-tab, etc.
  useEffect(() => {
    const forceMuteAll = () => {
      previewVideoRefs.current.forEach((video) => {
        if (video) video.muted = true
      })
    }

    const handleVisibility = () => {
      if (document.hidden) {
        previewVideoRefs.current.forEach((v) => v?.pause())
      } else {
        forceMuteAll()
        if (!selectedReel) {
          previewVideoRefs.current.forEach((v) => v?.play().catch(() => {}))
        }
      }
    }

    // Extension clicks / alt-tab trigger blur/focus, NOT visibilitychange
    const handleFocus = () => forceMuteAll()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', forceMuteAll)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', forceMuteAll)
    }
  }, [selectedReel])

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await fetch('/api/videos')
        const data = await response.json()

        if (data.success) {
          const reelsData = data.data as Reel[]

          // Fetch product details for each reel to get latest price/image
          const enrichedReels = await Promise.all(
            reelsData.map(async (reel) => {
              const product = reel.products?.[0]
              if (product?.productHandle) {
                try {
                  const prodRes = await fetch(`/api/products/${product.productHandle}`)
                  const prodData = await prodRes.json()

                  if (prodData.success && prodData.data) {
                    const variant = prodData.data.variants?.[0]
                    const image = prodData.data.images?.[0]?.src

                    return {
                      ...reel,
                      products: [
                        {
                          ...product,
                          productPrice: variant?.price || product.productPrice,
                          compareAtPrice: variant?.compareAtPrice,
                          productImage: image || product.productImage,
                        },
                        ...reel.products.slice(1),
                      ],
                    }
                  }
                } catch (err) {
                  console.error('Error fetching product details:', err)
                }
              }
              return reel
            })
          )

          setReels(enrichedReels)
        }
      } catch (error) {
        console.error('Error fetching reels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReels()
  }, [])

  return (
    <>
      <section className={`w-full bg-white dark:bg-neutral-900 ${showHeading ? 'py-12' : ''} ${className}`}>
        <div className="mx-auto w-full max-w-[1920px] px-4">
          {showHeading && (
            <h2 className="pb-8 text-center font-family-antonio text-4xl font-black tracking-wide text-[#1B198F] uppercase md:pb-12 md:text-4xl lg:text-[56px]">
              SEE WHY PEOPLE LOVE US
            </h2>
          )}
          <Swiper
            modules={[Navigation]}
            spaceBetween={12}
            slidesPerView={2}
            centeredSlides={false}
            breakpoints={{
              640: {
                slidesPerView: 3,
                spaceBetween: 12,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 14,
              },
              1024: {
                slidesPerView: 5.5,
                spaceBetween: 16,
              },
            }}
            className="pb-10!"
            style={
              {
                '--swiper-navigation-color': '#1B198F',
                '--swiper-navigation-size': '30px',
                overflowY: 'visible',
              } as React.CSSProperties
            }
          >
            {reels.map((reel) => {
              const product = reel.products?.[0]
              const price = product?.productPrice || 0
              const compareAtPrice = product?.compareAtPrice
              const discount =
                compareAtPrice && compareAtPrice > price
                  ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
                  : 0

              return (
                <SwiperSlide style={{ width: 'auto' }} key={reel.id}>
                  <div
                    onClick={() => setSelectedReel(reel)}
                    className="group min-h-[230px] cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-neutral-800"
                  >
                    {/* Video Section */}
                    <div className="relative h-[360px] overflow-hidden bg-gray-100 sm:h-[400px] md:h-[440px]">
                      <video
                        ref={(el) => {
                          const idx = reels.findIndex((r) => r.id === reel.id)
                          if (idx !== -1) previewVideoRefs.current[idx] = el
                          if (el) {
                            el.muted = true
                            el.play().catch(() => {})
                          }
                        }}
                        src={reel.videoUrl}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loop
                        muted
                        playsInline
                        onPlay={(e) => { (e.target as HTMLVideoElement).muted = true }}
                        onVolumeChange={(e) => {
                          const vid = e.target as HTMLVideoElement
                          if (!vid.muted) vid.muted = true
                        }}
                        aria-label={product?.productName || 'Product video'}
                      />
                    </div>

                    {/* Product Info Section */}
                    {loading ? (
                      <div className="animate-pulse p-3">
                        <div className="mb-2 h-3 w-3/4 rounded bg-gray-200"></div>
                        <div className="h-2 w-1/2 rounded bg-gray-200"></div>
                      </div>
                    ) : product ? (
                      <div className="p-3">
                        <div className="mb-2 flex items-start gap-2">
                          {/* Product Image Circle */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B198F]">
                            {product.productImage ? (
                              <Image
                                src={product.productImage}
                                alt={product.productName}
                                width={32}
                                height={32}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-white">{product.productName.charAt(0)}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="mb-1 truncate font-family-roboto text-sm font-medium text-gray-900 dark:text-white">
                              {product.productName}
                            </p>

                            {/* Price */}
                            <div className="flex items-center gap-2">
                              <span className="font-family-roboto text-[13px] font-semibold text-gray-900 dark:text-white">
                                ${price}
                              </span>
                              {compareAtPrice && compareAtPrice > price && (
                                <span className="text-[10px] text-gray-500 line-through">${compareAtPrice}</span>
                              )}
                            </div>
                            {discount > 0 && <p className="text-[10px] font-bold text-green-600">{discount}% OFF</p>}
                          </div>
                        </div>

                        {/* Buy Now Button */}
                        <Link
                          href={`/products/${product.productHandle}`}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-full rounded-lg bg-[#1B198F] py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#2770a8] hover:shadow-lg"
                          style={{ display: 'block', textAlign: 'center' }}
                        >
                          View Porduct
                        </Link>
                      </div>
                    ) : (
                      <div className="p-3">
                        <p className="text-[11px] text-gray-500">Product not found</p>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </section>

      {/* Modal */}
      {selectedReel && <VideoModal reel={selectedReel} reels={reels} onClose={() => setSelectedReel(null)} />}
    </>
  )
}
