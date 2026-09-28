import { legacyRedirect } from '@/lib/legacy-redirect-route'

// Old WordPress/WooCommerce URLs under /event/* → closest current page (301).
export const GET = legacyRedirect('event')
