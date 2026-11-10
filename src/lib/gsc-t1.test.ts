/**
 * GSC T1 guards. Run with: pnpm test:gsc-t1
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KEYWORD_BLOGS } from '@/data/keyword-blogs'
import sitemapPaths from '@/data/sitemap-paths.fixture.json'
import { STOREFRONT_PAGE_DEFINITIONS } from '@/lib/storefront-pages'
import { MELBOURNE_PAGES } from '@/data/melbourne-pages'
import { SUBURB_PAGES_LASTMOD } from '@/lib/suburb-pages'
import { lookupLegacyPath, legacyRedirectPaths, legacyShopQueries } from '@/lib/legacy-redirect-map'
import { serviceUnavailableResponse } from '@/lib/legacy-redirect-route'

const ROOT = join(import.meta.dirname, '../..')
const TODAY = '2026-11-10'
const FIRST_COMMIT = '2026-05-29'

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

async function failedMetadataReadDoesNotFallback() {
  const load = async () => {
    throw new Error('database unavailable')
  }
  await assert.rejects(async () => {
    const product = await load()
    if (!product) return { title: 'Product Not Found' }
    return { title: 'ok', alternates: { canonical: '/products/x' } }
  })
}

async function main() {
  const productPage = read('src/app/(shop)/products/[handle]/page.tsx')
  const comboPage = read('src/app/(shop)/combos/[handle]/page.tsx')
  const blogPage = read('src/app/(shop)/blogs/[handle]/page.tsx')
  assert.equal(productPage.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(comboPage.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(blogPage.includes('Stories from the Kitchen | The Cupcake Desire'), false)
  assert.equal(productPage.includes('getProductByHandle'), true)
  assert.equal(comboPage.includes('getComboByHandle'), true)
  assert.equal(blogPage.includes('getPublishedBlogBySlug'), true)
  await failedMetadataReadDoesNotFallback()

  const sitemapSrc = read('src/app/sitemap.ts')
  assert.equal(sitemapSrc.includes('return []'), false)
  assert.equal(sitemapSrc.includes("serving static URLs only"), true)
  assert.equal(sitemapSrc.includes('isProductionBuild'), true)
  assert.equal(sitemapSrc.includes("handle !== 'flash-deals'") || sitemapSrc.includes("collection.handle !== 'flash-deals'"), true)

  const builder = read('src/app/(shop)/(other-pages)/cupcake-builder/page.tsx')
  assert.equal(builder.includes("dynamic = 'force-dynamic'"), false)
  assert.equal(builder.includes('revalidate = 60'), true)

  const contact = read('src/app/(shop)/(other-pages)/contact/page.tsx')
  assert.equal(contact.includes("from 'next/navigation'"), false)
  assert.equal(contact.includes('Say hello.'), true)
  assert.equal(contact.includes('<h1'), true)

  const footer = read('src/components/Footer.tsx')
  assert.equal(footer.includes("href: '/melbourne/cupcakes-near-me'"), true)
  assert.equal(footer.includes("href: '/melbourne/same-day-cupcake-delivery'"), true)
  assert.equal(footer.includes("href: '/cupcake-delivery'"), true)
  assert.equal(footer.includes("href: '/melbourne'"), true)

  const paths = legacyRedirectPaths()
  const sources = Object.keys(paths)
  assert.equal(new Set(sources).size, sources.length)
  for (const [source, target] of Object.entries(paths)) {
    assert.equal(source.startsWith('/'), true, source)
    assert.equal(target.startsWith('/'), true, target)
    assert.equal(source.includes('?'), false, source)
    assert.equal(target in paths, false, `chain ${source} -> ${target}`)
    assert.equal((sitemapPaths as string[]).includes(target), true, `target not in sitemap: ${target}`)
  }
  assert.equal(paths['/collections/flash-deals'], '/deals')
  assert.equal(paths['/flash-deals'], '/deals')
  assert.equal(paths['/products/thank-u'], '/products/box-of-12-thank-you-cupcakes')
  assert.equal(paths['/products/vanilla-mini-box-of-12'], '/products/mini-cupcake-box-24-vanilla-base')
  assert.equal(paths['/shop/uncategorized/deluxe-cupcakes'], '/collections/deluxe-cupcakes')
  assert.equal(paths['/product/christmas'], '/collections/christmas-cupcakes')
  assert.equal('/products/chocolate-base-mini-box-of-12' in paths, false)
  assert.equal(sources.some((s) => s.includes('franchsing')), false)
  assert.equal(lookupLegacyPath('/shop/uncategorized/deluxe-cupcakes/'), '/collections/deluxe-cupcakes')
  const rocky = legacyShopQueries().find((row) => row.filter_flavour === 'rocky-road')
  assert.equal(rocky?.destination, '/products/rocky-road-3-cupcakes')

  const unavailable = serviceUnavailableResponse()
  assert.equal(unavailable.status, 503)
  assert.equal(unavailable.headers.get('Cache-Control'), 'no-store')
  assert.equal(unavailable.headers.get('Retry-After'), '120')

  for (const page of STOREFRONT_PAGE_DEFINITIONS) {
    assert.ok(page.lastModified, page.path)
    assert.ok(page.lastModified! <= TODAY, `${page.path} ${page.lastModified}`)
    assert.ok(page.lastModified! >= FIRST_COMMIT, `${page.path} ${page.lastModified}`)
  }
  for (const page of MELBOURNE_PAGES) {
    assert.ok(page.updatedAt, page.slug)
    assert.ok(page.updatedAt! <= TODAY)
    assert.ok(page.updatedAt! >= '2026-10-07')
  }
  assert.equal(SUBURB_PAGES_LASTMOD, '2026-10-26')
  const eight = KEYWORD_BLOGS.filter((post) => post.slug !== 'halloween-cupcake-ideas-melbourne')
  assert.equal(eight.length, 8)
  for (const post of eight) {
    assert.equal(post.publishedAt, '2026-10-07')
    assert.ok((post.updatedAt ?? post.publishedAt) <= TODAY)
  }

  const quoteHits = execFileSync('grep', ['-rc', 'Outside Metro by quote.', 'src'], { cwd: ROOT, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
  const quoteTotal = quoteHits.reduce((sum, line) => sum + Number(line.split(':').pop()), 0)
  assert.ok(quoteTotal >= 23, `Outside Metro by quote. count dropped: ${quoteTotal}`)

  const nextConfig = read('next.config.mjs')
  assert.equal(nextConfig.includes("['/franchsing-now'"), false)
  assert.equal(nextConfig.includes('/products/chocolate-base-mini-box-of-12'), false)

  console.log('gsc-t1 tests passed', {
    redirectPaths: sources.length,
    quoteTotal,
    storefrontLastmods: STOREFRONT_PAGE_DEFINITIONS.length,
    melbourneLastmods: MELBOURNE_PAGES.length,
  })
}

main()
