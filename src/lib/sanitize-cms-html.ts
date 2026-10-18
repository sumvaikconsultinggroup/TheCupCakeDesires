import 'server-only'

import render from 'dom-serializer'
import { findAll, getAttributeValue, getElementsByTagName, textContent } from 'domutils'
import { parseDocument } from 'htmlparser2'
import sanitizeHtml from 'sanitize-html'

type DomElement = {
  type: string
  name?: string
  attribs?: Record<string, string>
  parent?: DomElement | null
  children?: DomElement[]
}

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'div',
  'span',
  'hr',
  'nav',
  'section',
  'figure',
  'figcaption',
  'mark',
  'sub',
  'sup',
]

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'title',
  'class',
  'style',
  'id',
  'width',
  'height',
  'aria-label',
]

/** Match SafeHTML labelImages(): keep alt, else figcaption, else page title (+ index). */
function labelImages(html: string, imageAlt: string): string {
  const doc = parseDocument(html)
  const imgs = findAll(
    (node) => (node as DomElement).type === 'tag' && (node as DomElement).name === 'img',
    doc.children
  ) as unknown as DomElement[]

  const unlabelled = imgs.filter((img) => !getAttributeValue(img as any, 'alt')?.trim())
  let n = 0

  for (const img of imgs) {
    let alt = getAttributeValue(img as any, 'alt')?.trim() || ''
    if (!alt) {
      let caption = ''
      let parent = img.parent as DomElement | null | undefined
      while (parent) {
        if (parent.type === 'tag' && parent.name === 'figure') {
          const figcaptions = getElementsByTagName('figcaption', parent as any, true)
          if (figcaptions[0]) {
            caption = textContent(figcaptions[0]).trim()
          }
          break
        }
        parent = parent.parent
      }
      n++
      alt = caption || (unlabelled.length > 1 ? `${imageAlt} — image ${n}` : imageAlt)
      img.attribs = img.attribs || {}
      img.attribs.alt = alt
    }
    if (!getAttributeValue(img as any, 'title')?.trim()) {
      img.attribs = img.attribs || {}
      img.attribs.title = alt
    }
  }

  return render(doc as any)
}

/**
 * Server-side CMS HTML sanitiser (parity with the former client SafeHTML/DOMPurify path).
 * Never throws; returns '' for empty/invalid input or on error.
 */
export function sanitizeCmsHtml(html: string, imageAlt = 'The Cupcake Desire'): string {
  if (!html || typeof html !== 'string') return ''

  try {
    const clean = sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: {
        '*': ALLOWED_ATTR,
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
      allowProtocolRelative: true,
      // Relative URLs (no scheme) are allowed by default.
    })

    return labelImages(clean, imageAlt || 'The Cupcake Desire')
  } catch (error) {
    console.error('[sanitizeCmsHtml] failed', error)
    return ''
  }
}
