/**
 * Prove product and collection generateMetadata cannot emit a degraded head
 * when the DB fails. Run with: pnpm test:isr-metadata
 *
 * No real database: MONGODB_URI is cleared so connectDb throws.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Metadata } from 'next'
import {
  assertCompleteStorefrontMetadata,
  isDegradedStorefrontTitle,
  metadataLooksDegraded,
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

async function expectMetadataRejectsOnDbFailure(
  label: string,
  run: () => Promise<Metadata>
): Promise<void> {
  let resolved: Metadata | undefined
  let threw = false
  try {
    resolved = await run()
  } catch {
    threw = true
  }

  assert.equal(
    threw,
    true,
    `${label}: expected generateMetadata to throw on DB failure so ISR keeps the last good page`
  )
  assert.equal(
    resolved,
    undefined,
    `${label}: must not resolve metadata when DB fails (got ${JSON.stringify(resolved && snapshotHead(resolved))})`
  )
  if (resolved !== undefined) {
    assert.equal(metadataLooksDegraded(resolved), true, `${label}: resolved head looks publishable`)
  }
}

async function main() {
  assert.equal(isDegradedStorefrontTitle('The Cupcake Desire'), true)
  assert.equal(isDegradedStorefrontTitle('Product Not Found'), true)
  assert.equal(isDegradedStorefrontTitle('Birthday Cupcakes | The Cupcake Desire'), false)

  assert.throws(() =>
    assertCompleteStorefrontMetadata(
      { title: 'The Cupcake Desire', description: '', canonical: '' },
      'unit'
    )
  )
  assert.throws(() =>
    assertCompleteStorefrontMetadata(
      {
        title: 'Standard Cupcake Box | The Cupcake Desire',
        description: 'short',
        canonical: '/products/standard-cupcake-box-3',
      },
      'unit'
    )
  )
  assert.doesNotThrow(() =>
    assertCompleteStorefrontMetadata(
      {
        title: 'Standard Cupcake Box | The Cupcake Desire',
        description:
          'Hand-frosted standard cupcakes baked to order in Narre Warren and delivered across Melbourne Metro.',
        canonical: '/products/standard-cupcake-box-3',
      },
      'unit'
    )
  )

  const productMetaSrc = read('src/app/(shop)/products/[handle]/generate-metadata.ts')
  const collectionMetaSrc = read('src/app/(shop)/collections/[collection]/generate-metadata.ts')
  const productPage = read('src/app/(shop)/products/[handle]/page.tsx')
  const collectionPage = read('src/app/(shop)/collections/[collection]/page.tsx')

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

  const { generateMetadata: productGenerateMetadata } = await import(
    '../app/(shop)/products/[handle]/generate-metadata'
  )
  const { generateMetadata: collectionGenerateMetadata } = await import(
    '../app/(shop)/collections/[collection]/generate-metadata'
  )

  const failureEvidence: Array<{ kind: string; handle: string; outcome: string }> = []

  await withClearedMongoUri(async () => {
    for (const handle of PRODUCT_HANDLES) {
      await expectMetadataRejectsOnDbFailure(`product:${handle}`, () =>
        productGenerateMetadata({ params: Promise.resolve({ handle }) })
      )
      failureEvidence.push({ kind: 'product', handle, outcome: 'threw (no title/description/canonical emitted)' })
    }
    for (const handle of COLLECTION_HANDLES) {
      await expectMetadataRejectsOnDbFailure(`collection:${handle}`, () =>
        collectionGenerateMetadata({ params: Promise.resolve({ collection: handle }) })
      )
      failureEvidence.push({
        kind: 'collection',
        handle,
        outcome: 'threw (no title/description/canonical emitted)',
      })
    }
  })

  console.log(JSON.stringify({ dbFailureEvidence: failureEvidence }, null, 2))
  console.log(
    `OK isr-metadata-fail-closed: ${PRODUCT_HANDLES.length} products + ${COLLECTION_HANDLES.length} collections reject on DB failure with no degraded head emitted`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error)
  process.exit(1)
})
