'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import './HeroScrollMask.css'

gsap.registerPlugin(ScrollTrigger)

const BASE_IMAGE = '/images/Banner-1.webp'

/** DOM order = scroll reveal order; --index controls stack (low → high) */
const MASK_IMAGES = [
  { src: '/images/Banner-1.webp', index: 4 },
  { src: '/images/Banner-2.webp', index: 3 },
  { src: '/images/Banner-3.webp', index: 2 },
  { src: '/images/Banner-4.webp', index: 1 },
] as const

const SCROLL_MULTIPLIER = 4

const HIDDEN_MASK =
  'linear-gradient(90deg, black 50%, transparent 50%, transparent 50%, black 50%)'

function applyMask(img: HTMLImageElement, progress: number) {
  const leftGradie = 50 - progress * 50
  const rightGradie = 50 + progress * 50
  const deg = 90 + progress * 40
  const value = `linear-gradient(${deg}deg, black ${leftGradie}%, transparent ${leftGradie}%, transparent ${rightGradie}%, black ${rightGradie}%)`
  img.style.maskImage = value
  img.style.webkitMaskImage = value
}

function updateMaskImages(progress: number, maskEls: HTMLImageElement[]) {
  const totalImages = maskEls.length
  if (totalImages === 0) return

  const segmentSize = 1 / totalImages

  maskEls.forEach((img, index) => {
    const imageStart = index * segmentSize
    const imageEnd = (index + 1) * segmentSize
    let imageProgress = 0

    if (progress >= imageStart && progress <= imageEnd) {
      imageProgress = (progress - imageStart) / segmentSize
    } else if (progress > imageEnd) {
      imageProgress = 1
    }

    applyMask(img, imageProgress)
  })
}

export default function HeroScrollMask() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const getMaskEls = () =>
      Array.from(hero.querySelectorAll<HTMLImageElement>('img[data-mask]'))

    const ctx = gsap.context(() => {
      const maskEls = getMaskEls()
      maskEls.forEach((img) => applyMask(img, 0))

      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: () => `+=${window.innerHeight * SCROLL_MULTIPLIER}`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          updateMaskImages(self.progress, getMaskEls())
        },
      })

      ScrollTrigger.refresh()
    }, hero)

    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={heroRef}
      className="hero-scroll-mask"
      aria-label="CupCake Desires featured hero"
    >
      <div className="hero-scroll-mask__images" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BASE_IMAGE} alt="" data-base crossOrigin="anonymous" decoding="async" />
        {MASK_IMAGES.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={image.src}
            src={image.src}
            alt=""
            data-mask
            crossOrigin="anonymous"
            decoding="async"
            style={
              {
                '--index': image.index,
                maskImage: HIDDEN_MASK,
                WebkitMaskImage: HIDDEN_MASK,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="hero-scroll-mask__content">
        <div className="hero-scroll-mask__row">
          <div className="hero-scroll-mask__meta">
            <p className="font-bake-script text-lg md:text-xl">Handcrafted Bakery</p>
            <p>Baked Fresh Daily</p>
          </div>
          <div className="hero-scroll-mask__meta text-right">
            <p className="font-bake-display font-semibold">CupCake Desires</p>
            <p>Est. 2019</p>
          </div>
        </div>

        <div className="hero-scroll-mask__center">
          <p className="hero-scroll-mask__line-top">We create</p>
          <h1 className="hero-scroll-mask__title-main">Sweet moments</h1>
          <p className="hero-scroll-mask__line-bottom">that delight.</p>
        </div>

        <div className="hero-scroll-mask__row">
          <div className="hero-scroll-mask__meta">
            <p>Signatures</p>
            <p>Seasonal flavours</p>
          </div>
          <div className="hero-scroll-mask__meta text-right">
            <p>Gift boxes</p>
            <p>Custom orders</p>
          </div>
        </div>
      </div>
    </section>
  )
}
