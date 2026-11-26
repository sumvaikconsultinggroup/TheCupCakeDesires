/**
 * Option A hop walker: mapped `{/feed}?` one-hop rules before generic slash 308.
 * Run: pnpm test:redirect-hops
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  legacyRedirectPaths,
  lookupLegacyPath,
  lookupLegacyShopQuery,
} from '../src/lib/legacy-redirect-map'
import nextConfigModule from '../next.config.mjs'

// Next ships path-to-regexp without types; used only in this hop walker.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { match: pathMatch } = require('next/dist/compiled/path-to-regexp') as {
  match: (
    path: string,
    opts?: { decode?: typeof decodeURIComponent }
  ) => (path: string) => false | { params: Record<string, unknown> }
}

type RouteHas = { type: string; key?: string; value?: string }
type RedirectRule = {
  source: string
  destination: string
  permanent?: boolean
  has?: RouteHas[]
  missing?: RouteHas[]
}

const ROOT = join(import.meta.dirname, '..')
const WWW = 'www.thecupcakedesire.com.au'

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  const parseLine = (line: string) => {
    const out: string[] = []
    let cur = ''
    let inQ = false
    for (let j = 0; j < line.length; j++) {
      const c = line[j]
      if (inQ) {
        if (c === '"' && line[j + 1] === '"') {
          cur += '"'
          j++
        } else if (c === '"') inQ = false
        else cur += c
      } else if (c === '"') inQ = true
      else if (c === ',') {
        out.push(cur)
        cur = ''
      } else cur += c
    }
    out.push(cur)
    return out
  }
  const hdr = parseLine(lines[0])
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = parseLine(line)
    const row: Record<string, string> = {}
    hdr.forEach((h, i) => {
      row[h] = cols[i] ?? ''
    })
    return row
  })
}

function queryHas(params: URLSearchParams, item: RouteHas): boolean {
  if (item.type !== 'query' || !item.key) return false
  const value = params.get(item.key)
  if (!item.value) return value != null && value !== ''
  return value === item.value
}

function ruleApplies(rule: RedirectRule, params: URLSearchParams): boolean {
  if (rule.has?.length && !rule.has.every((item) => queryHas(params, item))) return false
  if (rule.missing?.length && rule.missing.some((item) => queryHas(params, item))) return false
  return true
}

function compileDestination(destination: string, params: Record<string, unknown>): string {
  let dest = destination
  const keys = Object.keys(params).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    const value = params[key]
    const text = Array.isArray(value) ? value.join('/') : String(value ?? '')
    // Replace :name+ / :name* / :name? before bare :name so /:path+ does not become /faq+.
    dest = dest.replaceAll(`:${key}+`, text)
    dest = dest.replaceAll(`:${key}*`, text)
    dest = dest.replaceAll(`:${key}?`, text)
    dest = dest.replaceAll(`:${key}`, text)
  }
  return dest
}

type Compiled = {
  rule: RedirectRule
  match: (path: string) => false | { params: Record<string, unknown> }
}

function compileRules(rules: RedirectRule[]): Compiled[] {
  return rules.map((rule) => ({
    rule,
    match: pathMatch(rule.source, { decode: decodeURIComponent }) as Compiled['match'],
  }))
}

function firstRedirect(
  pathname: string,
  params: URLSearchParams,
  compiled: Compiled[]
): { destination: string; permanent: boolean; source: string } | undefined {
  for (const row of compiled) {
    if (!ruleApplies(row.rule, params)) continue
    const hit = row.match(pathname)
    if (!hit) continue
    return {
      destination: compileDestination(row.rule.destination, hit.params || {}),
      permanent: row.rule.permanent !== false,
      source: row.rule.source,
    }
  }
  return undefined
}

function strip(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function resolveHops(
  pathname: string,
  searchParams: URLSearchParams,
  compiled: Compiled[]
): { chain: string[]; firstRule?: string } {
  const start = pathname || '/'
  const chain = [start]
  const seen = new Set([start])
  let params = searchParams
  let firstRule: string | undefined
  while (chain.length < 8) {
    const current = chain[chain.length - 1]
    const hit = firstRedirect(current, params, compiled)
    let next = hit?.destination
    if (hit && !firstRule) firstRule = hit.source
    if (!next && strip(current) === '/shop') {
      next = lookupLegacyShopQuery(params) || lookupLegacyPath('/shop')
    }
    if (!next) next = lookupLegacyPath(current)
    if (!next || next === current) break
    assert.equal(seen.has(next), false, `loop ${[...chain, next].join(' -> ')}`)
    seen.add(next)
    chain.push(next)
    params = new URLSearchParams()
  }
  return { chain, firstRule }
}

async function main() {
  const redirectsFn = nextConfigModule.redirects
  if (typeof redirectsFn !== 'function') throw new Error('missing redirects()')
  const redirects = (await redirectsFn()) as RedirectRule[]
  const rewritesFn = (nextConfigModule as { rewrites?: () => Promise<unknown> }).rewrites
  const rewrites = typeof rewritesFn === 'function' ? await rewritesFn() : []
  const headers = typeof nextConfigModule.headers === 'function' ? await nextConfigModule.headers() : []
  assert.ok(!Array.isArray(rewrites) || rewrites.length === 0, 'slash must not be a rewrite')
  assert.ok(
    redirects.some((r) => r.source === '/:path+/' && r.destination === '/:path+' && r.permanent),
    'missing generic slash 308'
  )
  assert.ok(redirects.length <= 2048, `redirects ${redirects.length}`)

  const compiled = compileRules(redirects)
  const paths = legacyRedirectPaths()
  const pathKeys = Object.keys(paths)
  const hopCsv = parseCsv(readFileSync(join(ROOT, 'src/data/gsc-evidence/one-hop-redirect-map-20261110.csv'), 'utf8'))
  const allitemsCsv = parseCsv(
    readFileSync(join(ROOT, 'src/data/gsc-evidence/allitems-1to1-targets-20261110.csv'), 'utf8')
  )
  assert.equal(hopCsv.length, 263)
  assert.equal(allitemsCsv.length, 63)
  assert.ok(pathKeys.length >= 634, `expected >=634 map paths, got ${pathKeys.length}`)

  let mapOneHop = 0
  const mapExtra: string[] = []
  for (const source of pathKeys) {
    for (const variant of [source, source === '/' ? null : `${source}/`].filter(Boolean) as string[]) {
      const { chain } = resolveHops(variant, new URLSearchParams(), compiled)
      if (chain.length !== 2 || chain[1] !== paths[source]) {
        mapExtra.push(`${variant}: ${chain.join(' -> ')} want ${paths[source]}`)
        continue
      }
      mapOneHop += 1
    }
  }

  let csvOneHop = 0
  const csvFail: string[] = []
  let wwwRows = 0
  for (const row of hopCsv) {
    const url = new URL(row.source)
    if (url.host === WWW) wwwRows += 1
    const proposed = new URL(row.proposed_one_hop_target).pathname.replace(/\/+$/, '') || '/'
    const { chain } = resolveHops(url.pathname, url.searchParams, compiled)
    if (chain.length !== 2 || chain[1] !== proposed) {
      csvFail.push(`${row.source} ${chain.join(' -> ')} want ${proposed}`)
      continue
    }
    csvOneHop += 1
  }

  let allitemsOk = 0
  const allitemsFail: string[] = []
  for (const row of allitemsCsv) {
    const url = new URL(row.source)
    const proposed = new URL(row.proposed_1to1_target).pathname.replace(/\/+$/, '') || '/'
    const { chain } = resolveHops(url.pathname, url.searchParams, compiled)
    if (chain.length !== 2 || chain[1] !== proposed) {
      allitemsFail.push(`${row.source} ${chain.join(' -> ')}`)
      continue
    }
    allitemsOk += 1
  }

  // Spot checks requested by owner.
  const molten = resolveHops('/product/molten-chocolate/', new URLSearchParams(), compiled)
  assert.deepEqual(molten.chain, ['/product/molten-chocolate/', '/products/molten-chocolate-3-cupcakes'])

  const aboutSlash = resolveHops('/about/', new URLSearchParams(), compiled)
  // /about is mapped → one hop to /about-us (never a 200 on the slash URL).
  assert.equal(aboutSlash.chain.length, 2)
  assert.equal(aboutSlash.chain[1], '/about-us')

  const unmappedSlash = ['/faq/', '/privacy-policy/', '/terms/']
  const unmappedResults = unmappedSlash.map((path) => {
    const { chain, firstRule } = resolveHops(path, new URLSearchParams(), compiled)
    assert.equal(firstRule, '/:path+/', `${path} should hit generic slash 308`)
    assert.deepEqual(chain, [path, path.replace(/\/$/, '')])
    return { path, chain, firstRule }
  })

  assert.equal(mapExtra.length, 0, mapExtra.slice(0, 8).join('; '))
  assert.equal(csvFail.length, 0, csvFail.slice(0, 8).join('; '))
  assert.equal(allitemsFail.length, 0, allitemsFail.slice(0, 8).join('; '))

  const routesManifestPath = join(ROOT, '.next/routes-manifest.json')
  assert.ok(existsSync(routesManifestPath), 'missing .next/routes-manifest.json; run next build first')
  const routesManifest: {
    redirects?: { source?: string; destination?: string; regex?: string }[]
    headers?: unknown[]
    rewrites?: { afterFiles?: unknown[]; beforeFiles?: unknown[]; fallback?: unknown[] }
  } = JSON.parse(readFileSync(routesManifestPath, 'utf8'))

  const manifestRedirects = routesManifest.redirects || []
  const manifestHeaders = Array.isArray(routesManifest.headers) ? routesManifest.headers.length : 0
  const manifestRewrites =
    (routesManifest.rewrites?.beforeFiles?.length ?? 0) +
    (routesManifest.rewrites?.afterFiles?.length ?? 0) +
    (routesManifest.rewrites?.fallback?.length ?? 0)
  const manifestTotal = manifestRedirects.length + manifestHeaders + manifestRewrites
  assert.ok(manifestTotal <= 2048, `routes-manifest total ${manifestTotal}`)
  assert.ok(
    !manifestRedirects.some((r) => (r.source || '').includes('{/feed}?')),
    'mapped rules must not use {/feed}? optional groups (Vercel prefers catch-alls)'
  )

  // First matching routes-manifest regex must land on the final destination for
  // bare, slash, /feed, and /feed/ on a sample of >=30 map paths.
  const samplePaths = pathKeys
    .filter((source) => source !== '/' && source !== '/shop' && !source.endsWith('/feed'))
    .slice(0, 40)
  assert.ok(samplePaths.length >= 30, `need >=30 map sample paths, got ${samplePaths.length}`)
  const compiledManifest = manifestRedirects.map((r) => ({
    source: r.source || '',
    destination: r.destination || '',
    regex: new RegExp(r.regex || /(?!)/),
  }))
  function firstManifestHop(pathname: string): { source: string; destination: string } | undefined {
    for (const row of compiledManifest) {
      if (!row.regex.test(pathname)) continue
      // Catch-all destinations keep :path+; expand from the match.
      if (row.destination.includes(':path+')) {
        const m = pathname.match(row.regex)
        const captured = m?.[1]
        if (captured && row.destination === '/:path+') {
          return { source: row.source, destination: `/${captured}` }
        }
      }
      return { source: row.source, destination: row.destination }
    }
    return undefined
  }
  let manifestFourVariantOk = 0
  const manifestFail: string[] = []
  for (const source of samplePaths) {
    const finalDest = paths[source]
    for (const variant of [source, `${source}/`, `${source}/feed`, `${source}/feed/`]) {
      const hop = firstManifestHop(variant)
      if (!hop || hop.destination !== finalDest) {
        manifestFail.push(`${variant}: ${hop?.destination ?? 'none'} want ${finalDest} via ${hop?.source ?? '-'}`)
        continue
      }
      manifestFourVariantOk += 1
    }
  }
  assert.equal(manifestFail.length, 0, manifestFail.slice(0, 12).join('; '))
  assert.ok(manifestFourVariantOk >= 30 * 4, `expected >=120 first-hop asserts, got ${manifestFourVariantOk}`)

  const rewriteCount = Array.isArray(rewrites) ? rewrites.length : 0
  const headerCount = Array.isArray(headers) ? headers.length : 0

  console.log(
    JSON.stringify(
      {
        option: 'B-required-literal-variants-one-rule-per-destination',
        config: {
          redirects: redirects.length,
          rewrites: rewriteCount,
          headers: headerCount,
          total: redirects.length + rewriteCount + headerCount,
        },
        routesManifest: {
          redirects: manifestRedirects.length,
          rewrites: manifestRewrites,
          headers: manifestHeaders,
          total: manifestTotal,
        },
        afterApp: {
          mapPaths: pathKeys.length,
          mapOneHop,
          csvOneHop,
          allitemsOk,
          wwwRowsNoted: wwwRows,
          manifestFourVariantOk,
          manifestSamplePaths: samplePaths.length,
          spotChecks: {
            molten: molten.chain,
            aboutSlash: aboutSlash.chain,
            unmappedSlash: unmappedResults,
          },
        },
      },
      null,
      2
    )
  )
  console.log('redirect-hops tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
