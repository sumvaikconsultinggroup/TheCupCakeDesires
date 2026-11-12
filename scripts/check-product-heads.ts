/**
 * Fetch product URLs and fail if any head is the cached title-only fallback
 * (bare "The Cupcake Desire" title, or missing canonical).
 *
 *   pnpm check:product-heads
 *   BASE_URL=https://thecupcakedesire.com.au pnpm check:product-heads
 *
 * This is a monitor, not a Vercel cron. vercel.json crons are protected.
 *
 * How to run it in production:
 *   - GitHub Action on a schedule (needs a workflow file; not added here)
 *   - CI or a laptop job against https://thecupcakedesire.com.au
 * A vercel.json cron needs Nipun's OK.
 *
 * A bare title of "The Cupcake Desire" means generateMetadata swallowed a
 * Mongo error again. Check products/[handle]/page.tsx still uses
 * getProductByHandle with no title-only catch.
 */
const BASE = (process.env.BASE_URL || 'https://thecupcakedesire.com.au').replace(/\/+$/, '')

const SAMPLE = [
  '/products/molten-chocolate-round-cake',
  '/products/mix-box-of-12',
  '/products/red-velvet-round-cake',
  '/products/chocolate-chocolate-round-cake',
  '/products/macaron-box-12',
  '/products/box-of-12-thank-you-cupcakes',
  '/products/deluxe-box-of-12',
  '/products/standard-cupcake-box-3',
  '/products/mini-cupcake-box-24',
  '/products/vegan-box-of-12',
]

function inner(html: string, tag: string): string {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? match[1].replace(/\s+/g, ' ').trim() : ''
}

function hasCanonical(html: string): boolean {
  return /rel=["']canonical["']/i.test(html)
}

async function main() {
  const failures: string[] = []
  for (const path of SAMPLE) {
    const url = `${BASE}${path}`
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'gsc-product-head-monitor' } })
    const html = await res.text()
    const title = inner(html, 'title')
    if (!res.ok) failures.push(`${path} HTTP ${res.status}`)
    if (title === 'The Cupcake Desire') failures.push(`${path} title-only fallback`)
    if (!hasCanonical(html)) failures.push(`${path} missing canonical`)
    console.log(JSON.stringify({ path, status: res.status, title, canonical: hasCanonical(html) }))
  }
  if (failures.length) {
    throw new Error(failures.join('; '))
  }
  console.log(`OK ${SAMPLE.length} product heads`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
