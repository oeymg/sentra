import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getAllBlogPosts, getAllCategories } from '@/lib/blog'
import { generateSEO, blogSEO } from '@/lib/seo'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = generateSEO({
  title: blogSEO.title,
  description: blogSEO.description,
  path: '/blog',
})

export default function BlogPage() {
  const posts = getAllBlogPosts()
  const categories = getAllCategories()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <h1 className="text-6xl font-light mb-6 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                Blog
              </h1>
              <p className="text-xl text-gray-600 font-light leading-relaxed">
                Insights, tips, and best practises for managing your online reputation and customer reviews.
              </p>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/blog"
                className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                All Posts
              </Link>
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Featured Image */}
                    <div className="relative h-48 overflow-hidden border-b border-gray-200">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-900 rounded-full border border-gray-200">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString('en-AU', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                        {post.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Read More */}
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:gap-3 transition-all">
                        <span>Read article</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Empty State (if no posts) */}
            {posts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500">No blog posts yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
              Ready to transform your review management?
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-light">
              Join businesses using Sentra to centralise, analyse, and respond to reviews with AI.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
