import { revalidatePath } from 'next/cache'

/** Bust ISR caches for sitemap, blog index, and any affected post slugs. */
export function revalidateBlog(slugs: Array<string | undefined | null>) {
  try {
    revalidatePath('/sitemap.xml')
    revalidatePath('/blogs')
    for (const s of new Set(slugs.filter(Boolean) as string[])) {
      revalidatePath(`/blogs/${s}`)
    }
  } catch (e) {
    console.error('[revalidateBlog] failed', e)
  }
}
