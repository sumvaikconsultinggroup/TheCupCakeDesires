/** Display-only: strip em/en dashes (and &mdash;/&ndash;) from attrs / titles (CMS may contain them). */
export function attrTextWithoutDashes(text: string): string {
  return text
    .replace(/\s*(?:&mdash;|&ndash;)\s*/gi, ', ')
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/ {2,}/g, ' ')
    .trim()
}
