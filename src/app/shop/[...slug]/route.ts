import { legacyRedirect } from '@/lib/legacy-redirect-route'

// Old WordPress/WooCommerce URLs under /shop/* → closest current page (301).
export const GET = legacyRedirect('shop')
