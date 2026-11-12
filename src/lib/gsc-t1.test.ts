/**
 * GSC T1 guards. Run with: pnpm test:gsc-t1
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KEYWORD_BLOGS } from '@/data/keyword-blogs'
import sitemapPaths from '@/data/sitemap-paths.fixture.json'
import gscT1QaRows from '@/data/gsc-t1-qa-rows.json'
import { STOREFRONT_PAGE_DEFINITIONS } from '@/lib/storefront-pages'
import { MELBOURNE_PAGES } from '@/data/melbourne-pages'
import { SUBURB_PAGES_LASTMOD } from '@/lib/suburb-pages'
import {
  lookupLegacyPath,
  lookupLegacyShopQuery,
  legacyRedirectPaths,
  legacyShopQueries,
} from '@/lib/legacy-redirect-map'
import { serviceUnavailableResponse } from '@/lib/legacy-redirect-route'
import nextConfigModule from '../../next.config.mjs'

type RedirectRule = { source: string; destination: string; has?: unknown }

const ROOT = join(import.meta.dirname, '../..')
const TODAY = '2026-11-10'
const FIRST_COMMIT = '2026-05-29'

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

async function failedMetadataReadDoesNotFallback() {
  const previous = process.env.MONGODB_URI
  delete process.env.MONGODB_URI
  try {
    const { generateMetadata } = await import('../app/(shop)/products/[handle]/generate-metadata')
    await assert.rejects(() =>
      generateMetadata({ params: Promise.resolve({ handle: 'standard-cupcake-box-3' }) })
    )
  } finally {
    if (previous !== undefined) process.env.MONGODB_URI = previous
    else delete process.env.MONGODB_URI
  }
}

function matchRedirectRule(sourcePattern: string, destination: string, pathname: string): string | undefined {
  if (sourcePattern === pathname) return destination
  if (!sourcePattern.includes(':')) return undefined
  const names: string[] = []
  const regex = new RegExp(
    `^${sourcePattern
      .split('/')
      .map((seg) => {
        if (seg === ':path+') {
          names.push('path+')
          return '(.+)'
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z0-9_]+)/g, (_m, name: string) => {
          names.push(name)
          return '([^/]+)'
        })
      })
      .join('/')}$`
  )
  const matched = pathname.match(regex)
  if (!matched) return undefined
  let dest = destination
  names.forEach((name, index) => {
    dest = dest.replaceAll(`:${name}`, matched[index + 1])
  })
  return dest
}

function firstConfigHop(pathname: string, rules: RedirectRule[]): string | undefined {
  for (const rule of rules) {
    if (rule.has) continue
    const dest = matchRedirectRule(rule.source, rule.destination, pathname)
    if (dest) return dest
  }
  return undefined
}

function stripTrailingSlash(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function hopPath(pathname: string, searchParams: URLSearchParams, rules: RedirectRule[]): string | undefined {
  // Preserve trailing slashes so /legacy/ is matched by explicit slash twins
  // (or the catch-all strip), not silently collapsed before the first hop.
  if (stripTrailingSlash(pathname) === '/shop') {
    if (searchParams.get('filter_flavour') || searchParams.get('product_cat')) {
      return lookupLegacyShopQuery(searchParams)
    }
    if (!searchParams.get('filter_flavour') && !searchParams.get('product_cat')) {
      return lookupLegacyPath('/shop')
    }
  }
  return firstConfigHop(pathname, rules) || lookupLegacyPath(pathname)
}

function resolveHops(pathname: string, searchParams: URLSearchParams, rules: RedirectRule[]): string[] {
  const start = pathname || '/'
  const chain = [start]
  const seen = new Set([start])
  let params = searchParams
  while (chain.length < 8) {
    const current = chain[chain.length - 1]
    const next = hopPath(current, params, rules)
    if (!next || next === current) break
    // Absolute www destinations collapse to pathname for apex chain compare.
    const nextPath = /^https?:\/\//i.test(next) ? new URL(next).pathname || '/' : next
    assert.equal(seen.has(nextPath), false, `redirect loop: ${[...chain, nextPath].join(' -> ')}`)
    seen.add(nextPath)
    chain.push(nextPath)
    params = new URLSearchParams()
  }
  return chain
}

function qaKeyFromSource(source: string): string {
  const url = new URL(source)
  const path = stripTrailingSlash(url.pathname)
  const query = url.searchParams.toString()
  return query ? `${path}?${query}` : path
}

async function main() {
  const productPage = read('src/app/(shop)/products/[handle]/page.tsx')
  const comboPage = read('src/app/(shop)/combos/[handle]/page.tsx')
  const blogPage = read('src/app/(shop)/blogs/[handle]/page.tsx')
  assert.equal(productPage.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(comboPage.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(blogPage.includes('Stories from the Kitchen | The Cupcake Desire'), false)
  assert.equal(productPage.includes('getProductByHandle'), true)
  assert.equal(productPage.includes("from './generate-metadata'"), true)
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
  assert.equal(paths['/product/molten-chocolate'], '/products/molten-chocolate-3-cupcakes')
  assert.equal(paths['/event'], '/cupcake-builder')
  assert.equal(paths['/product-category/gift-voucher/feed'], '/gift-voucher')
  assert.equal(paths['/event/diwali-cupcakes/feed'], '/collections/diwali-cupcakes')
  assert.equal(paths['/shop/cakes/vanilla-vanilla-round-cake/feed'], '/products/vanilla-vanilla-round-cake')
  assert.equal(sources.some((s) => s.startsWith('/shopdetail/')), false)
  assert.equal('/products/chocolate-base-mini-box-of-12' in paths, false)
  assert.equal(sources.some((s) => s.includes('franchsing')), false)
  assert.equal(lookupLegacyPath('/shop/uncategorized/deluxe-cupcakes/'), '/collections/deluxe-cupcakes')
  const rocky = legacyShopQueries().find((row) => row.filter_flavour === 'rocky-road' && row.product_cat === 'deluxe-cupcakes')
  assert.equal(rocky?.destination, '/products/rocky-road-3-cupcakes')
  assert.equal(legacyShopQueries().length, 7)

  const redirectsFn = nextConfigModule.redirects
  if (typeof redirectsFn !== 'function') {
    throw new Error('next.config.mjs is missing redirects()')
  }
  const redirectRules = await redirectsFn()
  const sitemap = new Set(sitemapPaths as string[])
  let oneHop = 0
  let extraHops = 0
  const missingSitemap: string[] = []
  const twoHopSamples: string[] = []
  for (const source of sources) {
    const chain = resolveHops(source, new URLSearchParams(), redirectRules)
    const dest = chain[1]
    assert.ok(dest, `no hop for ${source}`)
    if (chain.length !== 2) {
      extraHops += 1
      if (twoHopSamples.length < 8) twoHopSamples.push(chain.join(' -> '))
    } else {
      oneHop += 1
    }
    if (!sitemap.has(dest)) missingSitemap.push(`${source} -> ${dest}`)
  }
  assert.equal(missingSitemap.length, 0, missingSitemap.slice(0, 10).join('; '))
  assert.equal(extraHops, 0, twoHopSamples.join('; '))
  assert.equal(oneHop, sources.length)

  const qaRows = gscT1QaRows as Array<{ source: string; key: string; qa_target: string }>
  assert.equal(qaRows.length, 326)
  const qaKeys = new Set(qaRows.map((row) => row.key))
  assert.equal(qaKeys.size, 250)
  let qaOneHop = 0
  const qaTwoHop: string[] = []
  for (const row of qaRows) {
    assert.equal(qaKeyFromSource(row.source), row.key, row.source)
    const url = new URL(row.source)
    const chain = resolveHops(url.pathname, url.searchParams, redirectRules)
    if (chain.length !== 2) {
      qaTwoHop.push(`${row.source} ${chain.join(' -> ')}`)
      continue
    }
    assert.equal(chain[1], row.qa_target, row.source)
    assert.equal(sitemap.has(chain[1]), true, `QA target not in sitemap: ${row.source} -> ${chain[1]}`)
    qaOneHop += 1
  }
  assert.equal(qaTwoHop.length, 0, qaTwoHop.slice(0, 8).join('; '))
  assert.equal(qaOneHop, qaRows.length)

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
    assert.equal(post.updatedAt, '2026-10-20')
  }
  assert.equal(STOREFRONT_PAGE_DEFINITIONS.find((p) => p.path === '/cupcake-builder')?.lastModified, '2026-10-26')
  assert.equal(STOREFRONT_PAGE_DEFINITIONS.find((p) => p.path === '/bday-party')?.lastModified, '2026-10-26')
  assert.equal(STOREFRONT_PAGE_DEFINITIONS.find((p) => p.path === '/gluten-free-cupcakes')?.lastModified, '2026-10-26')
  assert.equal(MELBOURNE_PAGES.find((p) => p.slug === 'bluey-cake')?.updatedAt, '2026-10-26')
  assert.equal(MELBOURNE_PAGES.find((p) => p.slug === 'birthday-cakes')?.updatedAt, '2026-10-07')
  assert.equal(MELBOURNE_PAGES.find((p) => p.slug === 'same-day-cupcake-delivery')?.updatedAt, '2026-10-19')

  const quoteHits = execFileSync(
    'grep',
    ['-rc', '--exclude=*.test.ts', '--exclude=*.test.tsx', '--exclude=*.test.js', 'Outside Metro by quote.', 'src'],
    { cwd: ROOT, encoding: 'utf8' }
  )
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
    oneHop,
    extraHops,
    qaRows: qaRows.length,
    qaDistinctKeys: qaKeys.size,
    qaOneHop,
    missingSitemap: missingSitemap.length,
    quoteTotal,
    storefrontLastmods: STOREFRONT_PAGE_DEFINITIONS.length,
    melbourneLastmods: MELBOURNE_PAGES.length,
  })
}

main()
