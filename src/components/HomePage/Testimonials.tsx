'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    id: 1,
    name: 'Aanya M.',
    role: 'Birthday box · Narre Warren',
    quote:
      'I ordered the box of twenty-four for my mum’s 60th. The pistachio rose disappeared in twenty minutes. The packaging looked like jewellery.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rohan K.',
    role: 'Weekly subscriber',
    quote:
      'I started the Cupcake Club as a joke and now Wednesdays are my favourite day of the week. The matcha cloud is dangerous.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Priya & Sameer',
    role: 'Wedding · 200 boxes',
    quote:
      'They customised the boxes with our initials and delivered on time across three venues. Every guest asked where they were from.',
    rating: 5,
  },
  {
    id: 4,
    name: 'Devika R.',
    role: 'Eggless red velvet',
    quote:
      'Finally an eggless cupcake that doesn’t taste like it’s missing something. The cream cheese frosting is unreal.',
    rating: 5,
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1 text-gold">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
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

export default function Testimonials() {
  return (
    <section className="bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="mb-14 text-center md:mb-20">
          <p className="bake-eyebrow inline-flex items-center">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            What customers are saying
            <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
          </p>
          <h2 className="bake-display-lg mt-5">
            Real cupcakes,{' '}
            <span className="bake-display-italic text-rose-accent">real reactions.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="bake-card flex flex-col gap-5 p-7"
            >
              <Stars count={t.rating} />
              <blockquote className="bake-body text-cocoa leading-relaxed">
                <span className="font-bake-display text-[32px] leading-none text-rose-accent">
                  &ldquo;
                </span>
                {t.quote}
              </blockquote>
              <figcaption className="mt-auto border-t border-line pt-5">
                <p className="font-bake-display text-[16px] font-medium text-cocoa">{t.name}</p>
                <p className="bake-caption mt-1 text-taupe">{t.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {/* Aggregate stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-y border-line py-10 text-center md:gap-12">
          {[
            { n: '4.9 / 5', l: 'Average rating' },
            { n: '2,800+', l: 'Verified reviews' },
            { n: '42,000', l: 'Boxes baked last year' },
          ].map((s) => (
            <div key={s.l}>
              <p className="bake-display-md font-medium text-cocoa">{s.n}</p>
              <p className="bake-caption mt-3 text-taupe">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
