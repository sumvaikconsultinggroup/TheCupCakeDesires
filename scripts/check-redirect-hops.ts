/**
 * Walk every legacy map key plus the GSC one-hop / allitems CSV rows.
 * Asserts: one permanent hop to the proposed final 200 path, no loops.
 *
 * Models middleware resolveLegacyOneHop (primary) plus leftover next.config rules.
 *
 * Run: pnpm test:redirect-hops
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { legacyRedirectPaths } from '../src/lib/legacy-redirect-map'
import { APEX_HOST, WWW_HOST, apexDestination, resolveLegacyOneHop } from '../src/lib/legacy-one-hop'
import nextConfigModule from '../next.config.mjs'

type RedirectRule = {
  source: string
  destination: string
  permanent?: boolean
  has?: Array<{ type: string; value: string }>
}

const ROOT = join(import.meta.dirname, '..')
const APEX = APEX_HOST
const WWW = WWW_HOST

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
        if (seg === ':path*') {
          names.push('path*')
          return '(.*)'
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
    dest = dest.replaceAll(`:${name}`, matched[index + 1] ?? '')
  })
  return dest
}

function hostMatches(rule: RedirectRule, host: string): boolean {
  if (!rule.has?.length) return true
  return rule.has.every((cond) => (cond.type === 'host' ? host === cond.value : false))
}

function firstConfigHop(pathname: string, host: string, rules: RedirectRule[]): string | undefined {
  for (const rule of rules) {
    if (!hostMatches(rule, host)) continue
    const dest = matchRedirectRule(rule.source, rule.destination, pathname)
    if (dest) return dest
  }
  return undefined
}

function pathFromDest(dest: string, fallbackHost: string): { host: string; pathname: string } {
  if (/^https?:\/\//i.test(dest)) {
    const url = new URL(dest)
    return { host: url.host, pathname: url.pathname || '/' }
  }
  return { host: fallbackHost, pathname: dest }
}

function resolveHops(
  pathname: string,
  searchParams: URLSearchParams,
  host: string,
  rules: RedirectRule[]
): string[] {
  const startPath = pathname || '/'
  const chain = [`${host}${startPath}`]
  const seen = new Set(chain)
  let params = searchParams
  let currentHost = host
  let currentPath = startPath

  while (chain.length < 8) {
    let next: string | undefined

    const viaMiddleware = resolveLegacyOneHop(currentPath, params)
    if (viaMiddleware) {
      next = currentHost === WWW ? apexDestination(viaMiddleware) : viaMiddleware
    } else if (currentHost === WWW) {
      next = apexDestination(currentPath === '/' ? '/' : currentPath)
    } else {
      next = firstConfigHop(currentPath, currentHost, rules)
    }

    if (!next) break

    const parsed = pathFromDest(next, currentHost === WWW ? APEX : currentHost)
    const key = `${parsed.host}${parsed.pathname}`
    if (key === `${currentHost}${currentPath}`) break
    assert.equal(seen.has(key), false, `redirect loop: ${[...chain, key].join(' -> ')}`)
    seen.add(key)
    chain.push(key)
    currentHost = parsed.host
    currentPath = parsed.pathname
    params = new URLSearchParams()
  }

  return chain
}

function chainPath(entry: string): string {
  if (/^https?:\/\//i.test(entry)) return new URL(entry).pathname || '/'
  if (entry.startsWith(WWW)) return entry.slice(WWW.length) || '/'
  if (entry.startsWith(APEX)) return entry.slice(APEX.length) || '/'
  return entry
}

function inspectRouteBudget(rules: RedirectRule[]): {
  configRedirects: number
  underLimit: boolean
  notes: string[]
} {
  const notes: string[] = [
    `next.config redirects(): ${rules.length} (Vercel hard cap 2048 routes)`,
  ]
  const routesManifestPath = join(ROOT, '.next/routes-manifest.json')
  if (existsSync(routesManifestPath)) {
    const manifest = JSON.parse(readFileSync(routesManifestPath, 'utf8')) as {
      trailingSlash?: boolean
      redirects?: unknown[]
    }
    notes.push(
      `.next/routes-manifest redirects=${manifest.redirects?.length ?? 0} trailingSlash=${JSON.stringify(manifest.trailingSlash)}`
    )
  }
  const vercelConfig = join(ROOT, '.vercel/output/config.json')
  if (existsSync(vercelConfig)) {
    notes.push('Found .vercel/output/config.json')
  } else {
    notes.push('No .vercel/output/config.json in this environment')
  }
  return {
    configRedirects: rules.length,
    underLimit: rules.length < 2048,
    notes,
  }
}

async function main() {
  const redirectsFn = nextConfigModule.redirects
  if (typeof redirectsFn !== 'function') throw new Error('next.config.mjs missing redirects()')
  const rules = (await redirectsFn()) as RedirectRule[]
  const budget = inspectRouteBudget(rules)
  assert.equal(budget.underLimit, true, `too many config redirects: ${budget.configRedirects}`)

  const paths = legacyRedirectPaths()
  const hopCsv = parseCsv(
    readFileSync(join(ROOT, 'src/data/gsc-evidence/one-hop-redirect-map-20261110.csv'), 'utf8')
  )
  const allitemsCsv = parseCsv(
    readFileSync(join(ROOT, 'src/data/gsc-evidence/allitems-1to1-targets-20261110.csv'), 'utf8')
  )

  assert.equal(hopCsv.length, 263, `expected 263 hop CSV rows, got ${hopCsv.length}`)
  assert.equal(allitemsCsv.length, 63, `expected 63 allitems rows, got ${allitemsCsv.length}`)

  const before = { one: 0, multi: 0, byReason: { slash: 0, www: 0, feed: 0 } as Record<string, number> }
  for (const row of hopCsv) {
    const codes = (row.current_codes || '').split('>').filter((c) => c && c !== '200')
    if (codes.length <= 1) before.one += 1
    else before.multi += 1
    const reason = row.hops_to_remove || ''
    if (reason.includes('www')) before.byReason.www += 1
    else if (reason.includes('trailing-slash')) before.byReason.slash += 1
    else if (reason.includes('/feed')) before.byReason.feed += 1
  }

  let mapOneHop = 0
  const mapExtra: string[] = []
  for (const source of Object.keys(paths)) {
    for (const variant of [source, source === '/' ? null : `${source}/`].filter(Boolean) as string[]) {
      const chain = resolveHops(variant, new URLSearchParams(), APEX, rules)
      if (chain.length !== 2) {
        mapExtra.push(chain.join(' -> '))
        continue
      }
      assert.equal(chainPath(chain[1]), paths[source], `${variant} landed on ${chainPath(chain[1])}`)
      mapOneHop += 1
    }
  }

  let csvOneHop = 0
  const csvStillMulti: Array<{ source: string; chain: string; why: string }> = []
  const platformResidual: Array<{ source: string; why: string }> = []
  for (const row of hopCsv) {
    const url = new URL(row.source)
    const proposedPath = (new URL(row.proposed_one_hop_target).pathname.replace(/\/+$/, '') || '/')
    const chain = resolveHops(url.pathname, url.searchParams, url.host, rules)
    const finalPath = chainPath(chain[chain.length - 1]).replace(/\/+$/, '') || '/'
    assert.equal(finalPath, proposedPath, `${row.source} final ${finalPath} != ${proposedPath}`)

    const hops = chain.length - 1
    if (hops === 1) {
      csvOneHop += 1
      if (url.host === WWW) {
        platformResidual.push({
          source: row.source,
          why: 'Vercel www-to-apex domain redirect runs before Next; app host rules only help if www reaches the deployment',
        })
      }
      continue
    }
    csvStillMulti.push({
      source: row.source,
      chain: chain.join(' -> '),
      why: `app walker still ${hops} hops`,
    })
  }

  let allitemsOk = 0
  for (const row of allitemsCsv) {
    const url = new URL(row.source)
    const proposedPath = new URL(row.proposed_1to1_target).pathname.replace(/\/+$/, '') || '/'
    const chain = resolveHops(url.pathname, url.searchParams, url.host, rules)
    const finalPath = chainPath(chain[chain.length - 1]).replace(/\/+$/, '') || '/'
    assert.equal(finalPath, proposedPath, `allitems ${row.source} -> ${finalPath}`)
    assert.equal(chain.length, 2, `allitems hops ${row.source}: ${chain.join(' -> ')}`)
    allitemsOk += 1
    if (url.host === WWW) {
      platformResidual.push({
        source: row.source,
        why: 'Vercel www-to-apex domain redirect runs before Next; app host rules only help if www reaches the deployment',
      })
    }
  }

  assert.equal(mapExtra.length, 0, mapExtra.slice(0, 8).join('; '))
  assert.equal(
    csvStillMulti.length,
    0,
    csvStillMulti.slice(0, 8).map((r) => `${r.source} ${r.chain}`).join('; ')
  )

  console.log(
    JSON.stringify(
      {
        before: {
          hopCsvRows: hopCsv.length,
          multiHop: before.multi,
          oneHop: before.one,
          trailingSlashEvidence: before.byReason.slash,
          wwwEvidence: before.byReason.www,
          feedEvidence: before.byReason.feed,
        },
        afterApp: {
          mapVariantsOneHop: mapOneHop,
          hopCsvOneHop: csvOneHop,
          hopCsvStillMultiApp: csvStillMulti.length,
          allitemsOk,
          platformWwwResidual: platformResidual.length,
          configRedirects: budget.configRedirects,
        },
        routeBudget: budget,
        platformResidualSamples: platformResidual.slice(0, 12),
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
