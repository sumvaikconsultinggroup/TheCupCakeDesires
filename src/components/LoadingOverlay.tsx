export default function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-white/40 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div
        className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-rose-accent)] border-t-transparent"
        aria-hidden
      />
    </div>
  )
}
