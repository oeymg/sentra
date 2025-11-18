'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Star, TrendingUp, Sparkles, Zap, MessageSquare, BarChart3, Clock, CheckCircle2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'apologetic'>('professional')
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [statsInView, setStatsInView] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const [counters, setCounters] = useState({ platforms: 0, setup: 0, timeSaved: 0 })

  // Mock reviews for carousel
  const mockReviews = [
    { name: 'Sarah M.', rating: 5, text: 'Amazing service! Best experience ever.', platform: 'Google', sentiment: 'positive', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'John D.', rating: 2, text: 'Food was cold and service was slow.', platform: 'Yelp', sentiment: 'negative', avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Emma W.', rating: 4, text: 'Good quality, quick delivery!', platform: 'Trustpilot', sentiment: 'positive', avatar: 'https://i.pravatar.cc/150?img=47' },
    { name: 'Mike R.', rating: 1, text: 'Very disappointed with the product quality.', platform: 'Facebook', sentiment: 'negative', avatar: 'https://i.pravatar.cc/150?img=33' },
    { name: 'Lisa K.', rating: 5, text: 'Exceeded my expectations completely!', platform: 'Google', sentiment: 'positive', avatar: 'https://i.pravatar.cc/150?img=9' },
  ]

  // AI response examples
  const aiResponses = {
    professional: "Thank you for your feedback, Michael. We appreciate your positive remarks about our product quality. Regarding the delivery timeline, we're actively working on optimizing our shipping options and will be introducing expedited delivery choices soon.",
    friendly: "Hey Michael! Thanks so much for the kind words about the product - we're thrilled you love it! We totally hear you on the shipping speed. We're working on rolling out faster delivery options soon. Appreciate your patience!",
    apologetic: "We sincerely apologize for the delayed delivery, Michael. While we're glad the product met your expectations, the shipping timeline falls short of our standards. We're implementing faster shipping options and would love to offer you priority delivery on your next order."
  }

  // Mouse tracking for gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Review carousel auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % mockReviews.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [mockReviews.length])

  // Typing animation for AI response
  useEffect(() => {
    const fullText = aiResponses[selectedTone]
    setIsTyping(true)
    setDisplayedText('')

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(typingInterval)
      }
    }, 20)

    return () => clearInterval(typingInterval)
  }, [selectedTone])

  // Intersection Observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsInView) {
          setStatsInView(true)
        }
      },
      { threshold: 0.5 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [statsInView])

  // Animated counters
  useEffect(() => {
    if (statsInView) {
      const duration = 2000
      const steps = 60
      const interval = duration / steps

      let step = 0
      const counterInterval = setInterval(() => {
        step++
        const progress = step / steps

        setCounters({
          platforms: Math.floor(20 * progress),
          setup: Math.floor(2 * progress * 10) / 10,
          timeSaved: Math.floor(80 * progress)
        })

        if (step >= steps) {
          clearInterval(counterInterval)
          setCounters({ platforms: 20, setup: 2, timeSaved: 80 })
        }
      }, interval)

      return () => clearInterval(counterInterval)
    }
  }, [statsInView])

  const currentReview = mockReviews[currentReviewIndex]

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden">
      <Header />

      {/* Mouse-following gradient blob */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0.1), transparent 80%)`
        }}
      />

      {/* Hero Section with Interactive Elements */}
      <section className="pt-40 pb-32 px-6 relative">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 animate-gridMove" style={{
            backgroundImage: 'linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Hero Text */}
          <div>
            <h1 className="text-[4rem] md:text-[6rem] leading-[0.85] font-light mb-8 tracking-tighter text-black animate-fadeIn">
              Your reviews.
              <br />
              <span className="italic font-normal bg-gradient-to-r from-black via-gray-600 to-black bg-clip-text text-transparent animate-gradient">
                One place.
              </span>
            </h1>

            <p className="text-xl text-black mb-10 max-w-xl font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              Stop jumping between platforms. Sentra brings all your reviews together,
              analyzes them with AI, and helps you respond—instantly.
            </p>

            {/* Stat callout */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full mb-6 animate-fadeIn shadow-sm" style={{ animationDelay: '0.15s' }}>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-black">88% of consumers choose businesses that respond to every review</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 text-base px-10 py-5 bg-black text-white hover:bg-gray-900 transition-all group relative overflow-hidden shadow-lg hover:shadow-2xl"
              >
                <span className="relative z-10">Start free trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>

              <div className="flex items-center gap-2 text-sm text-black">
                <CheckCircle2 className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
            </div>

            {/* Live stats ticker */}
            <div className="mt-12 flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-black">1,247 reviews analyzed today</span>
              </div>
            </div>
          </div>

          {/* Right: Live Review Demo */}
          <div className="relative">
            {/* Floating review cards */}
            <div className="relative h-[500px]">
              {mockReviews.map((review, idx) => {
                const offset = (idx - currentReviewIndex + mockReviews.length) % mockReviews.length
                const isActive = offset === 0

                return (
                  <div
                    key={idx}
                    className="absolute inset-0 transition-all duration-700 ease-out"
                    style={{
                      transform: `translateY(${offset * 120}px) scale(${isActive ? 1 : 0.9})`,
                      opacity: offset < 3 ? 1 - offset * 0.3 : 0,
                      zIndex: mockReviews.length - offset,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    <div className="bg-white border-2 border-black/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                      {/* Platform badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="px-3 py-1 bg-black/5 rounded-full text-xs font-medium text-black">
                          {review.platform}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-black/20'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="text-lg text-black mb-4 font-light leading-relaxed">
                        "{review.text}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.avatar}
                            alt={review.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="font-medium text-sm text-black">{review.name}</span>
                        </div>

                        {/* Sentiment indicator */}
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          review.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {review.sentiment === 'positive' ? '😊 Positive' : '😞 Negative'}
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div className="mt-6 pt-6 border-t border-black/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">AI Analysis</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {review.sentiment === 'positive' ? (
                            <>
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">High satisfaction</span>
                              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">Positive experience</span>
                            </>
                          ) : (
                            <>
                              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">Needs attention</span>
                              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">Service issue</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Review counter */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full text-sm font-light shadow-xl">
              Review {currentReviewIndex + 1} of {mockReviews.length}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Demo Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Try it yourself</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-light mb-6 text-black">
              AI that <span className="italic font-normal">responds for you</span>
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto font-light mb-6">
              Choose your tone, AI drafts the perfect response. Watch it happen in real-time.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full shadow-sm">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-black">53% expect a response within 7 days—respond instantly with AI</span>
            </div>
          </div>

          {/* Interactive tone selector */}
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-4 mb-8">
              {(['professional', 'friendly', 'apologetic'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`px-8 py-4 rounded-xl font-medium transition-all ${
                    selectedTone === tone
                      ? 'bg-black text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-black/10 text-black hover:border-black/30'
                  }`}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </button>
              ))}
            </div>

            {/* Sample Review being responded to */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/150?img=68"
                    alt="Michael Chen"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-sm text-black">Michael Chen</div>
                    <div className="text-xs text-black">2 days ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-black/20'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-black font-light leading-relaxed">
                "Great product overall, but the delivery took longer than expected. Would appreciate faster shipping options."
              </p>
            </div>

            {/* AI Response Display */}
            <div className="bg-white border-2 border-black/10 rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="font-medium text-sm text-black">AI-Generated Response</span>
                </div>
                {isTyping && (
                  <div className="flex items-center gap-1 text-xs text-black">
                    <div className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>

              <p className="text-lg text-black font-light leading-relaxed min-h-[100px]">
                {displayedText}
                {isTyping && <span className="inline-block w-0.5 h-5 bg-black ml-1 animate-pulse" />}
              </p>

              <div className="mt-6 pt-6 border-t border-black/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black">
                  <Clock className="w-4 h-4" />
                  <span>Generated in 0.8s</span>
                </div>
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                  Post Reply
                </button>
              </div>

              {/* Animated shimmer effect */}
              {isTyping && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration Visual */}
      <section className="py-32 px-6 border-y border-black/10 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-light mb-6 text-black">
              All platforms. <span className="italic font-normal">One hub.</span>
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto font-light mb-6">
              Connect your review sources and watch them flow into Sentra in real-time.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-full shadow-sm">
              <Star className="w-4 h-4 text-red-600 fill-red-600" />
              <span className="text-sm font-medium text-black">57-92% of consumers only consider businesses with 4+ stars</span>
            </div>
          </div>

          {/* Platform connection visualization */}
          <div className="relative h-[400px]">
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-32 h-32 rounded-full bg-black text-white flex items-center justify-center shadow-2xl">
                <span className="text-2xl font-bold">Sentra</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 animate-ping" />
            </div>

            {/* Platform nodes */}
            {[
              { name: 'Google', angle: 0, color: 'bg-blue-500' },
              { name: 'Yelp', angle: 45, color: 'bg-red-500' },
              { name: 'Facebook', angle: 90, color: 'bg-blue-600' },
              { name: 'Trustpilot', angle: 135, color: 'bg-green-500' },
              { name: 'TripAdvisor', angle: 180, color: 'bg-green-600' },
              { name: 'G2', angle: 225, color: 'bg-orange-500' },
              { name: 'Amazon', angle: 270, color: 'bg-yellow-600' },
              { name: 'Capterra', angle: 315, color: 'bg-purple-500' },
            ].map((platform, idx) => {
              const radius = 180
              const x = Math.cos((platform.angle * Math.PI) / 180) * radius
              const y = Math.sin((platform.angle * Math.PI) / 180) * radius

              return (
                <div key={platform.name}>
                  {/* Connection line */}
                  <div
                    className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-black/20 to-transparent origin-left"
                    style={{
                      width: `${radius}px`,
                      transform: `rotate(${platform.angle}deg)`,
                    }}
                  >
                    {/* Animated dot traveling along line */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full animate-pulse"
                      style={{
                        left: '50%',
                        animationDelay: `${idx * 0.2}s`
                      }}
                    />
                  </div>

                  {/* Platform node */}
                  <div
                    className="absolute top-1/2 left-1/2 group cursor-pointer"
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    <div className={`w-20 h-20 rounded-full ${platform.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <span className="text-xs font-medium text-center px-2">{platform.name}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features with icons */}
      <section className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            {
              icon: MessageSquare,
              title: 'Unified Inbox',
              description: 'All your reviews from 20+ platforms in one beautiful dashboard. No more tab switching.',
              stat: 'Save 5+ hours/week',
              color: 'text-blue-600',
              bgColor: 'bg-blue-50'
            },
            {
              icon: BarChart3,
              title: 'AI Insights',
              description: 'Sentiment trends, keyword analysis, and actionable recommendations powered by Claude.',
              stat: '95% of consumers read reviews before choosing',
              color: 'text-purple-600',
              bgColor: 'bg-purple-50'
            },
            {
              icon: Zap,
              title: 'Instant Responses',
              description: 'AI drafts personalized replies in seconds. Choose your tone, review, and post.',
              stat: 'Respond 10x faster with AI',
              color: 'text-orange-600',
              bgColor: 'bg-orange-50'
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group hover:-translate-y-2 transition-all duration-300 cursor-default"
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-2xl font-light mb-4 text-black">{feature.title}</h3>
              <p className="text-black font-light leading-relaxed mb-4">{feature.description}</p>
              {feature.stat && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 ${feature.bgColor} border-2 ${feature.color.replace('text-', 'border-')} rounded-lg`}>
                  <span className={`text-sm font-semibold ${feature.color}`}>{feature.stat}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Animated stats */}
      <section ref={statsRef} className="py-32 px-6 bg-black text-white relative overflow-hidden">
        {/* Animated scanline effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scanline" />
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16 relative">
          <div className="group cursor-default text-center">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">
              91<span className="text-4xl">%</span>
            </div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Trust reviews like friends</div>
          </div>
          <div className="group cursor-default text-center">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">
              5-9<span className="text-4xl">%</span>
            </div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Revenue boost per star</div>
          </div>
          <div className="group cursor-default text-center">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">
              {counters.platforms}+
            </div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Platforms supported</div>
          </div>
          <div className="group cursor-default text-center">
            <div className="text-7xl font-light mb-3 transition-all duration-300 group-hover:scale-110">
              10
            </div>
            <div className="text-sm uppercase tracking-widest group-hover:tracking-wider transition-all">Reviews before trust</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6 relative">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-light mb-12 leading-[0.95] tracking-tight text-black">
            Stop managing reviews.
            <br />
            <span className="italic">Start understanding them.</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 text-lg px-12 py-6 bg-black text-white hover:bg-gray-900 transition-all group relative overflow-hidden shadow-2xl"
            >
              <span className="relative z-10">Get started free</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-lg px-8 py-6 border-2 border-black/20 text-black hover:border-black/40 transition-all"
            >
              <span>See how it works</span>
            </Link>
          </div>

        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-gridMove {
          animation: gridMove 20s linear infinite;
        }

        .animate-scanline {
          animation: scanline 8s linear infinite;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  )
}
