import { legacyShopRoot } from '@/lib/legacy-redirect-route'

// Old WooCommerce /shop (and /shop?product_cat=…&filter_flavour=…) → closest page (301).
export const GET = legacyShopRoot
