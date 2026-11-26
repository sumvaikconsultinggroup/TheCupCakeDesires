import JsonLd from '@/components/SE0/JsonLd'
import { ABOUT_US_QA } from '@/data/about-us-qa'
import { generateFAQSchema, siteConfig } from '@/lib/seo'

/**
 * AboutPage JSON-LD for /about-us. mainEntity points at the sitewide
 * Organization @id (src/lib/jsonLd.ts) so we do not emit a second Organization.
 * FAQPage uses the same lead Q&A strings as the visible QuickAnswers block.
 *
 * Field sources (live brand facts only):
 * - name / url: about-us layout title + siteConfig.url; Organization name/url in src/lib/jsonLd.ts
 * - mainEntity @id: src/lib/jsonLd.ts globalJsonLdItems Organization @id (`/#organization`)
 */
export default function AboutUsJsonLd() {
  const aboutPage = {
    '@type': 'AboutPage',
    '@id': `${siteConfig.url}/about-us#webpage`,
    url: `${siteConfig.url}/about-us`,
    name: 'About Us | The Cupcake Desire',
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    mainEntity: { '@id': `${siteConfig.url}/#organization` },
  }

  const faqPage = generateFAQSchema(ABOUT_US_QA)

  return <JsonLd data={[aboutPage, faqPage]} />
}
