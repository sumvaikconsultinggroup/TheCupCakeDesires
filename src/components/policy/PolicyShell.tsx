'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export interface PolicySection {
  id: string
  label: string
  body: React.ReactNode
}

interface Props {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  lastUpdated: string
  sections: PolicySection[]
  closingNote?: React.ReactNode
  contactEmail?: string
}

export default function PolicyShell({
  eyebrow,
  title,
  titleAccent,
  intro,
  lastUpdated,
  sections,
  closingNote,
  contactEmail = 'hello@cupcakedesires.com',
}: Props) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  // Spy on which section is in view to highlight the TOC entry
  useEffect(() => {
    if (typeof window === 'undefined' || sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <main className="font-bake-body bg-ivory text-cocoa">
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-cream/60">
        <ol className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-1.5 px-6 py-4 text-[12px] tracking-[0.04em] text-taupe md:px-10">
          <li>
            <Link href="/" className="hover:text-cocoa">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li className="text-cocoa">{title}</li>
        </ol>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-cream py-16 md:py-24">
        {/* Soft brand blooms */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-112 w-md rounded-full bg-cocoa/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-[55ch]"
          >
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              {eyebrow}
            </p>
            <h1 className="bake-display-xl mt-6">
              {title}
              <br />
              <span className="bake-display-italic text-rose-accent">{titleAccent}</span>
            </h1>
            <p className="bake-body-lg mt-6 text-cocoa-soft">{intro}</p>
            <p className="bake-caption mt-6 text-taupe">
              <span className="inline-block h-px w-5 align-middle bg-rose-accent mr-2" />
              Last updated · {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Body: side TOC + prose ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            {/* Side TOC */}
            <aside className="md:col-span-4">
              <div className="md:sticky md:top-24">
                <p className="bake-caption text-taupe">Inside this page</p>
                <ol className="mt-4 border-l border-line">
                  {sections.map((s, i) => {
                    const isActive = s.id === activeId
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className={`relative -ml-px block border-l-2 py-2 pl-5 text-[14px] transition-colors ${
                            isActive
                              ? 'border-rose-accent font-medium text-cocoa'
                              : 'border-transparent text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                          }`}
                        >
                          <span className="font-bake-display mr-2 text-[12px] text-taupe">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {s.label}
                        </a>
                      </li>
                    )
                  })}
                </ol>

                <div className="mt-10 rounded-2xl border border-line bg-cream p-5">
                  <p className="bake-caption text-rose-accent">Questions?</p>
                  <p className="bake-body-sm mt-2 text-cocoa-soft">
                    Reach the bakery on{' '}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                    >
                      {contactEmail}
                    </a>{' '}
                    — we&rsquo;ll reply within a working day.
                  </p>
                </div>
              </div>
            </aside>

            {/* Content */}
            <article className="md:col-span-8">
              <div className="bake-prose">
                {sections.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-24">
                    <h2>{s.label}</h2>
                    {s.body}
                  </section>
                ))}

                {closingNote && (
                  <section className="mt-12 border-t border-line pt-10">
                    {closingNote}
                  </section>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA strip ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-20">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
                Still got a question?
              </p>
              <h2 className="bake-display-lg mt-4 max-w-[24ch] text-ivory">
                A human reads every email —{' '}
                <span className="bake-display-italic text-rose-deep">say hello.</span>
              </h2>
            </div>
            <Link href="/contact" className="bake-btn bake-btn-rose">
              Write to the bakery <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
