import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import JsonLd from '@/components/SE0/JsonLd'
import connectDb from '@/lib/mongodb'
import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import BlogCategory from '@/models/BlogCategory'
import BlogPost from '@/models/BlogPost'
import { Metadata } from 'next'
import BakeBlogList from './BakeBlogList'

// Use ISR - revalidate every 60 seconds for fresh blog content
// Removed force-dynamic as it conflicts with revalidate and prevents caching
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Stories from the Kitchen | CupCake Desires',
    description:
      'Notes from our bakery — flavor experiments, ingredient sourcing, customer stories, and the small joys of running a cupcake shop.',
    keywords: [
      'cupcake blog',
      'bakery stories',
      'flavor notes',
      'baking tips',
      'cupcake recipes',
      'bakery behind the scenes',
      'gift box ideas',
      'dessert blog',
      'eggless baking',
      'vegan baking',
    ],
    alternates: {
      canonical: '/blog',
    },
    openGraph: {
      type: 'website',
      title: 'Stories from the Kitchen | CupCake Desires',
      description: 'Notes from our bakery — flavor experiments, customer stories, the small joys.',
      url: `${siteConfig.url}/blog`,
      siteName: 'CupCake Desires',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Stories from the Kitchen | CupCake Desires',
      description: 'Notes from our bakery — flavor experiments, customer stories, the small joys.',
    },
  }
  
  return await applyPageSEOMetadata('blog', baseMetadata)
}

async function getBlogData() {
  try {
    await connectDb()

    const now = new Date()

    const [posts, categories, featuredPosts] = await Promise.all([
      BlogPost.find({
        status: 'published',
        $or: [{ publishedAt: { $lte: now } }, { publishedAt: { $exists: false } }],
      })
        .sort({ publishedAt: -1 })
        .limit(12)
        .select('title slug excerpt featuredImage author category tags publishedAt readingTime viewCount')
        .lean(),
      BlogCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
      BlogPost.find({
        status: 'published',
        isFeatured: true,
        $or: [{ publishedAt: { $lte: now } }, { publishedAt: { $exists: false } }],
      })
        .sort({ publishedAt: -1 })
        .limit(3)
        .select('title slug excerpt featuredImage author category publishedAt readingTime')
        .lean(),
    ])

    return {
      posts: posts.map((p: any) => ({ ...p, _id: p._id.toString() })),
      categories: categories.map((c: any) => ({ ...c, _id: c._id.toString() })),
      featuredPosts: featuredPosts.map((p: any) => ({ ...p, _id: p._id.toString() })),
    }
  } catch (error) {
    console.error('Error fetching blog data:', error)
    return { posts: [], categories: [], featuredPosts: [] }
  }
}

export default async function BlogPage() {
  const { posts, categories, featuredPosts } = await getBlogData()

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blog` },
  ])

  // Blog listing schema — merged into the global @graph script by <JsonLd />
  const blogListSchema = {
    '@type': 'Blog',
    '@id': `${siteConfig.url}/blog#blog`,
    name: 'CupCake Desires — Stories from the Kitchen',
    description:
      'Notes from our bakery — flavour experiments, recipe stories, gift-planning guides, and the small things we learn from running a tiny shop in Melbourne.',
    url: `${siteConfig.url}/blog`,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    publisher: { '@id': `${siteConfig.url}/#organization` },
    blogPost: posts.slice(0, 10).map((post: any) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `${siteConfig.url}/blog/${post.slug}`,
      datePublished: post.publishedAt,
      author: {
        '@type': 'Organization',
        name: 'CupCake Desires',
        logo: {
          '@type': 'ImageObject',
          url: `${siteConfig.url}/og-image.png`,
        },
      },
    })),
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, blogListSchema]} />
      <Header />
      <BakeBlogList
        initialPosts={posts as any}
        categories={categories as any}
        featuredPosts={featuredPosts as any}
      />
      <Footer />

      {/* ASIDES */}
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}
