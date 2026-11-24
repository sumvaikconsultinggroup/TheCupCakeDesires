/** Display-only: strip em/en dashes (and &mdash;/&ndash;) from attrs / titles (CMS may contain them). */
export function attrTextWithoutDashes(text: string): string {
  return text
    // Numeric ranges: "3–5 days" / "3&ndash;5 days" → "3 to 5 days"
    .replace(/(\d)\s*(?:&mdash;|&ndash;|[\u2014\u2013])\s*(\d)/gi, '$1 to $2')
    .replace(/\s*(?:&mdash;|&ndash;)\s*/gi, ', ')
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/ {2,}/g, ' ')
    .trim()
}
