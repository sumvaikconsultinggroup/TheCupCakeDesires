/**
 * Guards for server H1s on /contact and /cupcake-builder, plus the
 * flash-deals → /deals canonical/redirect decision (no duplicate indexable page).
 *
 *   pnpm test:h1-canonical
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { legacyRedirectPaths } from '@/lib/legacy-redirect-map'
import nextConfigModule from '../../next.config.mjs'

// Next ships path-to-regexp without types; used only to resolve {/feed}? sources.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { match: pathMatch } = require('next/dist/compiled/path-to-regexp') as {
  match: (
    path: string,
    opts?: { decode?: typeof decodeURIComponent }
  ) => (path: string) => false | { params: Record<string, unknown> }
}

const ROOT = join(import.meta.dirname, '../..')

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function countH1(src: string) {
  return (src.match(/<h1\b/g) || []).length
}

function firstRedirectDestination(
  pathname: string,
  rules: { source: string; destination: string }[]
): string | undefined {
  for (const rule of rules) {
    const hit = pathMatch(rule.source, { decode: decodeURIComponent })(pathname)
    if (!hit) continue
    let dest = rule.destination
    const params = hit.params || {}
    const keys = Object.keys(params).sort((a, b) => b.length - a.length)
    for (const key of keys) {
      const value = params[key]
      const text = Array.isArray(value) ? value.join('/') : String(value ?? '')
      dest = dest.replaceAll(`:${key}+`, text)
      dest = dest.replaceAll(`:${key}*`, text)
      dest = dest.replaceAll(`:${key}?`, text)
      dest = dest.replaceAll(`:${key}`, text)
    }
    return dest
  }
  return undefined
}

async function main() {
  // ─── /contact: exactly one H1, SSR-safe (no useSearchParams / Suspense bailout) ───
  const contact = read('src/app/(shop)/(other-pages)/contact/page.tsx')
  assert.equal(countH1(contact), 1, 'contact page must declare exactly one <h1')
  assert.equal(contact.includes('Say hello.'), true)
  assert.equal(contact.includes("from 'next/navigation'"), false)
  assert.equal(contact.includes('useSearchParams'), false)
  assert.equal(contact.includes('Suspense'), false)

  // ─── /cupcake-builder: exactly one H1 across server page + client shell ───
  const builderPage = read('src/app/(shop)/(other-pages)/cupcake-builder/page.tsx')
  const builderClient = read('src/app/(shop)/(other-pages)/cupcake-builder/CupcakeBuilderClient.tsx')
  assert.equal(countH1(builderPage) + countH1(builderClient), 1, 'cupcake-builder must have exactly one <h1')
  assert.equal(builderClient.includes('Pick your treats.'), true)
  assert.equal(builderPage.includes("dynamic = 'force-dynamic'"), false)
  assert.equal(builderPage.includes('revalidate = 60'), true)

  // ─── Flash deals: preferred URL is /deals; aliases one-hop redirect here ───
  const dealsLayout = read('src/app/(shop)/deals/layout.tsx')
  assert.equal(
    dealsLayout.includes("canonical: 'https://thecupcakedesire.com.au/deals'") ||
      dealsLayout.includes('canonical: FLASH_DEALS_CANONICAL'),
    true,
    'deals layout must declare absolute production canonical'
  )
  assert.equal(dealsLayout.includes("https://thecupcakedesire.com.au/deals"), true)
  assert.equal(dealsLayout.includes('index: true'), true)
  assert.equal(dealsLayout.includes('follow: true'), true)

  const paths = legacyRedirectPaths()
  assert.equal(paths['/flash-deals'], '/deals')
  assert.equal(paths['/collections/flash-deals'], '/deals')

  const redirectsFn = nextConfigModule.redirects
  if (typeof redirectsFn !== 'function') {
    throw new Error('next.config.mjs is missing redirects()')
  }
  const rules = (await redirectsFn()) as { source: string; destination: string }[]

  for (const source of [
    '/flash-deals',
    '/flash-deals/',
    '/collections/flash-deals',
    '/collections/flash-deals/',
  ]) {
    assert.equal(
      firstRedirectDestination(source, rules),
      '/deals',
      `${source} must 301 one-hop to /deals`
    )
  }

  // Storefront must not keep an indexable self-link to the old collection URL.
  const dealsContent = read('src/app/(shop)/deals/DealsContent.tsx')
  assert.equal(dealsContent.includes('/collections/flash-deals'), false)
  const homepageDefaults = read('src/lib/homepage-sections-defaults.ts')
  assert.equal(homepageDefaults.includes("ctaHref: '/deals'"), true)
  assert.equal(homepageDefaults.includes("ctaHref: '/collections/flash-deals'"), false)

  const sitemapSrc = read('src/app/sitemap.ts')
  assert.equal(
    sitemapSrc.includes("handle !== 'flash-deals'") || sitemapSrc.includes("collection.handle !== 'flash-deals'"),
    true,
    'sitemap must omit the flash-deals collection URL'
  )

  // Optional: fetch a running server (local `next start` or preview) and assert HTML.
  //   BASE_URL=http://127.0.0.1:3000 pnpm test:h1-canonical
  const base = (process.env.BASE_URL || '').replace(/\/+$/, '')
  let fetched: Record<string, unknown> | undefined
  if (base) {
    async function get(path: string, redirect: 'manual' | 'follow' = 'follow') {
      const res = await fetch(`${base}${path}`, { redirect })
      const html = redirect === 'follow' ? await res.text() : ''
      return { res, html }
    }

    const contactHtml = (await get('/contact')).html
    assert.equal(countH1(contactHtml), 1, 'fetched /contact must have exactly one H1')
    assert.equal(contactHtml.includes('Say hello.'), true)

    const builderHtml = (await get('/cupcake-builder')).html
    assert.equal(countH1(builderHtml), 1, 'fetched /cupcake-builder must have exactly one H1')
    assert.equal(builderHtml.includes('Pick your treats.'), true)

    const deals = await get('/deals')
    const canonical = deals.html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || ''
    assert.match(canonical, /href=["']https:\/\/thecupcakedesire\.com\.au\/deals["']/)
    assert.match(deals.html, /name=["']robots["'][^>]*content=["'][^"']*index/i)

    for (const path of ['/flash-deals', '/flash-deals/', '/collections/flash-deals', '/collections/flash-deals/']) {
      const { res } = await get(path, 'manual')
      assert.equal([301, 308].includes(res.status), true, `${path} status ${res.status}`)
      const location = res.headers.get('location') || ''
      assert.equal(
        location === '/deals' || location.endsWith('/deals'),
        true,
        `${path} Location=${location}`
      )
    }

    fetched = {
      contactH1: countH1(contactHtml),
      builderH1: countH1(builderHtml),
      dealsCanonical: canonical,
    }
  }

  console.log('h1-canonical guards passed', {
    contactH1: countH1(contact),
    builderH1: countH1(builderPage) + countH1(builderClient),
    dealsCanonical: 'https://thecupcakedesire.com.au/deals',
    flashDealRedirects: [
      '/flash-deals',
      '/flash-deals/',
      '/collections/flash-deals',
      '/collections/flash-deals/',
    ],
    fetched: fetched || null,
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
