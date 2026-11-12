import assert from 'node:assert/strict'
import { exploreLinks } from '@/lib/product-copy'
import { categoryHref } from '@/lib/category-href'

assert.equal(categoryHref('Cupcakes'), '/collections/all-cupcakes')
assert.equal(categoryHref('Cupcake Boxes'), '/collections/all-cupcakes')
assert.equal(categoryHref('Standard Cupcakes'), '/collections/standard-cupcakes')
assert.equal(categoryHref('Corporate'), '/corporate')
assert.equal(categoryHref('Totally Unknown'), '/collections/all-items')

const mix = exploreLinks({ handle: 'mix-box-of-12', title: 'Mix Box of 12', productCategory: 'Cupcakes' })
assert.equal(mix[0].href, '/collections/all-cupcakes')
assert.ok(!mix.some((l) => l.href === '/collections/cupcakes'))

console.log('category-href + exploreLinks ok')
