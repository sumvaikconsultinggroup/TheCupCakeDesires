import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import JsonLd from '@/components/SE0/JsonLd'
import connectDb from '@/lib/mongodb'
import { generateArticleSchema, generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import BlogPost from '@/models/BlogPost'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BakeBlogPost from './BakeBlogPost'

// Use ISR instead of force-dynamic so pages are pre-rendered and revalidated
export const revalidate = 3600 // Revalidate every hour

interface PageProps {
  params: Promise<{ handle: string }>
}

// Pre-render published posts when DB is reachable; never fail the Vercel build
// if Atlas TLS/network flakes during `next build`.
export async function generateStaticParams() {
  try {
    await connectDb()
    const posts = await BlogPost.find({ status: 'published' }).select('slug').lean()
    return posts.map((post: any) => ({ handle: post.slug }))
  } catch (error) {
    console.error('[blogs/[handle]] generateStaticParams skipped:', error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  try {
    await connectDb()
    const post = (await BlogPost.findOne({ slug: handle, status: 'published' }).lean()) as any

    if (!post) {
      return { title: 'Post Not Found' }
    }

    const title = post.seo?.metaTitle || post.title
    const description = post.seo?.metaDescription || post.excerpt || post.content?.slice(0, 160)
    const image = post.featuredImage?.url || `${siteConfig.url}/og-image.jpg`

    // Get robots settings from post or use defaults
    const robotsConfig = post.seo?.robots || { index: true, follow: true }

    // Build robots meta tag
    const robotsArray: string[] = []
    if (robotsConfig.index === false) robotsArray.push('noindex')
    if (robotsConfig.follow === false) robotsArray.push('nofollow')
    if (robotsConfig.noarchive) robotsArray.push('noarchive')
    if (robotsConfig.nosnippet) robotsArray.push('nosnippet')
    if (robotsConfig.noimageindex) robotsArray.push('noimageindex')

    // Default to index,follow if no restrictions
    const robotsValue = robotsArray.length > 0 ? robotsArray.join(', ') : 'index, follow'

    // Get canonical URL
    const canonicalUrl = post.seo?.canonicalUrl || `/blogs/${handle}`

    return {
      title: title,
      description: description,
      keywords: post.tags || [],
      authors: [{ name: post.author || 'The Cupcake Desire' }],
      robots: {
        index: robotsConfig.index !== false,
        follow: robotsConfig.follow !== false,
        noarchive: robotsConfig.noarchive || false,
        nosnippet: robotsConfig.nosnippet || false,
        noimageindex: robotsConfig.noimageindex || false,
        googleBot: {
          index: robotsConfig.index !== false,
          follow: robotsConfig.follow !== false,
          noarchive: robotsConfig.noarchive || false,
          nosnippet: robotsConfig.nosnippet || false,
          noimageindex: robotsConfig.noimageindex || false,
        },
      },
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'article',
        title: title,
        description: description,
        url: `${siteConfig.url}/blogs/${handle}`,
        siteName: 'The Cupcake Desire',
        images: [{ url: image, width: 1200, height: 630, alt: post.title }],
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt?.toISOString(),
        authors: [post.author || 'The Cupcake Desire'],
        section: post.category || 'Bakery',
        tags: post.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [image],
      },
      other: {
        // Add as fallback for additional control
        robots: robotsValue,
      },
    }
  } catch (error) {
    console.error('[blogs/[handle]] generateMetadata failed:', error)
    return { title: 'Stories from the Kitchen | The Cupcake Desire' }
  }
}

async function getBlogPost(slug: string) {
  try {
    await connectDb()

    // Increment view count and get post
    const post = (await BlogPost.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean()) as any

    if (!post) return null

    // Get related posts
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }],
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title slug excerpt featuredImage readingTime publishedAt author')
      .lean()

    return {
      post: JSON.parse(JSON.stringify({ ...post, _id: post._id.toString() })),
      related: JSON.parse(
        JSON.stringify(relatedPosts.map((r: any) => ({ ...r, _id: r._id.toString() })))
      ),
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { handle } = await params
  const data = await getBlogPost(handle)

  if (!data) {
    notFound()
  }

  const post = data.post

  // Generate Article Schema
  const articleSchema = generateArticleSchema({
    title: post.title,
    handle: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    image: post.featuredImage?.url,
    author: post.author,
    publishedAt: post.publishedAt?.toISOString?.() || post.publishedAt,
    updatedAt: post.updatedAt?.toISOString?.() || post.updatedAt,
  })

  // Generate Breadcrumb Schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blogs` },
    { name: post.title, url: `${siteConfig.url}/blogs/${handle}` },
  ])

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      <Header />
      <BakeBlogPost post={post as any} related={data.related as any} />
      <Footer />

      {/* ASIDES */}
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}
