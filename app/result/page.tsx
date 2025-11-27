'use client'

import { useEffect, useState, Suspense } from 'react'
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

function ResultPageContent() {
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
          animateScore(data.scoreBreakdown.total)
        }
      })
      .catch(() => setError('获取报告失败'))
      .finally(() => setLoading(false))
  }, [reportId])

  const animateScore = (targetScore: number) => {
    let current = 0
    const increment = targetScore / 40
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
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#E5E7EB] border-t-[#8B5CF6] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[13px] text-[#6B7280]">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-[16px] p-10 border border-[#E5E7EB] max-w-md text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-semibold text-[#1F2937] mb-2">无法加载报告</h2>
          <p className="text-[13px] text-[#6B7280] mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-medium py-2.5 px-6 rounded-[12px] hover:scale-[1.02] transition-all text-[13px]"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const score = scoreAnimation || report.scoreBreakdown.total
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981'
    if (s >= 60) return '#3B82F6'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Navigation */}
      <nav className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1F2937] rounded-[10px] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-[#1F2937] font-semibold text-[15px]">AccountDoctor</span>
              <p className="text-[11px] text-[#9CA3AF] leading-none">@{report.username}</p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-[#6B7280] hover:text-[#1F2937] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Score */}
        <div className="bg-white rounded-[16px] p-8 mb-4 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[24px] font-semibold text-[#1F2937]">健康度评分</h2>
            <div className="bg-[#E9D5FF] text-[#7C3AED] px-4 py-1.5 rounded-full text-[13px] font-medium">
              {report.scoreBreakdown.grade}
            </div>
          </div>

          <div className="flex items-center gap-12">
            {/* Score Circle */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="transform -rotate-90 w-36 h-36">
                <circle cx="72" cy="72" r="66" stroke="#E5E7EB" strokeWidth="10" fill="none" />
                <circle
                  cx="72"
                  cy="72"
                  r="66"
                  stroke={getScoreColor(score)}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 66}`}
                  strokeDashoffset={`${2 * Math.PI * 66 * (1 - score / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[44px] font-semibold text-[#1F2937]">{score}</div>
                <div className="text-[13px] text-[#9CA3AF]">/ 100</div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="flex-1 grid grid-cols-5 gap-4">
              <Dimension label="内容" score={report.scoreBreakdown.content_quality} max={30} />
              <Dimension label="互动" score={report.scoreBreakdown.engagement_health} max={25} />
              <Dimension label="活力" score={report.scoreBreakdown.account_vitality} max={20} />
              <Dimension label="增长" score={report.scoreBreakdown.growth_potential} max={15} />
              <Dimension label="受众" score={report.scoreBreakdown.audience_match} max={10} />
            </div>
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-white rounded-[16px] p-6 mb-4 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[18px] font-medium text-[#1F2937] mb-4">改进建议</h3>
          <div className="space-y-3 mb-4">
            {report.improvements.issues.map((issue, index) => (
              <div key={index} className="flex gap-3 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px]">
                <div className="w-6 h-6 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-[6px] flex items-center justify-center font-medium text-[12px] flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-[13px] text-[#374151] leading-relaxed">{issue}</p>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-[8px] p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-[8px] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-red-900 mb-1">最紧急</h4>
                <p className="text-[13px] text-red-700 leading-relaxed">{report.improvements.urgent_action}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Day 1 */}
        <div className="bg-white rounded-[16px] p-6 mb-4 border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-[18px] font-medium text-[#1F2937] mb-4">AI生成的首日内容</h3>

          <div className="mb-4 p-5 bg-[#E9D5FF]/20 rounded-[12px] border border-[#E9D5FF]">
            <h4 className="text-[13px] font-medium text-[#374151] mb-2">文案</h4>
            <p className="text-[14px] text-[#1F2937] leading-relaxed whitespace-pre-wrap">
              {report.day1Content.caption}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB]">
              <h4 className="text-[13px] font-medium text-[#374151] mb-3">标签</h4>
              <div className="flex flex-wrap gap-1.5">
                {report.day1Content.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-[#E9D5FF] text-[#7C3AED] px-3 py-1 rounded-full text-[12px] font-medium hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB]">
                <h4 className="text-[13px] font-medium text-[#374151] mb-2">图片建议</h4>
                <p className="text-[12px] text-[#6B7280] leading-relaxed">{report.day1Content.image_suggestion}</p>
              </div>

              <div className="p-4 bg-[#E9D5FF]/20 rounded-[12px] border border-[#E9D5FF]">
                <h4 className="text-[13px] font-medium text-[#374151] mb-1.5">最佳发布时间</h4>
                <p className="text-[14px] text-[#7C3AED] font-medium">{report.day1Content.best_time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-[16px] p-8 text-center shadow-[0_4px_16px_rgba(139,92,246,0.2)]">
          <div className="w-12 h-12 bg-white/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h3 className="text-[22px] font-semibold text-white mb-2">解锁完整30天内容日历</h3>
          <p className="text-[14px] text-white/90 mb-6 max-w-md mx-auto">
            获取AI规划的完整内容策略、专业文案和图片建议
          </p>

          <div className="flex justify-center gap-5 mb-6 text-[12px] text-white/80">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              30天规划
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              AI图片
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              文案库
            </span>
          </div>

          <button className="bg-white text-[#7C3AED] font-medium py-2.5 px-6 rounded-[12px] hover:scale-[1.02] transition-all text-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            免费注册解锁
          </button>

          <p className="text-[11px] text-white/70 mt-3">无需信用卡</p>
        </div>
      </main>
    </div>
  )
}

function Dimension({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100
  return (
    <div className="text-center">
      <div className="text-[11px] text-[#9CA3AF] mb-2">{label}</div>
      <div className="relative w-16 h-16 mx-auto mb-1.5">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="5" fill="none" />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="#8B5CF6"
            strokeWidth="5"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[16px] font-semibold text-[#1F2937]">{score}</div>
        </div>
      </div>
      <div className="text-[10px] text-[#9CA3AF]">/{max}</div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#E5E7EB] border-t-[#8B5CF6] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[13px] text-[#6B7280]">加载中...</p>
        </div>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  )
}
