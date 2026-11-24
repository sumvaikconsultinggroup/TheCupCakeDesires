import assert from 'node:assert/strict'
import { attrTextWithoutDashes } from './attr-text'

assert.equal(attrTextWithoutDashes('3–5 days'), '3 to 5 days')
assert.equal(attrTextWithoutDashes('3\u20135 days'), '3 to 5 days')
assert.equal(attrTextWithoutDashes('2&ndash;3 days'), '2 to 3 days')
assert.equal(attrTextWithoutDashes('Small batch — baked to order'), 'Small batch, baked to order')
assert.equal(attrTextWithoutDashes('Cakes – 3 days notice'), 'Cakes, 3 days notice')

console.log('attr-text.test.ts: all assertions passed')
