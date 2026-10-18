/**
 * Run with: pnpm exec tsx src/lib/sanitize-cms-html.test.ts
 * (server-only is stubbed so the module can load outside Next.)
 */
import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)

// Stub server-only before loading the sanitiser (it only gates client bundles).
const originalLoad = (Module as any)._load
;(Module as any)._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === 'server-only') return {}
  return originalLoad.apply(this, arguments as unknown as [string, unknown, boolean])
}

async function main() {
  const modPath = pathToFileURL(require.resolve('./sanitize-cms-html.ts')).href
  const { sanitizeCmsHtml } = await import(modPath)

  // Empty / non-string
  assert.equal(sanitizeCmsHtml(''), '')
  assert.equal(sanitizeCmsHtml(null as unknown as string), '')

  // Malicious fixture: scripts, handlers, javascript:, iframe, data-*
  const dirty = `
    <p>Hello <strong>world</strong></p>
    <script>alert(1)</script>
    <img src="x" onerror="alert(1)" data-evil="1">
    <a href="javascript:alert(1)">bad</a>
    <a href="https://example.com" onclick="alert(1)">ok</a>
    <iframe src="https://evil.test"></iframe>
    <p data-start="1">kept text</p>
  `
  const clean = sanitizeCmsHtml(dirty, 'Test Page')
  assert.ok(clean.includes('<strong>world</strong>'))
  assert.ok(!/<script\b/i.test(clean))
  assert.ok(!/onerror=/i.test(clean))
  assert.ok(!/onclick=/i.test(clean))
  assert.ok(!/javascript:/i.test(clean))
  assert.ok(!/<iframe\b/i.test(clean))
  assert.ok(!/data-evil=/i.test(clean))
  assert.ok(!/data-start=/i.test(clean))
  assert.ok(/alt="Test Page"/i.test(clean))
  assert.ok(/title="Test Page"/i.test(clean))

  // Unlabelled images: figcaption preferred; multi-image indexing
  const withFigure = `
    <figure>
      <img src="/a.jpg">
      <figcaption>Vanilla swirl</figcaption>
    </figure>
    <img src="/b.jpg">
    <img src="/c.jpg" alt="Already labelled">
  `
  const labelled = sanitizeCmsHtml(withFigure, 'Cupcakes')
  assert.ok(/alt="Vanilla swirl"/i.test(labelled))
  assert.ok(/title="Vanilla swirl"/i.test(labelled))
  // Two unlabelled before the pre-labelled one → numbered fallback for the second
  // dom-serializer may encode the em dash as &#x2014;
  assert.ok(
    /alt="Cupcakes (?:—|&#x2014;) image 2"/i.test(labelled) || /alt="Cupcakes"/i.test(labelled),
    `expected numbered alt, got: ${labelled}`
  )
  assert.ok(/alt="Already labelled"/i.test(labelled))
  assert.ok(/title="Already labelled"/i.test(labelled))

  // Single unlabelled image uses page title as-is
  const one = sanitizeCmsHtml('<p><img src="/x.jpg"></p>', 'Office guide')
  assert.ok(/alt="Office guide"/i.test(one))
  assert.ok(/title="Office guide"/i.test(one))

  console.log('sanitize-cms-html.test.ts: all assertions passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
