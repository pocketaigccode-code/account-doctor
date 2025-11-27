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
      // 1. 创建扫描
      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!scanRes.ok) {
        throw new Error('扫描请求失败')
      }

      const { scanId } = await scanRes.json()

      // 2. 轮询扫描状态
      let attempts = 0
      const maxAttempts = 30 // 最多等待60秒

      const checkStatus = async (): Promise<boolean> => {
        const statusRes = await fetch(`/api/scan?id=${scanId}`)
        const data = await statusRes.json()

        if (data.status === 'COMPLETED') {
          return true
        } else if (data.status === 'FAILED') {
          throw new Error('扫描失败,请重试')
        }

        attempts++
        if (attempts >= maxAttempts) {
          throw new Error('扫描超时,请重试')
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
        return checkStatus()
      }

      await checkStatus()

      // 3. 触发AI分析
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, industry: '餐饮' }),
      })

      if (!analyzeRes.ok) {
        throw new Error('分析失败')
      }

      const { reportId } = await analyzeRes.json()

      // 4. 跳转到结果页
      router.push(`/result?id=${reportId}`)
    } catch (err) {
      setError((err as Error).message || '发生错误,请重试')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            AccountDoctor
            <span className="ml-2 text-sm font-normal text-gray-500">
              AI账号诊断工具
            </span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            60秒获得专业的
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Instagram账号诊断报告
            </span>
          </h2>
          <p className="text-xl text-gray-600 mt-6">
            无需登录 · 免费分析 · AI驱动
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              专业评分系统
            </h3>
            <p className="text-sm text-gray-600">
              35+维度深度分析,给出0-100分综合评分
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI内容生成</h3>
            <p className="text-sm text-gray-600">
              即时获得精美文案+30天内容规划日历
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">可执行建议</h3>
            <p className="text-sm text-gray-600">
              3个核心改进方向,立即提升账号表现
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                输入Instagram用户名
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    @
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="例如: nike"
                    className="w-full pl-8 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLoading ? '分析中...' : '免费诊断'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-3 bg-purple-50 px-6 py-3 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className="text-purple-700 font-medium">
                    正在分析账号数据...
                  </span>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              🔒 我们仅访问公开数据,不会要求任何密码
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">已有 1,247+ 企业主获得诊断报告</p>
          <div className="flex justify-center gap-8 text-sm text-gray-500">
            <span>⭐ 平均评分提升 23%</span>
            <span>📈 互动率增长 40%+</span>
            <span>⏱️ 60秒完成分析</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>© 2025 AccountDoctor. AI驱动的社交媒体账号诊断工具</p>
        </div>
      </footer>
    </div>
  )
}
