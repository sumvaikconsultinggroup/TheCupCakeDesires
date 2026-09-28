const BRAND = 'The Cupcake Desire'

/** Append the brand to a page title unless it already mentions it. */
export function withBrand(title: string) {
  return /cupcake desire/i.test(title) ? title : `${title} | ${BRAND}`
}
