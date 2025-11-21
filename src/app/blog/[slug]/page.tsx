import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getBlogPost, getAllBlogPosts } from '@/lib/blog'
import { generateSEO } from '@/lib/seo'
import { Calendar, Clock, ArrowLeft, Share2, Twitter, Linkedin } from 'lucide-react'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return {}
  }

  return generateSEO({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    image: post.image,
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const allPosts = getAllBlogPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Back Link */}
        <div className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <article className="py-12">
          <div className="max-w-4xl mx-auto px-6">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl font-light mb-6 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {post.author.charAt(0)}
                </div>
                <span className="font-medium text-gray-900">{post.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(post.publishedAt).toLocaleDateString('en-AU', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative h-96 rounded-2xl border border-gray-200 mb-12 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div
                className="text-black leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const formatInlineMarkdown = (text: string) => {
                      return text
                        // Bold text
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-black">$1</strong>')
                        // Italic text
                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                        // Code blocks (inline)
                        .replace(/`(.*?)`/g, '<code class="px-2 py-1 bg-gray-100 text-gray-900 rounded text-sm font-mono">$1</code>')
                    }

                    const lines = post.content.split('\n')
                    const html: string[] = []
                    let inList = false

                    lines.forEach((line, idx) => {
                      const nextLine = lines[idx + 1]

                      if (line.startsWith('# ')) {
                        if (inList) { html.push('</ul>'); inList = false }
                        html.push(`<h1 class="text-4xl font-light mt-12 mb-6 text-black first:mt-0">${formatInlineMarkdown(line.slice(2))}</h1>`)
                      } else if (line.startsWith('## ')) {
                        if (inList) { html.push('</ul>'); inList = false }
                        html.push(`<h2 class="text-3xl font-light mt-10 mb-4 text-black">${formatInlineMarkdown(line.slice(3))}</h2>`)
                      } else if (line.startsWith('### ')) {
                        if (inList) { html.push('</ul>'); inList = false }
                        html.push(`<h3 class="text-2xl font-medium mt-8 mb-3 text-black">${formatInlineMarkdown(line.slice(4))}</h3>`)
                      } else if (line.startsWith('- ')) {
                        if (!inList) {
                          html.push('<ul class="list-disc list-inside space-y-2 mb-6 ml-4">')
                          inList = true
                        }
                        html.push(`<li class="text-black leading-relaxed">${formatInlineMarkdown(line.slice(2))}</li>`)
                      } else if (line.trim() === '') {
                        if (inList && nextLine && !nextLine.startsWith('- ')) {
                          html.push('</ul>')
                          inList = false
                        }
                      } else {
                        if (inList) { html.push('</ul>'); inList = false }
                        if (line.trim() !== '') {
                          html.push(`<p class="mb-4 text-black leading-relaxed">${formatInlineMarkdown(line)}</p>`)
                        }
                      }
                    })

                    if (inList) html.push('</ul>')
                    return html.join('')
                  })(),
                }}
              />
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share this article:
                </span>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Twitter className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Linkedin className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-3xl font-light mb-10 text-gray-900">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                      <div className="relative h-40 overflow-hidden border-b border-gray-200">
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-6 flex-1">
                        <span className="text-xs text-gray-500 mb-2 block">{relatedPost.category}</span>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.description}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Start managing reviews smarter
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-light">
              Join businesses using Sentra to centralize and respond to reviews with AI.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
