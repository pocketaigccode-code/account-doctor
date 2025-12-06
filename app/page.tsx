'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AILoadingAnimation } from '@/components/loading/AILoadingAnimation'
import { InfiniteTestimonials } from '@/components/home/InfiniteTestimonials'

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

      // 验证audit_id是否存在
      if (!data.audit_id) {
        console.error('❌ [跳转失败] audit_id不存在:', data)
        throw new Error('数据异常：缺少audit_id，请重试')
      }

      console.log(`🔄 [跳转中] 正在跳转到: /audit/${data.audit_id}`)

      // 跳转到新的结果页
      router.push(`/audit/${data.audit_id}`)

      // 设置5秒超时保护：如果跳转失败，允许用户重试
      setTimeout(() => {
        if (window.location.pathname === '/') {
          console.error('⚠️ [跳转超时] 5秒后仍未跳转，可能是路由问题')
          setError('页面跳转失败，请刷新后重试或直接访问：/audit/' + data.audit_id)
          setIsLoading(false)
        }
      }, 5000)

    } catch (err) {
      console.error('❌ [请求失败]:', err)
      setError((err as Error).message || 'An error occurred, please try again')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 上半部分：Hero + 功能卡片 - 占 2/3 视口 */}
      <div className="flex-[1] md:flex-[2] md:min-h-[60vh]">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-8 pt-6 pb-2">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4 leading-tight tracking-tight">
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
                  className="px-8 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white font-sans font-semibold text-base py-4 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none rounded-md"
                >
                  {isLoading ? 'Analyzing...' : 'See My Score'}
                </button>
              </div>

              {isLoading && (
                <div className="text-center mt-6">
                  <AILoadingAnimation
                    steps={[
                      { title: 'Connecting Account', detail: `Verifying @${username}...`, progress: 10 },
                      { title: 'Fetching Data', detail: 'Downloading recent posts & reels...', progress: 30 },
                      { title: 'AI Vision Analysis', detail: 'Scanning visual consistency & color palette...', progress: 55 },
                      { title: 'Calculating Score', detail: 'Comparing engagement against local competitors...', progress: 75 },
                      { title: 'Finalizing Report', detail: 'Generating optimization strategy...', progress: 90 },
                      { title: 'Done!', detail: 'Redirecting to your dashboard...', progress: 100 }
                    ]}
                    icon="⚡️"
                    autoPlay={true}
                    stepInterval={3300}
                  />
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
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2">Missed Traffic Check</h3>
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
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2">Instant Content Fix</h3>
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
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-2">Beat Local Competitors</h3>
                  <p className="font-sans text-xs text-charcoal-600 leading-snug line-clamp-2">
                    Actionable steps to rank higher than others in your city.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>
      </div> {/* 上半部分包装器结束 */}

      {/* 下半部分：Testimonials - 占 1/3 视口 */}
      <InfiniteTestimonials />

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="font-sans text-xs text-charcoal-600">
            © 2025 AccountDoctor. AI-powered social media account diagnosis tool
          </p>
        </div>
      </footer>
    </div>
  )
}
