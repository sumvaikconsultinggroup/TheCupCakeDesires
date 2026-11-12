#!/usr/bin/env node
/**
 * Measure HTML-discovered resource requests + total bytes for a list of paths
 * against a running Next.js production server (default http://127.0.0.1:3000).
 *
 * Counts: document + linked CSS/JS/fonts/preloads/images found in the initial
 * HTML (same surface Googlebot sees before full JS execution), plus .woff2
 * urls referenced from fetched same-origin CSS.
 */
import { writeFileSync } from 'node:fs'

const BASE = process.env.MEASURE_BASE || 'http://127.0.0.1:3000'
const PATHS = (
  process.env.MEASURE_PATHS ||
  '/,/products/standard-cupcake-box-3,/cupcake-delivery/clayton-south'
).split(',')
const OUT = process.env.MEASURE_OUT || ''

function absolutize(url, base) {
  try {
    return new URL(url, base).href
  } catch {
    return null
  }
}

function collectFromHtml(html, pageUrl) {
  const urls = new Set([pageUrl])
  const patterns = [
    /<script[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(html))) {
      const abs = absolutize(m[1], pageUrl)
      if (abs && !abs.startsWith('data:')) urls.add(abs)
    }
  }
  const linkRe = /<link\b([^>]+)>/gi
  let lm
  while ((lm = linkRe.exec(html))) {
    const tag = lm[1]
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1]
    if (!href || href.startsWith('data:')) continue
    const abs = absolutize(href, pageUrl)
    if (abs) urls.add(abs)
  }
  return [...urls]
}

function woff2FromCss(css, cssUrl) {
  const out = []
  const re = /url\((["']?)([^)"']+\.woff2[^)"']*)\1\)/gi
  let m
  while ((m = re.exec(css))) {
    const abs = absolutize(m[2], cssUrl)
    if (abs) out.push(abs)
  }
  return out
}

function classify(url) {
  const u = url.toLowerCase()
  if (u.includes('.woff2') || u.includes('/font')) return 'font'
  if (u.includes('.css')) return 'css'
  if (u.includes('.js') || u.includes('clerk')) return 'js'
  if (/\.(png|jpe?g|webp|gif|svg|ico)(\?|$)/.test(u) || u.includes('/_next/image')) return 'image'
  return 'document_or_other'
}

async function sizeOf(url) {
  try {
    const head = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const cl = head.headers.get('content-length')
    if (cl && Number.isFinite(Number(cl))) return { status: head.status, bytes: Number(cl), ok: head.ok }
    const get = await fetch(url, { method: 'GET', redirect: 'follow' })
    const buf = Buffer.from(await get.arrayBuffer())
    return { status: get.status, bytes: buf.byteLength, ok: get.ok }
  } catch (err) {
    return { status: 0, bytes: 0, ok: false, error: String(err.message || err) }
  }
}

async function measurePath(path) {
  const pageUrl = absolutize(path, BASE)
  const res = await fetch(pageUrl, {
    headers: { 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
    redirect: 'follow',
  })
  const html = await res.text()
  const resources = new Set(collectFromHtml(html, pageUrl))

  // Expand same-origin CSS for @font-face .woff2 references (crawl surface).
  for (const url of [...resources]) {
    if (!url.includes('.css')) continue
    try {
      const cssRes = await fetch(url)
      const css = await cssRes.text()
      for (const fontUrl of woff2FromCss(css, url)) resources.add(fontUrl)
    } catch {
      /* ignore */
    }
  }

  const sizes = await Promise.all([...resources].map(async (url) => ({ url, ...(await sizeOf(url)) })))
  const byType = {}
  let totalBytes = 0
  for (const row of sizes) {
    const t = classify(row.url)
    byType[t] = byType[t] || { count: 0, bytes: 0 }
    byType[t].count += 1
    byType[t].bytes += row.bytes || 0
    totalBytes += row.bytes || 0
  }
  return {
    path,
    finalUrl: res.url,
    status: res.status,
    htmlBytes: Buffer.byteLength(html),
    resourceRequests: sizes.length,
    totalBytes,
    byType,
    scriptTags: (html.match(/<script[^>]+src=/gi) || []).length,
    preloadTags: (html.match(/rel=["']preload["']/gi) || []).length,
    woff2Refs: [...resources].filter((u) => u.includes('.woff2')).length,
    clerkDevScript: /clerk\.accounts\.dev/i.test(html),
    pkTest: /pk_test_/i.test(html),
    hasCollectionsCupcakes: /\/collections\/cupcakes(?![\w-])/i.test(html),
  }
}

const results = []
for (const path of PATHS) {
  results.push(await measurePath(path.trim()))
}

const summary = { base: BASE, measuredAt: new Date().toISOString(), pages: results }
const text = JSON.stringify(summary, null, 2)
if (OUT) writeFileSync(OUT, text)
console.log(text)
