// Admin-only route loading state. The storefront deliberately has no root
// loading.tsx: a root Suspense boundary made every response commit HTTP 200
// before notFound()/redirect() ran, so missing products and blog posts were
// served as soft 404s. The shop shows RouteLoadingOverlay on navigation instead.
import LoadingOverlay from '@/components/LoadingOverlay'

export default function Loading() {
  return <LoadingOverlay />
}
