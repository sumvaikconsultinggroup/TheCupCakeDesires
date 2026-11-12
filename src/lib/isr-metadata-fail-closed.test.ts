/**
 * Prove product and collection generateMetadata cannot emit a degraded head
 * when the catalogue read fails. Run with: pnpm test:isr-metadata
 *
 * No real database. Covers:
 * 1) MONGODB_URI unset (connectDb throws)
 * 2) reader returns null → notFound / 404 path (no title-only head)
 * 3) reader rejects → throw (ISR keeps last good page)
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Metadata } from 'next'
import {
  assertCompleteStorefrontMetadata,
  isDegradedStorefrontTitle,
  metadataLooksDegraded,
  pickMetaDescription,
} from '@/lib/isr-metadata'

const ROOT = join(import.meta.dirname, '../..')

const PRODUCT_HANDLES = [
  'standard-cupcake-box-3',
  'deluxe-box-of-12',
  'mini-cupcake-box-24',
  'molten-chocolate-round-cake',
  'box-of-12-birthday-cupcakes',
] as const

const COLLECTION_HANDLES = ['birthday-cupcakes', 'all-items'] as const

function read(rel: string) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function snapshotHead(meta: Metadata) {
  return {
    title: typeof meta.title === 'string' ? meta.title : '',
    description: typeof meta.description === 'string' ? meta.description : '',
    canonical: typeof meta.alternates?.canonical === 'string' ? meta.alternates.canonical : '',
    robots: meta.robots,
  }
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const dig = (error as { digest?: string }).digest || ''
  const msg = error instanceof Error ? error.message : String(error)
  return dig === 'NEXT_HTTP_ERROR_FALLBACK;404' || /NEXT_NOT_FOUND|notFound/i.test(msg) || dig.includes('404')
}

async function withClearedMongoUri<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.MONGODB_URI
  delete process.env.MONGODB_URI
  try {
    return await fn()
  } finally {
    if (previous !== undefined) process.env.MONGODB_URI = previous
    else delete process.env.MONGODB_URI
  }
}

async function expectThrows(
  label: string,
  run: () => Promise<Metadata>,
  opts: { preferNotFound?: boolean } = {}
): Promise<'notFound' | 'threw'> {
  let resolved: Metadata | undefined
  let error: unknown
  try {
    resolved = await run()
  } catch (err) {
    error = err
  }

  assert.equal(
    resolved,
    undefined,
    `${label}: must not resolve metadata (got ${JSON.stringify(resolved && snapshotHead(resolved))})`
  )
  assert.ok(error, `${label}: expected rejection`)
  if (resolved !== undefined) {
    assert.equal(metadataLooksDegraded(resolved), true, `${label}: resolved head looks publishable`)
  }
  if (opts.preferNotFound) {
    assert.equal(isNotFoundError(error), true, `${label}: expected notFound(), got ${String(error)}`)
    return 'notFound'
  }
  return 'threw'
}

async function main() {
  assert.equal(isDegradedStorefrontTitle('The Cupcake Desire'), true)
  assert.equal(isDegradedStorefrontTitle('Product Not Found'), true)
  assert.equal(isDegradedStorefrontTitle('Combo Not Found'), true)
  assert.equal(isDegradedStorefrontTitle('Post Not Found'), true)
  assert.equal(isDegradedStorefrontTitle('Birthday Cupcakes | The Cupcake Desire'), false)

  // Short CMS description must NOT hard-fail once title + canonical are present.
  assert.doesNotThrow(() =>
    assertCompleteStorefrontMetadata(
      {
        title: 'Standard Cupcake Box | The Cupcake Desire',
        description: 'short',
        canonical: '/products/standard-cupcake-box-3',
      },
      'unit'
    )
  )
  assert.throws(() =>
    assertCompleteStorefrontMetadata(
      { title: 'The Cupcake Desire', description: 'short', canonical: '/products/x' },
      'unit'
    )
  )
  assert.throws(() =>
    assertCompleteStorefrontMetadata(
      {
        title: 'Standard Cupcake Box | The Cupcake Desire',
        description: 'anything',
        canonical: '',
      },
      'unit'
    )
  )

  assert.equal(
    pickMetaDescription('Too short', 'A generated description that is long enough for search snippets.'),
    'A generated description that is long enough for search snippets.'
  )
  assert.equal(pickMetaDescription('Only short CMS blurb available'), 'Only short CMS blurb available')

  const productMetaSrc = read('src/app/(shop)/products/[handle]/generate-metadata.ts')
  const collectionMetaSrc = read('src/app/(shop)/collections/[collection]/generate-metadata.ts')
  const productPage = read('src/app/(shop)/products/[handle]/page.tsx')
  const collectionPage = read('src/app/(shop)/collections/[collection]/page.tsx')
  const comboPage = read('src/app/(shop)/combos/[handle]/page.tsx')
  const blogPage = read('src/app/(shop)/blogs/[handle]/page.tsx')

  assert.equal(productMetaSrc.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(productMetaSrc.includes("title: 'Product Not Found'"), false)
  assert.equal(productMetaSrc.includes('assertCompleteStorefrontMetadata'), true)
  assert.equal(productMetaSrc.includes('notFound()'), true)
  assert.equal(collectionMetaSrc.includes("title: 'The Cupcake Desire'"), false)
  assert.equal(collectionMetaSrc.includes('assertCompleteStorefrontMetadata'), true)
  assert.equal(productPage.includes("from './generate-metadata'"), true)
  assert.equal(collectionPage.includes("from './generate-metadata'"), true)
  assert.equal(productPage.includes('getProductByHandle'), true)
  assert.equal(collectionPage.includes('getCollectionByHandle'), true)
  assert.equal(comboPage.includes("title: 'Combo Not Found'"), false)
  assert.equal(blogPage.includes("title: 'Post Not Found'"), false)
  assert.equal(comboPage.includes('notFound()'), true)
  assert.equal(blogPage.includes('notFound()'), true)

  const { generateMetadata: productGenerateMetadata, buildProductMetadata } = await import(
    '../app/(shop)/products/[handle]/generate-metadata'
  )
  const { generateMetadata: collectionGenerateMetadata, buildCollectionMetadata } = await import(
    '../app/(shop)/collections/[collection]/generate-metadata'
  )

  const failureEvidence: Array<{ kind: string; handle: string; scenario: string; outcome: string }> = []

  // 1) Unset MONGODB_URI → connectDb throws through the real readers.
  await withClearedMongoUri(async () => {
    for (const handle of PRODUCT_HANDLES) {
      await expectThrows(`product/uri:${handle}`, () =>
        productGenerateMetadata({ params: Promise.resolve({ handle }) })
      )
      failureEvidence.push({
        kind: 'product',
        handle,
        scenario: 'MONGODB_URI unset',
        outcome: 'threw (no title/description/canonical emitted)',
      })
    }
    for (const handle of COLLECTION_HANDLES) {
      await expectThrows(`collection/uri:${handle}`, () =>
        collectionGenerateMetadata({ params: Promise.resolve({ collection: handle }) })
      )
      failureEvidence.push({
        kind: 'collection',
        handle,
        scenario: 'MONGODB_URI unset',
        outcome: 'threw (no title/description/canonical emitted)',
      })
    }
  })

  // 2) Reader returns null → notFound (404), never a title-only head.
  for (const handle of PRODUCT_HANDLES) {
    const outcome = await expectThrows(
      `product/null:${handle}`,
      () => buildProductMetadata(handle, async () => null),
      { preferNotFound: true }
    )
    failureEvidence.push({ kind: 'product', handle, scenario: 'reader returns null', outcome })
  }
  for (const handle of COLLECTION_HANDLES) {
    // all-items may still resolve without a DB document (hardcoded meta).
    if (handle === 'all-items') continue
    const outcome = await expectThrows(
      `collection/null:${handle}`,
      () => buildCollectionMetadata(handle, async () => null),
      { preferNotFound: true }
    )
    failureEvidence.push({ kind: 'collection', handle, scenario: 'reader returns null', outcome })
  }

  // 3) Reader rejects → throw so ISR keeps the last good page.
  const dbBoom = async () => {
    throw new Error('simulated catalogue DB failure')
  }
  for (const handle of PRODUCT_HANDLES) {
    await expectThrows(`product/reject:${handle}`, () => buildProductMetadata(handle, dbBoom))
    failureEvidence.push({
      kind: 'product',
      handle,
      scenario: 'reader rejects',
      outcome: 'threw (no title/description/canonical emitted)',
    })
  }
  for (const handle of COLLECTION_HANDLES) {
    await expectThrows(`collection/reject:${handle}`, () => buildCollectionMetadata(handle, dbBoom))
    failureEvidence.push({
      kind: 'collection',
      handle,
      scenario: 'reader rejects',
      outcome: 'threw (no title/description/canonical emitted)',
    })
  }

  // Short CMS description falls back rather than taking the page down.
  const shortCmsProduct = {
    handle: 'standard-cupcake-box-3',
    title: 'Standard Cupcake Box',
    productCategory: 'Cupcake Boxes',
    tags: ['cupcakes'],
    bodyHtml: '<p>Hand-frosted standard cupcakes baked to order for Melbourne delivery on weekdays.</p>',
    variants: [{ price: 5, inventoryQty: 50 }],
    images: [{ src: 'https://example.com/cupcake.jpg', altText: 'Standard cupcake' }],
    seo: { description: 'Short CMS', robots: { index: true, follow: true } },
  }
  const shortMeta = await buildProductMetadata('standard-cupcake-box-3', async () => shortCmsProduct)
  const shortHead = snapshotHead(shortMeta)
  assert.equal(metadataLooksDegraded(shortHead), false)
  assert.ok(shortHead.description.length >= 40, 'short CMS description must fall back to generated copy')
  assert.equal(shortHead.canonical, '/products/standard-cupcake-box-3')

  console.log(JSON.stringify({ dbFailureEvidence: failureEvidence }, null, 2))
  console.log(
    `OK isr-metadata-fail-closed: URI-unset + null + reject covered for products/collections; short CMS description does not 500`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error)
  process.exit(1)
})
