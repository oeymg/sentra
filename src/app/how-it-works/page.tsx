'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeft, MessageSquare, Star, TrendingUp } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const trendData = [
  { month: 'Jun', reviews: 38 },
  { month: 'Jul', reviews: 42 },
  { month: 'Aug', reviews: 55 },
  { month: 'Sep', reviews: 61 },
  { month: 'Oct', reviews: 78 },
  { month: 'Nov', reviews: 96 },
]

const sentimentData = [
  { name: 'Positive', value: 72, color: '#16a34a' },
  { name: 'Neutral', value: 18, color: '#facc15' },
  { name: 'Negative', value: 10, color: '#dc2626' },
]

const recentReviews = [
  {
    id: '1',
    platform: 'Google',
    rating: 5,
    text: 'Team went above and beyond to keep us in the loop. We love our new build!',
    time: '2 hours ago',
  },
  {
    id: '2',
    platform: 'Facebook',
    rating: 4,
    text: 'Great result overall, would have loved faster handover but communication was solid.',
    time: '1 day ago',
  },
  {
    id: '3',
    platform: 'Google',
    rating: 5,
    text: 'Process felt effortless. Highly recommend!',
    time: '3 days ago',
  },
]

const quickStats = [
  { label: 'Connected Platforms', value: '5', helper: 'Google, Yelp, Facebook, Trustpilot, Tripadvisor', icon: MessageSquare },
  { label: 'Average Rating', value: '4.8', helper: 'Last 90 days', icon: Star },
  { label: 'AI Responses', value: '132', helper: 'Personalized replies sent', icon: TrendingUp },
  { label: 'Time Saved', value: '21h', helper: 'Weekly average', icon: ArrowRight },
]

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-white relative">
      <Header />

      {/* Hero */}
      <section className="pt-40 pb-32 px-6 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 animate-gridMove" style={{
            backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-60 transition-opacity animate-fadeIn">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-[5rem] md:text-[8rem] leading-[0.85] font-light mb-10 tracking-tighter text-black animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            How it
            <br />
            <span className="italic font-normal">works.</span>
          </h1>
          <p className="text-2xl text-black mb-16 max-w-2xl font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            From chaos to clarity in three steps.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto space-y-32">
          {/* Step 1 */}
          <div className="group">
            <div className="text-8xl font-light text-black mb-8 transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">01</div>
            <h2 className="text-5xl font-light mb-8 text-black group-hover:translate-x-2 transition-transform duration-300">Connect your platforms</h2>
            <p className="text-2xl text-black max-w-3xl font-light leading-relaxed mb-12">
              Link your Google Business, Yelp, Trustpilot, Facebook, TripAdvisor, and 15+ other review platforms.
              One-click OAuth—no manual data entry, no API keys to manage.
            </p>
            <div className="bg-gray-50 p-12 space-y-4">
              <div className="text-sm uppercase tracking-widest text-black mb-6">Supported Platforms</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-black font-light">
                <div>Google Business</div>
                <div>Yelp</div>
                <div>Trustpilot</div>
                <div>Facebook</div>
                <div>TripAdvisor</div>
                <div>G2</div>
                <div>Capterra</div>
                <div>Product Hunt</div>
                <div>Amazon</div>
                <div>App Store</div>
                <div>Google Play</div>
                <div>Zillow</div>
                <div>OpenTable</div>
                <div>Booking.com</div>
                <div>Airbnb</div>
                <div>+ 5 more</div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group">
            <div className="text-8xl font-light text-black mb-8 transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">02</div>
            <h2 className="text-5xl font-light mb-8 text-black group-hover:translate-x-2 transition-transform duration-300">AI analyzes everything</h2>
            <p className="text-2xl text-black max-w-3xl font-light leading-relaxed mb-12">
              Claude reads every review, extracts sentiment, identifies trends, and flags issues that need your attention.
              No spreadsheets, no manual sorting—just instant insights.
            </p>
            <div className="bg-black text-white p-12 space-y-6">
              <div className="text-sm uppercase tracking-widest mb-6">What you get</div>
              <div className="space-y-4 font-light text-xl">
                <div>→ Sentiment analysis (positive, negative, neutral)</div>
                <div>→ Keyword extraction and trending topics</div>
                <div>→ Priority flagging for urgent responses</div>
                <div>→ Customer satisfaction scores over time</div>
                <div>→ Competitor comparison insights</div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group">
            <div className="text-8xl font-light text-black mb-8 transition-all duration-500 group-hover:scale-110 group-hover:text-gray-400">03</div>
            <h2 className="text-5xl font-light mb-8 text-black group-hover:translate-x-2 transition-transform duration-300">Respond in seconds</h2>
            <p className="text-2xl text-black max-w-3xl font-light leading-relaxed mb-12">
              AI drafts personalized responses in your brand voice. Choose your tone—professional, friendly, apologetic—
              edit if needed, and publish directly to the platform. All without leaving Sentra.
            </p>
            <div className="border border-black p-12 space-y-8">
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-widest text-black">Example: 5-star review</div>
                <div className="text-xl font-light text-black italic">
                  "Great service, fast delivery, love the product!"
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-widest text-black">AI-generated response (Professional)</div>
                <div className="text-xl font-light text-black">
                  "Thank you so much for your kind words! We're thrilled to hear you're enjoying the product.
                  Your feedback means the world to our team."
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-widest text-black">AI-generated response (Friendly)</div>
                <div className="text-xl font-light text-black">
                  "You just made our day! 🎉 So happy you're loving it. Thanks for taking the time to share!"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Dashboard Section */}
      <section className="py-32 px-6 border-t border-black">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.4em] text-black mb-3">Product preview</p>
            <h2 className="text-5xl font-light text-black mb-4">See the dashboard in action</h2>
            <p className="text-xl font-light text-black max-w-3xl">
              This live preview shows exactly what Sentra looks like once you connect your review platforms.
              Every metric and chart below mirrors the real dashboard your team will use.
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="border border-black/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{stat.label}</p>
                    <span className="p-2 rounded-full bg-black text-white">
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-4xl font-light text-black">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{stat.helper}</p>
                </div>
              )
            })}
          </div>

          {/* Chart + sentiment */}
          <div className="grid lg:grid-cols-[2fr,1fr] gap-6 mb-12">
            <div className="border border-black rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Review volume</p>
                  <p className="text-2xl font-light text-black">Last 6 months</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 uppercase tracking-widest">
                  +28% vs previous period
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                    <defs>
                      <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#000" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e4e4e7' }} />
                    <Area type="monotone" dataKey="reviews" stroke="#000" strokeWidth={2} fill="url(#trend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-black rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-4">Sentiment mix</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                      {sentimentData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6 w-full text-center text-sm">
                {sentimentData.map((slice) => (
                  <div key={slice.name}>
                    <p className="text-xs uppercase tracking-widest text-gray-500">{slice.name}</p>
                    <p className="text-lg font-light text-black">{slice.value}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sample reviews */}
          <div className="border border-black rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Live feed</p>
                <p className="text-2xl font-light text-black">Recent reviews</p>
              </div>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 text-sm text-black hover:underline">
                Respond with AI
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-black">{review.platform}</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{review.time}</span>
                    <button className="inline-flex items-center gap-2 text-black text-xs uppercase tracking-widest">
                      Reply with AI <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 border-t border-black relative">
        <div className="max-w-5xl mx-auto relative group/cta">
          <div className="absolute -inset-4 bg-black/5 rounded-3xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500 blur-xl" />

          <div className="relative">
            <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
              Ready to try it?
            </h2>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 text-base px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group relative overflow-hidden"
            >
              <span className="relative z-10">Start free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
