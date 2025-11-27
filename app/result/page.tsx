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
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E5E7EB] border-t-[#8B5CF6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[14px] text-[#6B7280]">正在加载诊断报告...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] p-12 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)] max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-[24px] font-semibold text-[#1F2937] mb-3">无法加载报告</h2>
          <p className="text-[14px] text-[#6B7280] mb-8">{error || '未找到诊断报告'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-medium py-[12px] px-8 rounded-[16px] hover:scale-[1.02] transition-all text-[14px]"
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
    if (s >= 60) return '#8B5CF6'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
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
            <div>
              <span className="text-[#1F2937] font-semibold text-lg">AccountDoctor</span>
              <p className="text-[12px] text-[#9CA3AF]">@{report.username}</p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-[#6B7280] hover:text-[#1F2937] text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Score Card */}
        <div className="bg-white rounded-[20px] p-12 mb-6 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#E9D5FF] text-[#7C3AED] px-3 py-1.5 rounded-full text-[13px] font-medium mb-8">
              <div className="w-2 h-2 bg-[#7C3AED] rounded-full"></div>
              AI诊断完成
            </div>

            <h2 className="text-[32px] font-semibold text-[#1F2937] mb-12">账号健康度评分</h2>

            {/* Score Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={getScoreColor(score)}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - score / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[56px] font-semibold text-[#1F2937]">{score}</div>
                <div className="text-[16px] text-[#9CA3AF]">/ 100</div>
              </div>
            </div>

            {/* Grade Badge */}
            <div className="inline-block bg-[#E9D5FF] text-[#7C3AED] px-6 py-2 rounded-full text-[14px] font-medium">
              {report.scoreBreakdown.grade}
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-5 gap-6 mt-12 pt-12 border-t border-[#E5E7EB]">
              <DimensionScore label="内容质量" score={report.scoreBreakdown.content_quality} maxScore={30} />
              <DimensionScore label="互动健康" score={report.scoreBreakdown.engagement_health} maxScore={25} />
              <DimensionScore label="账号活力" score={report.scoreBreakdown.account_vitality} maxScore={20} />
              <DimensionScore label="增长潜力" score={report.scoreBreakdown.growth_potential} maxScore={15} />
              <DimensionScore label="受众匹配" score={report.scoreBreakdown.audience_match} maxScore={10} />
            </div>
          </div>
        </div>

        {/* Improvements */}
        <div className="bg-white rounded-[20px] p-8 mb-6 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h3 className="text-[24px] font-medium text-[#1F2937] mb-6">核心改进建议</h3>
          <div className="space-y-4 mb-6">
            {report.improvements.issues.map((issue, index) => (
              <div key={index} className="flex gap-4 p-5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white rounded-[8px] flex items-center justify-center font-medium text-[14px] flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-[14px] text-[#374151] leading-relaxed pt-1">{issue}</p>
              </div>
            ))}
          </div>

          {/* Urgent Action */}
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500 rounded-[12px] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-[16px] font-medium text-red-900 mb-2">最紧急行动项</h4>
                <p className="text-[14px] text-red-700 leading-relaxed">{report.improvements.urgent_action}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Day 1 Content */}
        <div className="bg-white rounded-[20px] p-8 mb-6 border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h3 className="text-[24px] font-medium text-[#1F2937] mb-6">AI为你生成的首日内容</h3>

          {/* Caption */}
          <div className="mb-6 p-6 bg-[#E9D5FF]/30 rounded-[16px] border border-[#E9D5FF]">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h4 className="text-[14px] font-medium text-[#1F2937]">精选文案</h4>
            </div>
            <p className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-wrap">
              {report.day1Content.caption}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hashtags */}
            <div className="p-5 bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB]">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <h4 className="text-[14px] font-medium text-[#1F2937]">推荐标签</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.day1Content.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-[#E9D5FF] text-[#7C3AED] px-[14px] py-[6px] rounded-full text-[13px] font-medium hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Image & Time */}
            <div className="space-y-4">
              <div className="p-5 bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[#374151]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-[14px] font-medium text-[#1F2937]">图片建议</h4>
                </div>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{report.day1Content.image_suggestion}</p>
              </div>

              <div className="p-5 bg-[#E9D5FF]/30 rounded-[12px] border border-[#E9D5FF]">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-[14px] font-medium text-[#1F2937]">最佳发布时间</h4>
                </div>
                <p className="text-[16px] text-[#7C3AED] font-medium">{report.day1Content.best_time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-[20px] p-12 text-center shadow-[0_8px_24px_rgba(139,92,246,0.2)]">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-[16px] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h3 className="text-[28px] font-semibold text-white mb-4">
            解锁完整30天内容日历
          </h3>
          <p className="text-[16px] text-white/90 mb-8 max-w-xl mx-auto">
            获取AI规划的完整内容策略、精美图片和专业文案
          </p>

          <div className="flex justify-center gap-6 mb-8 text-[13px] text-white/80">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              30天完整规划
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              AI生成图片
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              专业文案库
            </div>
          </div>

          <button className="bg-white text-[#7C3AED] font-medium py-[12px] px-8 rounded-[16px] hover:scale-[1.02] transition-all text-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            立即免费注册解锁
          </button>

          <p className="text-[12px] text-white/70 mt-4">无需信用卡 · 永久免费</p>
        </div>
      </main>
    </div>
  )
}

// Dimension Score Component
function DimensionScore({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="text-center">
      <div className="text-[12px] text-[#9CA3AF] font-medium mb-3">{label}</div>
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="#8B5CF6"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[18px] font-semibold text-[#1F2937]">{score}</div>
        </div>
      </div>
      <div className="text-[11px] text-[#9CA3AF]">/ {maxScore}</div>
    </div>
  )
}
