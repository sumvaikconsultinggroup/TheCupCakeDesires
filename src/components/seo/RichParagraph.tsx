import Link from 'next/link'

/**
 * Renders a paragraph that may include markdown-style links: [label](/path).
 * Keeps seasonal SEO copy as plain strings while shipping real <a> tags in HTML.
 */
export default function RichParagraph({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <p className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!match) return <span key={i}>{part}</span>
        const [, label, href] = match
        const external = /^https?:\/\//i.test(href)
        if (external) {
          return (
            <a key={i} href={href} className="text-rose-accent underline-offset-2 hover:underline">
              {label}
            </a>
          )
        }
        return (
          <Link key={i} href={href} className="text-rose-accent underline-offset-2 hover:underline">
            {label}
          </Link>
        )
      })}
    </p>
  )
}
