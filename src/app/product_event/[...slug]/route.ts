import { legacyRedirect } from '@/lib/legacy-redirect-route'

// Old WordPress URLs under /product_event/* → matching occasion collection (301).
export const GET = legacyRedirect('product_event')
