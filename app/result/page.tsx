'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReportData {
  id: string
  username: string
  scoreBreakdown: {
    total: number
    grade: string
    content_quality: number
    engagement_health: number
    account_vitality: number
    growth_potential: number
    audience_match: number
  }
  improvements: {
    issues: string[]
    urgent_action: string
  }
  day1Content: {
    caption: string
    hashtags: string[]
    image_suggestion: string
    best_time: string
  }
  calendarOutline: any
}

export default function ResultPage() {
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scoreAnimation, setScoreAnimation] = useState(0)

  useEffect(() => {
    if (!reportId) {
      setError('缺少报告ID')
      setLoading(false)
      return
    }

    fetch(`/api/analyze?id=${reportId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setReport(data)
          // 分数动画
          animateScore(data.scoreBreakdown.total)
        }
      })
      .catch(() => setError('获取报告失败'))
      .finally(() => setLoading(false))
  }, [reportId])

  const animateScore = (targetScore: number) => {
    let current = 0
    const increment = targetScore / 50
    const timer = setInterval(() => {
      current += increment
      if (current >= targetScore) {
        setScoreAnimation(targetScore)
        clearInterval(timer)
      } else {
        setScoreAnimation(Math.floor(current))
      }
    }, 20)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">正在加载诊断报告</h3>
          <p className="text-slate-600">请稍候,马上为你呈现...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">无法加载报告</h2>
          <p className="text-slate-600 mb-8">{error || '未找到诊断报告'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const score = scoreAnimation || report.scoreBreakdown.total
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'from-green-500 to-emerald-600'
    if (s >= 60) return 'from-blue-500 to-indigo-600'
    if (s >= 40) return 'from-yellow-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AccountDoctor
                </h1>
                <p className="text-xs text-slate-500">@{report.username} 的诊断报告</p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = '/')}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Score Card - Hero */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl p-12 mb-8 border border-slate-200">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-30 -z-0"></div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-indigo-700">AI诊断完成</span>
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                账号健康度评分
              </h2>

              {/* Score Display */}
              <div className="relative inline-block">
                <div className="relative w-64 h-64 mx-auto">
                  {/* Outer ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-slate-100"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      stroke="url(#scoreGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 110}`}
                      strokeDashoffset={`${2 * Math.PI * 110 * (1 - score / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`${score >= 80 ? 'stop-green-500' : score >= 60 ? 'stop-blue-500' : score >= 40 ? 'stop-yellow-500' : 'stop-red-500'}`} />
                        <stop offset="100%" className={`${score >= 80 ? 'stop-emerald-600' : score >= 60 ? 'stop-indigo-600' : score >= 40 ? 'stop-orange-600' : 'stop-rose-600'}`} />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Score number */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-7xl font-black bg-gradient-to-br ${getScoreColor(score)} bg-clip-text text-transparent`}>
                      {score}
                    </div>
                    <div className="text-2xl text-slate-400 font-medium">/ 100</div>
                  </div>
                </div>

                {/* Grade badge */}
                <div className="mt-6">
                  <div className={`inline-block px-8 py-3 bg-gradient-to-r ${getScoreColor(score)} text-white rounded-full font-bold text-lg shadow-lg`}>
                    {report.scoreBreakdown.grade}
                  </div>
                </div>
              </div>
            </div>

            {/* Dimension Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-12">
              <DimensionScore
                label="内容质量"
                score={report.scoreBreakdown.content_quality}
                maxScore={30}
                color="indigo"
              />
              <DimensionScore
                label="互动健康"
                score={report.scoreBreakdown.engagement_health}
                maxScore={25}
                color="purple"
              />
              <DimensionScore
                label="账号活力"
                score={report.scoreBreakdown.account_vitality}
                maxScore={20}
                color="pink"
              />
              <DimensionScore
                label="增长潜力"
                score={report.scoreBreakdown.growth_potential}
                maxScore={15}
                color="blue"
              />
              <DimensionScore
                label="受众匹配"
                score={report.scoreBreakdown.audience_match}
                maxScore={10}
                color="cyan"
              />
            </div>
          </div>
        </div>

        {/* Improvements Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">核心改进建议</h3>
          </div>

          <div className="space-y-4 mb-8">
            {report.improvements.issues.map((issue, index) => (
              <div
                key={index}
                className="group flex gap-4 p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl hover:shadow-lg hover:border-indigo-300 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 leading-relaxed font-medium">{issue}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Urgent Action */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full blur-3xl opacity-30"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-red-900 mb-3">最紧急行动项</h4>
                <p className="text-red-800 text-lg font-medium leading-relaxed">
                  {report.improvements.urgent_action}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Day 1 Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900">AI为你生成的首日内容</h3>
              <p className="text-slate-500 mt-1">立即可用的高质量文案与策略</p>
            </div>
          </div>

          {/* Caption */}
          <div className="mb-8 p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h4 className="text-lg font-bold text-slate-900">精选文案</h4>
            </div>
            <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
              {report.day1Content.caption}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hashtags */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <h4 className="font-bold text-slate-900">推荐标签</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.day1Content.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Image & Time */}
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-bold text-slate-900">图片建议</h4>
                </div>
                <p className="text-slate-700">{report.day1Content.image_suggestion}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-bold text-slate-900">最佳发布时间</h4>
                </div>
                <p className="text-green-700 text-xl font-bold">{report.day1Content.best_time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 30-Day Calendar CTA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl p-12 text-center border border-slate-700">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAyYy0yLjIxIDAtNCAxLjc5LTQgNHMxLjc5IDQgNCA0IDQtMS43OSA0LTQtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              解锁完整30天内容日历
            </h3>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              获取AI规划的完整内容策略、精美图片和专业文案,让你的Instagram运营事半功倍
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>30天完整规划</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI生成图片</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>专业文案库</span>
              </div>
            </div>

            <button className="group relative inline-flex items-center gap-3 px-12 py-5 bg-white text-slate-900 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-200">
              <span>立即免费注册解锁</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <p className="text-slate-400 text-sm mt-4">无需信用卡 · 永久免费使用</p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Dimension Score Component
function DimensionScore({
  label,
  score,
  maxScore,
  color,
}: {
  label: string
  score: number
  maxScore: number
  color: string
}) {
  const percentage = (score / maxScore) * 100

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
  }

  return (
    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</div>
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className={`${colorMap[color]} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <div className={`text-2xl font-black ${colorMap[color]}`}>{score}</div>
            <div className="text-xs text-slate-400">/{maxScore}</div>
          </div>
        </div>
      </div>
      <div className="text-sm text-slate-600">
        {Math.round(percentage)}% 完成度
      </div>
    </div>
  )
}
