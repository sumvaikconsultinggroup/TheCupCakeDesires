'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Beaker,
  CheckCircle2,
  Download,
  FileText,
  Fingerprint,
  FlaskConical,
  Maximize2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export interface LabTestReportProps {
  pdfUrl: string
  productName: string
  reportId?: string
  lab?: string
  testDate?: string
  batchNumber?: string
  testedFor?: string[]
}

const DEFAULT_TESTED_FOR = [
  'Protein Content',
  'Heavy Metals',
  'Microbial Safety',
  'Banned Substances',
  'Label Claim Accuracy',
]

export default function LabTestReport({
  pdfUrl,
  productName,
  reportId,
  lab = 'NABL Accredited Laboratory',
  testDate,
  batchNumber,
  testedFor,
}: LabTestReportProps) {
  const [isOpen, setIsOpen] = useState(false)

  const pills = testedFor && testedFor.length > 0 ? testedFor : DEFAULT_TESTED_FOR

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const downloadName = `${productName.replace(/\s+/g, '-')}-Lab-Report.pdf`

  return (
    <section className="py-10 lg:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#1B198F]/10 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 shadow-[0_8px_40px_-12px_rgba(27,25,143,0.15)] dark:border-white/5 dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/30"
        >
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#1B198F]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          {/* Subtle grid pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #1B198F 1px, transparent 1px), linear-gradient(to bottom, #1B198F 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:p-10">
            {/* LEFT — Info */}
            <div className="flex flex-col">
              {/* Verified Badge */}
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-500/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Lab Verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B198F]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#1B198F] uppercase ring-1 ring-[#1B198F]/20 dark:text-blue-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  3rd Party Tested
                </span>
              </div>

              <h2 className="font-[family-name:var(--font-family-antonio)] text-3xl leading-tight font-black text-neutral-900 uppercase sm:text-4xl dark:text-white">
                Certificate of Analysis
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                Every batch of <span className="font-semibold text-neutral-900 dark:text-white">{productName}</span>{' '}
                is independently tested for purity, potency and safety. Review the full report below — full
                transparency, no hidden claims.
              </p>

              {/* Meta grid */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {reportId && (
                  <MetaItem
                    icon={<Fingerprint className="h-4 w-4" />}
                    label="Report ID"
                    value={reportId}
                    mono
                  />
                )}
                {lab && (
                  <MetaItem icon={<FlaskConical className="h-4 w-4" />} label="Tested By" value={lab} />
                )}
                {testDate && (
                  <MetaItem icon={<Sparkles className="h-4 w-4" />} label="Issued" value={testDate} />
                )}
                {batchNumber && (
                  <MetaItem icon={<Beaker className="h-4 w-4" />} label="Batch" value={batchNumber} mono />
                )}
              </div>

              {/* Tested for pills */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold tracking-wider text-neutral-500 uppercase">Tested For</p>
                <div className="flex flex-wrap gap-2">
                  {pills.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-[#1B198F]/30 transition-all hover:shadow-xl"
                >
                  <FileText className="h-4 w-4" />
                  View Full Report
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={pdfUrl}
                  download={downloadName}
                  className="flex items-center justify-center gap-2 rounded-full border-2 border-[#1B198F] bg-white px-6 py-3.5 text-sm font-bold tracking-wider text-[#1B198F] uppercase transition-all hover:bg-[#1B198F]/5 dark:bg-transparent dark:text-blue-300"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </motion.a>
              </div>
            </div>

            {/* RIGHT — PDF Preview Card */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setIsOpen(true)}
              className="group relative flex aspect-[5/6] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/70 bg-gradient-to-br from-neutral-50 to-white text-left shadow-lg transition-all hover:shadow-2xl sm:aspect-[4/5] dark:border-white/10 dark:from-neutral-900 dark:to-neutral-800"
            >
              {/* Top ribbon */}
              <div className="absolute top-0 right-0 left-0 flex items-center justify-between bg-gradient-to-r from-[#1B198F] to-blue-600 px-4 py-2.5 text-white">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  <span className="text-[11px] font-bold tracking-wider uppercase">Official Lab Report</span>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  PDF
                </span>
              </div>

              {/* Body preview */}
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-[#1B198F]/20 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B198F] to-blue-600 shadow-xl">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
                    {productName}
                  </p>
                  <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">
                    Lab Test Report
                  </p>
                  {reportId && (
                    <p className="mt-1 font-mono text-[11px] text-neutral-500">{reportId}</p>
                  )}
                </div>

                {/* Fake line rows to imply document preview */}
                <div className="mt-3 w-full max-w-[220px] space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-1.5 w-[85%] rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-1.5 w-[70%] rounded-full bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-[#1B198F]/0 backdrop-blur-0 transition-all duration-300 group-hover:bg-[#1B198F]/30 group-hover:backdrop-blur-sm">
                <div className="translate-y-3 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#1B198F] opacity-0 shadow-2xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="flex items-center gap-2">
                    <Maximize2 className="h-4 w-4" /> Click to View
                  </span>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* MODAL — Full PDF Viewer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/95 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            {/* Header bar */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B198F] to-blue-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white sm:text-base">
                    {productName} — Lab Report
                  </p>
                  {reportId && (
                    <p className="truncate font-mono text-[11px] text-white/60">{reportId}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  download={downloadName}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white/20 sm:flex"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>

            {/* PDF iframe */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-2 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-full w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                  title={`${productName} Lab Test Report`}
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function MetaItem({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-200/70 bg-white/60 p-3 backdrop-blur-sm dark:border-white/5 dark:bg-white/5">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1B198F]/10 text-[#1B198F] dark:text-blue-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">{label}</p>
        <p
          className={`truncate text-sm font-semibold text-neutral-900 dark:text-white ${mono ? 'font-mono' : ''}`}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
