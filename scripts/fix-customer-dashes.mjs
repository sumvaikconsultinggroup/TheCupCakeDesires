#!/usr/bin/env node
/**
 * One-off: strip em/en dashes from customer-visible strings in listed files.
 * Does not touch comments in code-only lib files (those are patched manually).
 */
import fs from 'fs'

const FILES = [
  'src/data/blog-corporate-vegan-cupcakes.ts',
  'src/data/blog-corporate-gifting-ideas.ts',
  'src/data/blog-corporate-logo-cupcakes-brand-recognition.ts',
  'src/data/blog-how-to-celebrate-team-milestones.ts',
  'src/data/blog-employee-appreciation-gift-ideas.ts',
  'src/data/blog-office-celebrations-vegan-treats.ts',
  'src/data/blog-how-long-can-cupcakes-last.ts',
  'src/data/blog-best-vegan-cakes-melbourne-birthdays.ts',
  'src/data/blog-where-to-buy-gluten-free-cupcakes.ts',
  'src/data/blog-best-cupcake-shops-melbourne-cbd.ts',
  'src/data/blog-best-cupcakes-delivery-melbourne.ts',
  'src/data/blog-spring-cupcake-ideas-melbourne.ts',
  'src/data/blog-author-rupal.ts',
  'src/data/gluten-free-cupcakes-content.ts',
  'src/data/keyword-blogs.ts',
  'src/data/melbourne-pages.ts',
  'src/data/data.ts',
  'src/components/HomePage/TrustStrip.tsx',
  'src/components/HomePage/HeroSection.tsx',
  'src/components/HomePage/HeroCollage.tsx',
  'standalone-landing/area-cupcakes/index.html',
  'standalone-landing/area-cupcakes/app.js',
  'standalone-landing/corporate-cupcakes/index.html',
  'standalone-landing/corporate-cupcakes/app.js',
  'standalone-landing/corporate-cupcakes/config.js',
  'src/components/product/CorporateLogoUploader.tsx',
  'src/components/product/LabTestReport.tsx',
  'src/components/product/ProductEnquiryModal.tsx',
  'src/components/live-chat/LiveChatPanel.tsx',
  'src/components/order/CorporateLogoStrip.tsx',
  'src/components/AccordionInfo.tsx',
  'src/components/ProductDetailsView.tsx',
]

function fixDashes(content) {
  let s = content

  // Brand suffix
  s = s.replace(/\s*[\u2014\u2013]\s*The Cupcake Desire/g, ' | The Cupcake Desire')

  s = s.replace(/journey[\u2014\u2013]one/g, 'journey: one')

  // Citation titles (org name — page name)
  s = s.replace(
    /(Food Standards Australia New Zealand|Healthdirect Australia)\s+&ndash;\s+/g,
    '$1: ',
  )

  // Numeric HTML entity ranges
  s = s.replace(/(\d+)\s*&ndash;\s*(\d+)/g, '$1 to $2')

  // Time ranges
  s = s.replace(/(\d+\s*AM)\s*[\u2013\u2014]\s*(\d+\s*PM)/gi, '$1 to $2')

  // Numeric en-dash ranges (bake times, quantities, weeks)
  s = s.replace(/(\d+)\s*[\u2013]\s*(\d+)/g, '$1 to $2')

  // JSX review pagination: }{en-dash}{
  s = s.replace(/\}\s*[\u2013]\s*\{/g, '} to {')

  // &mdash;
  s = s.replace(/&mdash;/g, ',')

  // Tight em dash between words (no surrounding spaces)
  s = s.replace(/([\w'’%?])\u2014([\w"‘])/g, '$1, $2')

  // Spaced em dashes
  s = s.replace(/\s+\u2014\s+/g, ', ')

  // Title: question then No — Next
  s = s.replace(/Melbourne\? No, Next Weekday/g, 'Melbourne? No: Next Weekday')

  // Leading em dash on new lines (landing pages)
  s = s.replace(/(\n\s*)—\s+/g, '$1')

  // Remaining em dashes
  s = s.replace(/\u2014/g, ', ')

  // Remaining en dashes (non-numeric contexts)
  s = s.replace(/\u2013/g, ' to ')

  // Cleanup
  s = s.replace(/, ,/g, ',')
  s = s.replace(/, \./g, '.')
  s = s.replace(/:\s*,/g, ':')

  return s
}

let changed = 0
for (const file of FILES) {
  const raw = fs.readFileSync(file, 'utf8')
  const next = fixDashes(raw)
  if (next !== raw) {
    fs.writeFileSync(file, next)
    changed++
    console.log('updated', file)
  }
}
console.log('files changed:', changed)