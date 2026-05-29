'use client'

import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'

interface SafeHTMLProps {
  html: string
  className?: string
}

export default function SafeHTML({ html, className = '' }: SafeHTMLProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && html) {
      // Configure DOMPurify to allow safe HTML elements
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'hr',
          'mark', 'sub', 'sup',
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'src', 'alt', 'title',
          'class', 'style', 'id', 'width', 'height',
        ],
        ALLOW_DATA_ATTR: false, // Remove data-* attributes (like data-start, data-end)
      })
      setSanitizedHtml(clean)
    }
  }, [html])

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
