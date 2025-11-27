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
      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!scanRes.ok) throw new Error('扫描请求失败')
      const { scanId } = await scanRes.json()

      let attempts = 0
      const maxAttempts = 30

      const checkStatus = async (): Promise<boolean> => {
        const statusRes = await fetch(`/api/scan?id=${scanId}`)
        const data = await statusRes.json()

        if (data.status === 'COMPLETED') return true
        if (data.status === 'FAILED') throw new Error('扫描失败,请重试')

        attempts++
        if (attempts >= maxAttempts) throw new Error('扫描超时,请重试')

        await new Promise((resolve) => setTimeout(resolve, 2000))
        return checkStatus()
      }

      await checkStatus()

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, industry: '餐饮' }),
      })

      if (!analyzeRes.ok) throw new Error('分析失败')
      const { reportId } = await analyzeRes.json()

      router.push(`/result?id=${reportId}`)
    } catch (err) {
      setError((err as Error).message || '发生错误,请重试')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-[12px] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[#1F2937] font-semibold text-lg">AccountDoctor</span>
          </div>
          <button className="text-[#6B7280] hover:text-[#1F2937] text-sm font-medium transition-colors">
            登录
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#E9D5FF] text-[#7C3AED] px-4 py-2 rounded-full text-sm font-medium mb-8">
            <div className="w-2 h-2 bg-[#7C3AED] rounded-full"></div>
            AI驱动的智能诊断
          </div>

          {/* Headline */}
          <h1 className="text-[40px] font-semibold text-[#1F2937] mb-6 leading-tight">
            让你的Instagram账号
            <br />
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
              发挥最大潜力
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-[16px] text-[#6B7280] mb-8 max-w-2xl mx-auto leading-relaxed">
            60秒获得专业的AI账号诊断报告,发现隐藏问题,获取可执行的增长策略
          </p>

          {/* Value Props */}
          <div className="flex justify-center gap-6 mb-12 text-[13px] text-[#6B7280]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              无需登录
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              完全免费
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              60秒出报告
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[20px] p-8 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-[14px] font-medium text-[#1F2937] mb-3">
                  Instagram 账号用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nike, cocacola, starbucks..."
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-[14px] text-[15px] border border-[#E5E7EB] rounded-[12px] focus:border-[#8B5CF6] focus:outline-none focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all disabled:bg-[#F9FAFB] disabled:cursor-not-allowed text-[#1F2937] placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-[12px]">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[14px] text-red-700 font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-medium py-[14px] px-8 rounded-[16px] shadow-[0_4px_16px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-[15px]"
              >
                {isLoading ? '分析中...' : '开始免费诊断'}
              </button>

              {isLoading && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>正在获取Instagram公开数据...</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#6B7280]">
                    <div className="w-5 h-5 rounded-full border-2 border-[#E5E7EB] border-t-[#8B5CF6] animate-spin flex-shrink-0"></div>
                    <span>AI模型深度分析中...</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] text-[#9CA3AF]">
                    <div className="w-5 h-5 rounded-full border-2 border-[#E5E7EB] flex-shrink-0"></div>
                    <span>生成诊断报告与内容方案...</span>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center">
              <p className="text-[13px] text-[#9CA3AF] flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                100%安全 · 仅访问公开数据 · 不需要密码
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-[#F3F4F6] rounded-[12px] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-[20px] font-medium text-[#1F2937] mb-2">35+维度评分</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              从内容质量、互动健康、账号活力等多维度深度分析
            </p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-[#F3F4F6] rounded-[12px] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-[20px] font-medium text-[#1F2937] mb-2">AI内容生成</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              即时生成文案、标签和30天内容规划日历
            </p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-[#F3F4F6] rounded-[12px] flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[20px] font-medium text-[#1F2937] mb-2">可执行方案</h3>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              具体的改进步骤和优先级,立即知道该做什么
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white border-t border-[#E5E7EB] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-[36px] font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent mb-1">
                1,247+
              </div>
              <div className="text-[14px] text-[#6B7280]">企业主信赖使用</div>
            </div>
            <div>
              <div className="text-[36px] font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent mb-1">
                40%+
              </div>
              <div className="text-[14px] text-[#6B7280]">平均互动率提升</div>
            </div>
            <div>
              <div className="text-[36px] font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent mb-1">
                60秒
              </div>
              <div className="text-[14px] text-[#6B7280]">快速获得报告</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F5F7] border-t border-[#E5E7EB] py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[13px] text-[#9CA3AF]">
            © 2025 AccountDoctor. AI驱动的社交媒体账号诊断工具
          </p>
        </div>
      </footer>
    </div>
  )
}
