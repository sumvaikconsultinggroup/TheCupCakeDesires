// The root layout already renders <html>/<body> (and the GTM/GA4 tags this page's
// purchase event depends on) — a nested <html> here caused invalid markup and
// hydration errors on the confirmation page.
export default function OrderSuccessfulLayout({ children }: { children: React.ReactNode }) {
  return children
}
