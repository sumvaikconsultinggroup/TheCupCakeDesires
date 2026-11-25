/** Display-only: strip em/en dashes from image alt/title attrs (CMS titles may contain them). */
export function attrTextWithoutDashes(text: string): string {
  return text
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/ {2,}/g, ' ')
    .trim()
}
