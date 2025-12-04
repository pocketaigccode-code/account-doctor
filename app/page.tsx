'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter Instagram username')
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 [新架构] 开始诊断账号:', username)

      // 调用新的Fast Lane API
      const response = await fetch('/api/audit/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.ui_message || errorData.message || 'Diagnosis failed')
      }

      const data = await response.json()
      console.log('✅ [Fast Lane] 快照数据已获取:', {
        auditId: data.audit_id,
        score: data.diagnosis_card?.score,
        cacheHit: data.cache_hit
      })

      // 打印完整数据到控制台
      console.log('📦 [完整响应数据]:', data)
      console.log('👤 [即时数据 - instant_data]:', data.instant_data)
      console.log('📊 [诊断卡片 - diagnosis_card]:', data.diagnosis_card)
      console.log('⏱️ [性能指标]:', data.performance)

      // 跳转到新的结果页
      router.push(`/audit/${data.audit_id}`)

    } catch (err) {
      setError((err as Error).message || 'An error occurred, please try again')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-8 pt-8 pb-4">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4 leading-tight tracking-tight whitespace-nowrap">
            What's Your Instagram Health Score?
          </h1>

          <p className="font-sans text-base text-charcoal-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Stop guessing. Let our AI analyze your profile, find hidden growth killers, and fix them instantly.
          </p>

          {/* Input Form */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-terracotta-light border-l-4 border-terracotta p-4 text-left mb-4">
                  <p className="text-sm text-charcoal-800 font-sans">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Instagram username"
                  disabled={isLoading}
                  className="flex-1 px-5 py-4 text-base border-2 border-charcoal-900 bg-white text-charcoal-900 placeholder:text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-charcoal-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans rounded-lg"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white font-sans font-semibold text-base py-4 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-md whitespace-nowrap"
                >
                  {isLoading ? 'Analyzing...' : 'See My Score'}
                </button>
              </div>

              {isLoading && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-white border-2 border-sand-300 px-8 py-6">
                    <p className="text-xs font-sans font-bold text-charcoal-900 mb-4 uppercase tracking-widest">ANALYZING</p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sage">✓</span>
                        <span className="text-charcoal-900">Fetching data</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-charcoal-900 font-medium">AI analyzing...</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sand-400">○</span>
                        <span className="text-charcoal-400">Generating report</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Features - Moved outside max-w-2xl */}
          <div className="mt-8">
              <div className="grid md:grid-cols-3 gap-5">
                <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-xl text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2 whitespace-nowrap">Missed Traffic Check</h3>
                  <p className="font-sans text-xs text-charcoal-600 leading-snug line-clamp-2">
                    See exactly where you are losing potential customers in your bio and posts.
                  </p>
                </div>

                <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-xl text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2 whitespace-nowrap">Instant Content Fix</h3>
                  <p className="font-sans text-xs text-charcoal-600 leading-snug line-clamp-2">
                    Get ready-to-post images and captions generated by AI instantly.
                  </p>
                </div>

                <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-xl text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2 whitespace-nowrap">Beat Local Competitors</h3>
                  <p className="font-sans text-xs text-charcoal-600 leading-snug line-clamp-2">
                    Actionable steps to rank higher than others in your city.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-8 pt-4 pb-8">
        <div className="text-center mb-8">
          <p className="font-sans text-xs text-charcoal-600 mb-1 uppercase tracking-wider">Testimonials</p>
          <h2 className="font-serif text-3xl font-bold text-charcoal-900">What Local Business Owners Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Testimonial 1 */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-100 p-6 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                SC
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-bold text-charcoal-900">Sarah Chen</p>
                <p className="font-sans text-xs text-charcoal-600">@sarahscoffee</p>
              </div>
            </div>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              "AccountDoctor found issues I didn't even know existed. The AI-generated content saved me hours of work each week!"
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-100 p-6 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                MR
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-bold text-charcoal-900">Maria Rodriguez</p>
                <p className="font-sans text-xs text-charcoal-600">@mariesnails</p>
              </div>
            </div>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              "My engagement doubled after implementing their recommendations. The traffic check showed me exactly what I was missing."
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-100 p-6 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                JT
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-bold text-charcoal-900">James Turner</p>
                <p className="font-sans text-xs text-charcoal-600">@jameshomes</p>
              </div>
            </div>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              "Finally, actionable insights instead of just numbers. The competitor analysis helped me rank #1 in my area."
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="font-sans text-xs text-charcoal-600">
            © 2025 AccountDoctor. AI-powered social media account diagnosis tool
          </p>
        </div>
      </footer>
    </div>
  )
}
