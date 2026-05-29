'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ImagePlaceholder from '../ImagePlaceholder'

type Tone = 'rose' | 'cream' | 'beige' | 'gold' | 'mint'

type Slot = {
  tone: Tone
  label: string
  hint: string
}

/* Each placeholder has its own list of images that quietly cycle. */
const slotA: Slot[] = [
  { tone: 'rose', label: 'Lifestyle', hint: 'Strawberry cupcake, overhead 45°' },
  { tone: 'cream', label: 'Lifestyle', hint: 'Cupcake on linen, soft morning light' },
  { tone: 'gold', label: 'Lifestyle', hint: 'Hands holding a cupcake' },
]
const slotB: Slot[] = [
  { tone: 'cream', label: 'Detail', hint: 'Frosting swirl macro' },
  { tone: 'rose', label: 'Detail', hint: 'Fresh strawberries on linen' },
  { tone: 'beige', label: 'Detail', hint: 'Cherry on top — close crop' },
]
const slotC: Slot[] = [
  { tone: 'beige', label: 'Product', hint: 'Tray of frosted cupcakes overhead' },
  { tone: 'rose', label: 'Product', hint: 'Pistachio rose cupcake on stand' },
  { tone: 'mint', label: 'Product', hint: 'Eggless matcha cupcake row' },
]
const slotD: Slot[] = [
  { tone: 'gold', label: 'Lifestyle', hint: 'Customer photo — birthday box reveal' },
  { tone: 'rose', label: 'Lifestyle', hint: 'Cupcake box being gifted' },
  { tone: 'cream', label: 'Lifestyle', hint: 'Bakery counter shot' },
]
const slotE: Slot[] = [
  { tone: 'rose', label: 'Detail', hint: 'Strawberry sliced on top' },
  { tone: 'beige', label: 'Detail', hint: 'Edible flower garnish' },
  { tone: 'gold', label: 'Detail', hint: 'Salted caramel drizzle' },
]
const slotF: Slot[] = [
  { tone: 'mint', label: 'Product', hint: 'Vegan cupcake range' },
  { tone: 'rose', label: 'Product', hint: 'Mini cupcakes tray' },
  { tone: 'cream', label: 'Product', hint: 'Gift box of twelve, ribbon detail' },
]

export default function HeroCollage({ className = '' }: { className?: string }) {
  return (
    <section
      className={`relative overflow-hidden bg-ivory ${className}`}
      aria-label="Featured collection"
    >
      <SprinkleDots />

      <div className="relative mx-auto grid min-h-[640px] max-w-[1320px] grid-cols-12 gap-4 px-6 pt-12 pb-20 md:min-h-[760px] md:gap-10 md:px-10 md:pt-20 md:pb-28 lg:gap-14">
        {/* ─── LEFT COLLAGE (cols 1-4) ─── */}
        <div className="relative col-span-12 hidden md:col-span-4 md:block">
          {/* Tall portrait — top, anchored to the LEFT edge */}
          <div className="absolute left-0 top-0 h-[52%] w-[62%]">
            <SlidingPlaceholder slides={slotA} interval={5200} startDelay={400} rounded="xl" />
          </div>

          {/* Small overlap — pulled in so it stays well clear of the centre */}
          <div className="absolute left-[42%] top-[16%] h-[26%] w-[40%]">
            <div className="h-full w-full overflow-hidden rounded-2xl border-[6px] border-ivory bg-ivory shadow-[0_18px_40px_-18px_rgba(46,31,21,0.25)]">
              <SlidingPlaceholder slides={slotB} interval={4600} startDelay={1500} rounded="md" />
            </div>
          </div>

          {/* Wider mid-bottom image — sits inside the column with breathing room */}
          <div className="absolute bottom-0 left-[4%] h-[38%] w-[74%]">
            <SlidingPlaceholder slides={slotC} interval={5800} startDelay={2400} rounded="xl" />
          </div>
        </div>

        {/* ─── CENTER COPY (cols 5-8) — STATIC ─── */}
        <div className="relative col-span-12 flex flex-col items-center justify-center text-center md:col-span-4 md:px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="bake-script text-rose-accent"
          >
            Seasonal release · this week
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="bake-display-xl mt-4"
          >
            Strawberries
            <br />
            <span className="bake-display-italic text-rose-accent">&amp;</span> cream.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="bake-body mt-6 max-w-[44ch] mx-auto leading-relaxed"
          >
            A whipped vanilla bean buttercream piped over a delicate almond sponge, crowned with a
            farm-market strawberry. Limited to 60 boxes a day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/collections/new" className="bake-btn bake-btn-rose">
              Order the season <span aria-hidden>→</span>
            </Link>
            <Link href="/collections/signatures" className="bake-btn bake-btn-ghost">
              See signatures
            </Link>
          </motion.div>
        </div>

        {/* ─── RIGHT COLLAGE (cols 9-12) ─── */}
        <div className="relative col-span-12 hidden md:col-span-4 md:block">
          {/* Tall portrait — anchored to the RIGHT edge */}
          <div className="absolute right-0 top-0 h-[52%] w-[62%]">
            <SlidingPlaceholder slides={slotD} interval={5400} startDelay={800} rounded="xl" />
          </div>

          {/* Small overlap — pulled in so it stays well clear of the centre */}
          <div className="absolute right-[42%] top-[16%] h-[26%] w-[40%]">
            <div className="h-full w-full overflow-hidden rounded-2xl border-[6px] border-ivory bg-ivory shadow-[0_18px_40px_-18px_rgba(46,31,21,0.25)]">
              <SlidingPlaceholder slides={slotE} interval={4800} startDelay={1900} rounded="md" />
            </div>
          </div>

          {/* Wider mid-bottom image — sits inside the column with breathing room */}
          <div className="absolute bottom-0 right-[4%] h-[38%] w-[74%]">
            <SlidingPlaceholder slides={slotF} interval={6000} startDelay={3100} rounded="xl" />
          </div>
        </div>

        {/* ─── MOBILE — 2 stacked sliding placeholders below copy ─── */}
        <div className="col-span-12 grid grid-cols-2 gap-3 md:hidden">
          <div className="aspect-square">
            <SlidingPlaceholder slides={slotA} interval={4800} startDelay={400} rounded="lg" />
          </div>
          <div className="aspect-square">
            <SlidingPlaceholder slides={slotD} interval={5200} startDelay={1500} rounded="lg" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="bake-divider" />
      </div>
    </section>
  )
}

/* ============================================================
   SlidingPlaceholder — Swiper-style horizontal carousel.
   Container stays at fixed position; images slide in from the
   right and exit to the left in a continuous infinite loop.
   ============================================================ */
function SlidingPlaceholder({
  slides,
  interval = 5000,
  startDelay = 0,
  rounded = 'xl',
}: {
  slides: Slot[]
  interval?: number
  startDelay?: number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}) {
  const [i, setI] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    const start = setTimeout(() => {
      timer = setInterval(() => {
        setI((p) => (p + 1) % slides.length)
      }, interval)
    }, startDelay)
    return () => {
      clearTimeout(start)
      if (timer) clearInterval(timer)
    }
  }, [interval, startDelay, slides.length])

  const slot = slides[i]

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={i}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ImagePlaceholder
            ratio="absolute inset-0"
            tone={slot.tone}
            rounded={rounded}
            label={slot.label}
            hint={slot.hint}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ─── Scattered sprinkle confetti dots ─── */
function SprinkleDots() {
  const dots = [
    { l: '6%', t: '10%', c: 'bg-rose-accent', s: 8, r: 12 },
    { l: '4%', t: '70%', c: 'bg-gold', s: 6, r: -20 },
    { l: '38%', t: '6%', c: 'bg-mint-accent', s: 6, r: 30 },
    { l: '46%', t: '88%', c: 'bg-rose-deep', s: 5, r: 0 },
    { l: '92%', t: '20%', c: 'bg-rose-accent', s: 7, r: -10 },
    { l: '94%', t: '76%', c: 'bg-gold', s: 6, r: 18 },
    { l: '14%', t: '90%', c: 'bg-rose-deep', s: 5, r: -8 },
    { l: '82%', t: '6%', c: 'bg-mint-accent', s: 5, r: 24 },
  ]
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute hidden rounded-full opacity-50 md:block ${d.c}`}
          style={{
            left: d.l,
            top: d.t,
            width: d.s,
            height: d.s,
            transform: `rotate(${d.r}deg)`,
          }}
        />
      ))}
    </>
  )
}
