'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Clock, User, Calendar, Eye, Tag, ArrowLeft, 
  Share2, Facebook, Twitter, Linkedin, Copy, Check,
  BookOpen, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: { url: string; alt?: string; caption?: string }
  author: { name: string; avatar?: string; bio?: string }
  category?: string
  tags?: string[]
  publishedAt?: string
  readingTime?: number
  viewCount: number
}

interface RelatedPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: { url: string; alt?: string }
  readingTime?: number
  publishedAt?: string
  author: { name: string }
}

interface BlogPostClientProps {
  post: BlogPost
  relatedPosts: RelatedPost[]
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = post.title

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
    
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero */}
      <div className="relative">
        {post.featuredImage?.url ? (
          <div className="relative h-[40vh] min-h-[400px] w-full md:h-[50vh]">
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt || post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-[30vh] min-h-[300px] bg-gradient-to-br from-[#1B198F] to-blue-700" />
        )}
        
        {/* Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 pb-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-4xl"
            >
              {/* Breadcrumb */}
              <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
                <Link href="/blog" className="hover:text-white">Blog</Link>
                <ChevronRight className="h-4 w-4" />
                {post.category && (
                  <>
                    <Link href={`/blog?category=${post.category}`} className="hover:text-white capitalize">
                      {post.category}
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
                <span className="text-white/50 truncate">{post.title}</span>
              </div>
              
              {/* Category Badge */}
              {post.category && (
                <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
                  {post.category}
                </span>
              )}
              
              <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              
              {/* Meta */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  {post.author.avatar ? (
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <span className="font-medium text-white">{post.author.name}</span>
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {post.publishedAt 
                    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Recently'
                  }
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readingTime || 1} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount.toLocaleString()} views
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-[1fr,280px]">
            {/* Main Content */}
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Share */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky top-24 rounded-2xl bg-neutral-100 p-6 dark:bg-neutral-800"
              >
                <h4 className="mb-4 font-bold">Share this article</h4>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:scale-110"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-110"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white transition-transform hover:scale-110"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <button
                    onClick={copyLink}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform hover:scale-110 dark:bg-neutral-700"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="mb-3 font-bold">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${tag}`}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </aside>
          </div>
          
          {/* Author Bio */}
          {post.author.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-start gap-4 rounded-2xl bg-neutral-100 p-6 dark:bg-neutral-800"
            >
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1B198F]">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h4 className="font-bold">{post.author.name}</h4>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{post.author.bio}</p>
              </div>
            </motion.div>
          )}
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16"
            >
              <h3 className="mb-8 text-2xl font-bold">Related Articles</h3>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.map(related => (
                  <Link
                    key={related._id}
                    href={`/blog/${related.slug}`}
                    className="group block overflow-hidden rounded-2xl bg-neutral-100 transition-all hover:shadow-xl dark:bg-neutral-800"
                  >
                    <div className="relative aspect-video">
                      {related.featuredImage?.url ? (
                        <Image
                          src={related.featuredImage.url}
                          alt={related.featuredImage.alt || related.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                          <BookOpen className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold line-clamp-2 group-hover:text-[#1B198F]">{related.title}</h4>
                      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                        <span>{related.author.name}</span>
                        <span>•</span>
                        <span>{related.readingTime || 1} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
