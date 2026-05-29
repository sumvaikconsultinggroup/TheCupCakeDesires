'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import ImagePlaceholder from '../ImagePlaceholder'

export default function Newsletter({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubmitted(true)
        setEmail('')
        setTimeout(() => setSubmitted(false), 4000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`bg-cocoa text-ivory ${className}`}>
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-12 md:gap-16 md:px-10 md:py-28">
        {/* Left — image */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-5"
        >
          <ImagePlaceholder
            ratio="aspect-[4/5]"
            tone="rose"
            rounded="xl"
            label="Lifestyle image"
            hint="Cupcake box on a kitchen counter, soft morning light"
          />
        </motion.div>

        {/* Right — content */}
        <div className="flex flex-col justify-center md:col-span-7">
          <p className="bake-eyebrow text-rose-deep">
            <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
            The Wednesday letter
          </p>
          <h2 className="bake-display-lg mt-5 text-ivory">
            Get the bakery in your inbox{' '}
            <span className="bake-display-italic text-rose-deep">every Wednesday.</span>
          </h2>
          <p className="bake-body-lg mt-6 max-w-[58ch] text-cream-deep/85">
            Once a week — what we&rsquo;re baking, what&rsquo;s new on the board, and a fresh discount code
            for subscribers. No spam, no daily blasts. Just one good note.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-9 flex max-w-[520px] flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@inbox.com"
              className="font-bake-body flex-1 rounded-full border border-ivory/30 bg-transparent px-5 py-3.5 text-[15px] text-ivory placeholder-ivory/50 transition-colors focus:border-rose-deep focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bake-btn bake-btn-rose disabled:opacity-60"
            >
              {loading ? 'Sending…' : submitted ? 'Subscribed ✓' : 'Subscribe'}
              {!loading && !submitted && <span aria-hidden>→</span>}
            </button>
          </motion.form>
          <p className="bake-body-sm mt-4 text-cream-deep/60">
            By subscribing you agree to receive marketing emails. Unsubscribe any time.
          </p>

          {/* Mini perks row */}
          <ul className="mt-10 grid grid-cols-1 gap-5 border-t border-ivory/10 pt-8 sm:grid-cols-3">
            {[
              { n: '10%', l: 'Off your first order' },
              { n: '24h', l: 'Early access to new flavours' },
              { n: '∞', l: 'Cancel any time' },
            ].map((p) => (
              <li key={p.l}>
                <p className="bake-display-md font-medium text-rose-deep">{p.n}</p>
                <p className="bake-caption mt-2 text-cream-deep/70">{p.l}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
