'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'
import './HeroScrollMask.css'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_IMAGES = [
  '/images/Banner-1.webp',
  '/images/Banner-2.webp',
  '/images/Banner-3.webp',
  '/images/Banner-4.webp',
] as const

interface CornerPair {
  line1: string
  line2: string
}

export interface HeroScrollMaskProps {
  /** Exactly 4 image URLs in stack order. Falls back to the bundled defaults. */
  images?: string[]
  topLeft?: CornerPair
  topRight?: CornerPair
  bottomLeft?: CornerPair
  bottomRight?: CornerPair
  center?: { eyebrow?: string; title?: string; footer?: string }
}

const DEFAULTS = {
  topLeft: { line1: 'Handcrafted Bakery', line2: 'Baked Fresh Daily' },
  topRight: { line1: 'CupCake Desires', line2: 'Est. 2019' },
  bottomLeft: { line1: 'Signatures', line2: 'Seasonal flavours' },
  bottomRight: { line1: 'Gift boxes', line2: 'Custom orders' },
  center: { eyebrow: 'We create', title: 'Sweet moments', footer: 'that delight.' },
}

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

export default function HeroScrollMask(props: HeroScrollMaskProps = {}) {
  const heroRef = useRef<HTMLElement>(null)

  // Resolve images + text from props with sensible defaults so the component
  // still renders correctly when invoked without any settings from the DB.
  const imageList =
    props.images && props.images.length === 4
      ? props.images.map((s) => (s && s.trim()) || DEFAULT_IMAGES[0])
      : [...DEFAULT_IMAGES]

  const baseImage = imageList[0]
  // DOM order = reveal order. Highest --index sits at the back of the stack.
  const maskImages = imageList.map((src, i) => ({ src, index: imageList.length - i }))

  const topLeft = { ...DEFAULTS.topLeft, ...(props.topLeft ?? {}) }
  const topRight = { ...DEFAULTS.topRight, ...(props.topRight ?? {}) }
  const bottomLeft = { ...DEFAULTS.bottomLeft, ...(props.bottomLeft ?? {}) }
  const bottomRight = { ...DEFAULTS.bottomRight, ...(props.bottomRight ?? {}) }
  const center = { ...DEFAULTS.center, ...(props.center ?? {}) }

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
        <img src={baseImage} alt="" data-base crossOrigin="anonymous" decoding="async" />
        {maskImages.map((image, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${image.src}-${i}`}
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
            <p className="font-bake-script text-lg md:text-xl">{topLeft.line1}</p>
            <p>{topLeft.line2}</p>
          </div>
          <div className="hero-scroll-mask__meta text-right">
            <p className="font-bake-display font-semibold">{topRight.line1}</p>
            <p>{topRight.line2}</p>
          </div>
        </div>

        <div className="hero-scroll-mask__center">
          <p className="hero-scroll-mask__line-top">{center.eyebrow}</p>
          <h1 className="hero-scroll-mask__title-main">{center.title}</h1>
          <p className="hero-scroll-mask__line-bottom">{center.footer}</p>
        </div>

        <div className="hero-scroll-mask__row">
          <div className="hero-scroll-mask__meta">
            <p>{bottomLeft.line1}</p>
            <p>{bottomLeft.line2}</p>
          </div>
          <div className="hero-scroll-mask__meta text-right">
            <p>{bottomRight.line1}</p>
            <p>{bottomRight.line2}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
