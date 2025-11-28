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
      setError('请输入Instagram用户名')
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
        throw new Error(errorData.ui_message || errorData.message || '诊断失败')
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
      setError((err as Error).message || '发生错误,请重试')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <h1 className="font-serif text-charcoal-900 text-xl font-bold">AccountDoctor</h1>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl font-bold text-charcoal-900 mb-6 leading-tight tracking-tight">
            Instagram 账号深度诊断与优化
          </h1>

          <p className="font-sans text-lg text-charcoal-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            60秒获得专业的 AI 账号诊断报告,发现隐形问题。
          </p>

          {/* Input Form */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入 Instagram 用户名"
                  disabled={isLoading}
                  className="w-full px-5 py-4 text-base border-2 border-charcoal-900 bg-white text-charcoal-900 placeholder:text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-charcoal-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                />
              </div>

              {error && (
                <div className="bg-terracotta-light border-l-4 border-terracotta p-4 text-left">
                  <p className="text-sm text-charcoal-800 font-sans">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-charcoal-900 text-white font-sans font-semibold text-base py-4 px-8 hover:bg-charcoal-800 transition-colors disabled:bg-charcoal-600 disabled:cursor-not-allowed border-none"
                style={{ backgroundColor: isLoading ? '#666666' : '#191919', color: '#ffffff' }}
              >
                {isLoading ? '分析中...' : '开始诊断'}
              </button>

              {isLoading && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-white border-2 border-sand-300 px-8 py-6">
                    <p className="text-xs font-sans font-bold text-charcoal-900 mb-4 uppercase tracking-widest">正在分析</p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sage">✓</span>
                        <span className="text-charcoal-900">获取数据</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-charcoal-900 font-medium">AI分析中...</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sand-400">○</span>
                        <span className="text-charcoal-400">生成报告</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">多维度评分</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              35+维度深度分析账号表现,提供全面的健康度评估
            </p>
          </div>

          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">AI内容生成</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              智能文案、标签和内容日历规划,让创作更轻松
            </p>
          </div>

          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">可执行方案</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              具体改进步骤和优先级排序,即刻开始优化
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="font-sans text-xs text-charcoal-600">
            © 2025 AccountDoctor. AI驱动的社交媒体账号诊断工具
          </p>
        </div>
      </footer>
    </div>
  )
}
