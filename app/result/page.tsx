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

  useEffect(() => {
    if (!reportId) {
      setError('缺少报告ID')
      setLoading(false)
      return
    }

    // 获取报告数据
    fetch(`/api/analyze?id=${reportId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setReport(data)
        }
      })
      .catch((err) => {
        setError('获取报告失败')
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [reportId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">正在加载诊断报告...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600">{error || '未找到报告'}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const score = report.scoreBreakdown.total

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            AccountDoctor
            <span className="ml-2 text-sm font-normal text-gray-500">
              @{report.username} 的诊断报告
            </span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* 评分卡片 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">账号健康度评分</h2>
            <div className="relative inline-block">
              <div
                className={`text-7xl font-bold ${
                  score >= 80
                    ? 'text-green-600'
                    : score >= 60
                    ? 'text-blue-600'
                    : score >= 40
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {score}
              </div>
              <div className="text-2xl text-gray-400 mt-2">/ 100</div>
            </div>
            <div className="mt-4 inline-block px-6 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
              {report.scoreBreakdown.grade}
            </div>
          </div>

          {/* 各维度得分 */}
          <div className="grid md:grid-cols-5 gap-4 mt-8">
            <ScoreDimension
              label="内容质量"
              score={report.scoreBreakdown.content_quality}
              maxScore={30}
            />
            <ScoreDimension
              label="互动健康"
              score={report.scoreBreakdown.engagement_health}
              maxScore={25}
            />
            <ScoreDimension
              label="账号活力"
              score={report.scoreBreakdown.account_vitality}
              maxScore={20}
            />
            <ScoreDimension
              label="增长潜力"
              score={report.scoreBreakdown.growth_potential}
              maxScore={15}
            />
            <ScoreDimension
              label="受众匹配"
              score={report.scoreBreakdown.audience_match}
              maxScore={10}
            />
          </div>
        </div>

        {/* 改进建议 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">核心改进建议</h3>
          <div className="space-y-4">
            {report.improvements.issues.map((issue, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <p className="text-gray-700 flex-1">{issue}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🚨</div>
              <div>
                <h4 className="font-bold text-red-900 mb-2">最紧急行动项</h4>
                <p className="text-red-700">{report.improvements.urgent_action}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Day 1 内容 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            ✨ AI为你生成的第一天内容
          </h3>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">📝 文案</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{report.day1Content.caption}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🏷️ 推荐标签</h4>
              <div className="flex flex-wrap gap-2">
                {report.day1Content.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">📸 图片建议</h4>
              <p className="text-gray-700">{report.day1Content.image_suggestion}</p>
              <h4 className="font-semibold text-gray-900 mt-4 mb-2">⏰ 最佳发布时间</h4>
              <p className="text-purple-600 font-semibold">{report.day1Content.best_time}</p>
            </div>
          </div>
        </div>

        {/* 30天日历预览 */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📅 30天内容日历</h3>
          <p className="text-gray-600 mb-6">完整的内容规划已为你准备好!</p>
          <div className="text-center py-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
            <div className="text-6xl mb-4">🔒</div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">解锁完整30天内容日历</h4>
            <p className="text-gray-600 mb-6">注册即可获得完整的内容规划、图片和文案</p>
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl text-lg hover:shadow-lg transition-all">
              立即注册解锁
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => (window.location.href = '/')}
            className="text-purple-600 hover:underline"
          >
            ← 返回首页
          </button>
        </div>
      </main>
    </div>
  )
}

// 评分维度组件
function ScoreDimension({
  label,
  score,
  maxScore,
}: {
  label: string
  score: number
  maxScore: number
}) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="text-center">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="relative w-20 h-20 mx-auto">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - percentage / 100)}`}
            className="text-purple-600"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">/ {maxScore}</div>
    </div>
  )
}
