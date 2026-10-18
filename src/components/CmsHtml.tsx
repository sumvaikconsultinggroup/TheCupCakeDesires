interface CmsHtmlProps {
  /** Already sanitised HTML from sanitizeCmsHtml (server). */
  html: string
  className?: string
}

/** Renders pre-sanitised CMS HTML into the initial SSR markup (no effect/state). */
export default function CmsHtml({ html, className = '' }: CmsHtmlProps) {
  if (!html) return null

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
