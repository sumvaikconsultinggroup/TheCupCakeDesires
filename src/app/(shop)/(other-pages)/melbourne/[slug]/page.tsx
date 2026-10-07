import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { getMelbournePage, MELBOURNE_PAGES, melbournePath } from '@/data/melbourne-pages'
import { loadProductsByHandles } from '@/lib/collection-products'
import { phrasesFor } from '@/lib/keyword-phrases'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return MELBOURNE_PAGES.map((page) => ({ slug: page.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getMelbournePage((await params).slug)
  if (!page) return {}
  const path = melbournePath(page.slug)
  return {
    title: `${page.title} | The Cupcake Desire`,
    description: page.description,
    alternates: { canonical: path },
    openGraph: {
      title: page.title,
      description: page.description,
      url: path,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default async function MelbourneKeywordPage({ params }: Props) {
  const page = getMelbournePage((await params).slug)
  if (!page) notFound()

  const products = await loadProductsByHandles(page.productHandles)
  const path = melbournePath(page.slug)
  const phrases = phrasesFor(path)
  const sections = phrases.length
    ? [
        ...page.sections,
        {
          heading: 'Other ways people search for this',
          body: [
            `${phrases.join('; ')}. Each of those is the same order: a bake from our Narre Warren kitchen, delivered on a weekday if your suburb is on the list.`,
          ],
        },
      ]
    : page.sections

  return (
    <IntentLandingPage
      path={path}
      parent={{ name: 'Melbourne guides', path: '/melbourne' }}
      breadcrumb={page.breadcrumb}
      eyebrow={page.eyebrow}
      heading={page.heading}
      intro={page.intro}
      products={products as never[]}
      productsHeading={page.productsHeading}
      sections={sections}
      faqs={page.faqs}
      faqHeading={`${page.breadcrumb}: quick answers`}
      links={page.links}
      linksHeading="Keep going"
    />
  )
}
