/**
 * Option B hop walker: config `{/feed}?` for non-handler aliases + rewrites into
 * legacy route handlers that map-lookup (404 if unmapped).
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { match: pathMatch } = require('next/dist/compiled/path-to-regexp') as {
  match: (path: string, opts?: { decode?: typeof decodeURIComponent }) => (path: string) => false | { params: Record<string, unknown> }
}
import {
  legacyRedirectPaths,
  lookupLegacyPath,
  lookupLegacyShopQuery,
} from '../src/lib/legacy-redirect-map'
import nextConfigModule from '../next.config.mjs'

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
    dest = dest.replaceAll(`:${key}`, text)
  }
  return dest
}

type Compiled = { rule: RedirectRule; match: (path: string) => false | { params: Record<string, unknown> } }

function compileRules(rules: RedirectRule[]): Compiled[] {
  return rules.map((rule) => ({
    rule,
    match: pathMatch(rule.source, { decode: decodeURIComponent }) as Compiled['match'],
  }))
}

function firstRedirect(pathname: string, params: URLSearchParams, compiled: Compiled[]): string | undefined {
  for (const row of compiled) {
    if (!ruleApplies(row.rule, params)) continue
    const hit = row.match(pathname)
    if (!hit) continue
    return compileDestination(row.rule.destination, hit.params || {})
  }
  return undefined
}

function strip(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

function applyRewrites(pathname: string): string {
  let current = pathname
  if (/\/feed\/?$/.test(current)) {
    current = current.replace(/\/feed\/?$/, '') || '/'
  }
  if (current !== '/' && current.endsWith('/')) {
    current = current.replace(/\/+$/, '') || '/'
  }
  return current
}

function handlerOwnedPath(pathname: string): boolean {
  const p = strip(pathname)
  return (
    p === '/shop' ||
    p.startsWith('/shop/') ||
    p.startsWith('/product/') ||
    p.startsWith('/product-category/') ||
    p.startsWith('/event/') ||
    p.startsWith('/product_event/') ||
    p.startsWith('/shopdetail/')
  )
}

function resolveHops(pathname: string, searchParams: URLSearchParams, compiled: Compiled[]): string[] {
  const start = pathname || '/'
  const chain = [start]
  const seen = new Set([start])
  let params = searchParams
  while (chain.length < 8) {
    const current = chain[chain.length - 1]
    let next = firstRedirect(current, params, compiled)

    const rewritten = applyRewrites(current)
    if (!next) next = firstRedirect(rewritten, params, compiled)

    if (!next && (strip(rewritten) === '/shop' || strip(current) === '/shop')) {
      next = lookupLegacyShopQuery(params) || lookupLegacyPath('/shop')
    }

    if (!next && handlerOwnedPath(rewritten)) {
      next = lookupLegacyPath(rewritten)
    }

    if (!next) next = lookupLegacyPath(rewritten)

    if (!next || next === current) break
    assert.equal(seen.has(next), false, `loop ${[...chain, next].join(' -> ')}`)
    seen.add(next)
    chain.push(next)
    params = new URLSearchParams()
  }
  return chain
}

async function main() {
  const redirectsFn = nextConfigModule.redirects
  const rewritesFn = nextConfigModule.rewrites
  if (typeof redirectsFn !== 'function') throw new Error('missing redirects()')
  const redirects = (await redirectsFn()) as RedirectRule[]
  const rewrites = typeof rewritesFn === 'function' ? await rewritesFn() : []
  const headers = typeof nextConfigModule.headers === 'function' ? await nextConfigModule.headers() : []
  assert.ok(redirects.length <= 2048, `redirects ${redirects.length}`)

  const compiled = compileRules(redirects)
  const paths = legacyRedirectPaths()
  const hopCsv = parseCsv(readFileSync(join(ROOT, 'src/data/gsc-evidence/one-hop-redirect-map-20261110.csv'), 'utf8'))
  const allitemsCsv = parseCsv(
    readFileSync(join(ROOT, 'src/data/gsc-evidence/allitems-1to1-targets-20261110.csv'), 'utf8')
  )
  assert.equal(hopCsv.length, 263)
  assert.equal(allitemsCsv.length, 63)

  let mapOneHop = 0
  const mapExtra: string[] = []
  for (const source of Object.keys(paths)) {
    for (const variant of [source, source === '/' ? null : `${source}/`].filter(Boolean) as string[]) {
      const chain = resolveHops(variant, new URLSearchParams(), compiled)
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
    const chain = resolveHops(url.pathname, url.searchParams, compiled)
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
    const chain = resolveHops(url.pathname, url.searchParams, compiled)
    if (chain.length !== 2 || chain[1] !== proposed) {
      allitemsFail.push(`${row.source} ${chain.join(' -> ')}`)
      continue
    }
    allitemsOk += 1
  }

  assert.equal(mapExtra.length, 0, mapExtra.slice(0, 8).join('; '))
  assert.equal(csvFail.length, 0, csvFail.slice(0, 8).join('; '))
  assert.equal(allitemsFail.length, 0, allitemsFail.slice(0, 8).join('; '))

  const routesManifestPath = join(ROOT, '.next/routes-manifest.json')
  let routesManifest: { redirects?: unknown[]; headers?: unknown[]; rewrites?: { afterFiles?: unknown[] } } | null =
    null
  if (existsSync(routesManifestPath)) {
    routesManifest = JSON.parse(readFileSync(routesManifestPath, 'utf8'))
  }

  const rewriteCount = Array.isArray(rewrites) ? rewrites.length : 0
  const headerCount = Array.isArray(headers) ? headers.length : 0

  console.log(
    JSON.stringify(
      {
        option: 'B-legacy-route-handlers',
        config: {
          redirects: redirects.length,
          rewrites: rewriteCount,
          headers: headerCount,
          total: redirects.length + rewriteCount + headerCount,
        },
        routesManifest: routesManifest
          ? {
              redirects: routesManifest.redirects?.length ?? 0,
              rewritesAfterFiles: routesManifest.rewrites?.afterFiles?.length ?? 0,
              headers: Array.isArray(routesManifest.headers) ? routesManifest.headers.length : 0,
            }
          : 'not built yet',
        afterApp: { mapOneHop, csvOneHop, allitemsOk, wwwRowsNoted: wwwRows },
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
