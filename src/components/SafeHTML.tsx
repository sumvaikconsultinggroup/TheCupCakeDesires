'use client'

import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

interface SafeHTMLProps {
  html: string
  className?: string
  /** Describes the page (post or product title) — used for any image in the HTML that has no alt text. */
  imageAlt?: string
}

/** Every image needs alt + title: keep the author's, else use its figure caption, else the page name. */
function labelImages(root: HTMLElement, fallback: string) {
  const unlabelled = Array.from(root.querySelectorAll('img')).filter((img) => !img.getAttribute('alt')?.trim())
  let n = 0
  for (const img of Array.from(root.querySelectorAll('img'))) {
    let alt = img.getAttribute('alt')?.trim() || ''
    if (!alt) {
      const caption = img.closest('figure')?.querySelector('figcaption')?.textContent?.trim()
      n++
      alt = caption || (unlabelled.length > 1 ? `${fallback} — image ${n}` : fallback)
      img.setAttribute('alt', alt)
    }
    if (!img.getAttribute('title')?.trim()) img.setAttribute('title', alt)
  }
}

export default function SafeHTML({ html, className = '', imageAlt = 'The Cupcake Desire' }: SafeHTMLProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && html) {
      // Configure DOMPurify to allow safe HTML elements
      const clean = DOMPurify.sanitize(html, {
        RETURN_DOM: true,
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'hr', 'nav', 'section', 'figure', 'figcaption',
          'mark', 'sub', 'sup',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title',
          'class', 'style', 'id', 'width', 'height', 'aria-label',
        ],
        ALLOW_DATA_ATTR: false, // Remove data-* attributes (like data-start, data-end)
      })
      const body = clean as HTMLElement
      labelImages(body, imageAlt)
      setSanitizedHtml(body.innerHTML)
    }
  }, [html, imageAlt])

  if (!sanitizedHtml) {
    return null
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  )
}
