import map from '@/data/legacy-redirect-map.json'

export type LegacyShopQuery = {
  product_cat?: string
  filter_flavour?: string
  destination: string
}

const PATHS = map.paths as Record<string, string>
const SHOP_QUERIES = map.shopQueries as LegacyShopQuery[]

export function normalizeLegacyPath(pathname: string): string {
  const raw = String(pathname || '').split('?')[0]
  if (!raw || raw === '/') return '/'
  return raw.replace(/\/+$/, '').toLowerCase() || '/'
}

export function lookupLegacyPath(pathname: string): string | undefined {
  return PATHS[normalizeLegacyPath(pathname)]
}

export function lookupLegacyShopQuery(params: URLSearchParams): string | undefined {
  const flavour = (params.get('filter_flavour') || '').toLowerCase().trim()
  const cat = (params.get('product_cat') || '').toLowerCase().trim()
  for (const row of SHOP_QUERIES) {
    const rowFlavour = (row.filter_flavour || '').toLowerCase()
    const rowCat = (row.product_cat || '').toLowerCase()
    if (rowFlavour === flavour && rowCat === cat) return row.destination
  }
  return undefined
}

export function legacyRedirectPaths(): Record<string, string> {
  return PATHS
}

export function legacyShopQueries(): LegacyShopQuery[] {
  return SHOP_QUERIES
}
