import { legacyRedirect } from '@/lib/legacy-redirect-route'

// Old WordPress/WooCommerce URLs under /product-category/* → closest current page (301).
export const GET = legacyRedirect('product-category')
