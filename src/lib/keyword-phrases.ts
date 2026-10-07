import { KEYWORD_TARGETS } from '@/data/keyword-targets'

const SKIP = /queen|wueens|cupckae|cupck|kek\b|\bcae\b|smashthecake|dollcake|kidscake|cupc logo/

/** A few real search phrases for a URL, for the visible “also searched” line. */
export function phrasesFor(path: string, limit = 8) {
  const phrases = Object.entries(KEYWORD_TARGETS)
    .filter(([, target]) => target === path)
    .map(([keyword]) => keyword)
    .filter((keyword) => {
      const words = keyword.split(/\s+/).filter(Boolean)
      if (words.length < 2 || words.length > 6) return false
      if (new Set(words).size !== words.length) return false
      if (SKIP.test(keyword)) return false
      return true
    })
    .sort((a, b) => a.length - b.length)

  return phrases.slice(0, limit)
}
