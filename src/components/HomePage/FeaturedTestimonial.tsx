'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ImagePlaceholder from '../ImagePlaceholder'

type Story = {
  id: number
  quote: string
  name: string
  role: string
  rating: number
  imageHint: string
  tone: 'rose' | 'cream' | 'beige' | 'gold'
}

const stories: Story[] = [
  {
    id: 1,
    quote:
      'I ordered the box of twenty-four for my mum&rsquo;s 60th. The pistachio rose disappeared in twenty minutes. The packaging looked like jewellery.',
    name: 'Aanya Mehta',
    role: 'Birthday box · Narre Warren',
    rating: 5,
    imageHint: 'Customer holding the gift box, candid moment',
    tone: 'rose',
  },
  {
    id: 2,
    quote:
      'They customised every box with our initials and delivered on time across three venues. Every guest asked where they were from. We&rsquo;ll order from them every anniversary.',
    name: 'Priya & Sameer',
    role: 'Wedding · 200 boxes',
    rating: 5,
    imageHint: 'Wedding cupcake tower with floral styling',
    tone: 'cream',
  },
  {
    id: 3,
    quote:
      'I started the Cupcake Club as a joke and now Wednesdays are my favourite day of the week. The matcha cloud is dangerous &mdash; I&rsquo;ve ordered it for four weeks running.',
    name: 'Rohan Kapoor',
    role: 'Cupcake Club · 14 months',
    rating: 5,
    imageHint: 'Subscriber receiving weekly box at doorstep',
    tone: 'beige',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 text-gold">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill={i < count ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M10 1 L 12.5 7 L 19 7.7 L 14 12.2 L 15.5 19 L 10 15.5 L 4.5 19 L 6 12.2 L 1 7.7 L 7.5 7 Z" />
        </svg>
      ))}
    </div>
  )
}

const AUTOPLAY_MS = 7500

export default function FeaturedTestimonial() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const story = stories[active]

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive((p) => (p + 1) % stories.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused])

  return (
    <section
      className="bg-cream py-16 md:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Eyebrow */}
        <div className="mb-12 text-center md:mb-14">
          <p className="bake-eyebrow inline-flex items-center">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            A note from our customers
            <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
          {/* LEFT — image */}
          <div className="md:col-span-5">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`img-${story.id}`}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55 }}
                >
                  <ImagePlaceholder
                    ratio="aspect-[4/5]"
                    tone={story.tone}
                    rounded="xl"
                    label="Customer story"
                    hint={story.imageHint}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Floating quote glyph */}
              <span
                aria-hidden
                className="font-bake-display absolute -top-6 -left-4 text-[140px] leading-none text-rose-accent select-none"
              >
                &ldquo;
              </span>
            </div>
          </div>

          {/* RIGHT — quote */}
          <div className="md:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${story.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
              >
                <Stars count={story.rating} />
                <blockquote
                  className="font-bake-display mt-6 text-cocoa"
                  style={{
                    fontSize: 'clamp(22px, 2.8vw, 36px)',
                    lineHeight: 1.35,
                    fontWeight: 400,
                    fontStyle: 'italic',
                  }}
                  dangerouslySetInnerHTML={{ __html: story.quote }}
                />
                <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                  <div>
                    <p className="font-bake-display text-[18px] font-medium text-cocoa">
                      {story.name}
                    </p>
                    <p className="bake-caption mt-1 text-taupe">{story.role}</p>
                  </div>
                </figcaption>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="mt-8 flex items-center gap-4">
              {stories.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  aria-label={`Story ${i + 1}`}
                  className="group flex items-center gap-3"
                >
                  <span
                    className={`h-[2px] transition-all duration-300 ${
                      i === active ? 'w-12 bg-cocoa' : 'w-6 bg-line group-hover:bg-taupe'
                    }`}
                  />
                  <span
                    className={`bake-caption transition-opacity ${
                      i === active ? 'opacity-100 text-cocoa' : 'opacity-50 text-taupe'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
