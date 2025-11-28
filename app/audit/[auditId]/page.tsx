/**
 * 新架构结果页 - 真正的双速响应
 * 阶段1: 立即渲染即时数据 (用户信息、统计数据)
 * 阶段2: 轮询AI增强数据 (诊断分数、建议)
 */

'use client'

import { use, useEffect, useState } from 'react'
import { ProfileSnapshot } from '@/components/result/ProfileSnapshot'
import { StrategySection } from '@/components/result/StrategySection'
import { ExecutionCalendar } from '@/components/result/ExecutionCalendar'

interface PageProps {
  params: Promise<{ auditId: string }>
}

export default function AuditResultPage({ params }: PageProps) {
  // Next.js 16: params是Promise,需要unwrap
  const { auditId } = use(params)
  const [instantData, setInstantData] = useState<any>(null)
  const [diagnosisData, setDiagnosisData] = useState<any>(null)
  const [slowData, setSlowData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingCount, setPollingCount] = useState(0)

  // 阶段1: 获取即时数据
  useEffect(() => {
    console.log('📄 [结果页] 开始加载 auditId:', auditId)

    fetch(`/api/audit/${auditId}/status`)
      .then(res => res.json())
      .then(data => {
        console.log('📥 [结果页] 状态API响应:', data)

        if (data.error) {
          console.error('❌ [结果页] 错误:', data.error, data.message)
          setError(data.ui_message || data.message)
        } else if (data.status === 'ai_failed') {
          // AI分析失败
          setError('AI分析失败,请返回首页重新诊断')
        } else {
          // 如果有profile_snapshot,说明数据已准备好
          if (data.profile_snapshot) {
            console.log('✅ [结果页] Profile Snapshot:', data.profile_snapshot)
            console.log('📊 [结果页] Diagnosis Card:', data.diagnosis_card)
            setInstantData(data.profile_snapshot)
            setDiagnosisData(data.diagnosis_card)
          }
        }
      })
      .catch(err => {
        console.error('❌ [结果页] 请求失败:', err)
        setError('加载失败: ' + err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [auditId])

  // 阶段2: 轮询AI增强数据 (如果诊断数据未就绪)
  useEffect(() => {
    if (!instantData || diagnosisData || pollingCount >= 10) return

    console.log('🔄 [结果页] 开始轮询AI增强数据...')

    const pollInterval = setInterval(() => {
      console.log(`🔄 [结果页] 轮询第 ${pollingCount + 1} 次...`)

      fetch(`/api/audit/${auditId}/status`)
        .then(res => res.json())
        .then(data => {
          console.log('📥 [结果页] 轮询响应:', data)

          if (data.diagnosis_card) {
            console.log('✅ [结果页] AI增强数据已就绪!')
            console.log('📊 [结果页] 更新后的 Diagnosis Card:', data.diagnosis_card)

            // AI增强数据已就绪
            setInstantData(data.profile_snapshot)  // 更新完整数据
            setDiagnosisData(data.diagnosis_card)
            clearInterval(pollInterval)
          }
          setPollingCount(prev => prev + 1)
        })
        .catch(err => {
          console.error('❌ [结果页] 轮询失败:', err)
        })
    }, 2000)  // 每2秒轮询一次

    return () => clearInterval(pollInterval)
  }, [auditId, instantData, diagnosisData, pollingCount])

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-sand-200 border-t-charcoal-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-sans text-sm text-charcoal-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !instantData) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white border border-sand-200 p-10 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 bg-terracotta-light border border-terracotta flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">加载失败</h2>
          <p className="font-sans text-sm text-charcoal-600 mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-6 hover:bg-charcoal-800 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-5xl mx-auto px-8 py-5 flex justify-between items-center">
          <h1 className="font-serif text-charcoal-900 text-xl font-bold">AccountDoctor</h1>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-charcoal-600 hover:text-charcoal-900 text-sm font-sans font-medium transition-colors"
          >
            返回首页
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* 阶段1: 即时数据 - 立即渲染 */}
        <ProfileSnapshot data={instantData} />

        {/* 阶段2: AI增强数据 - 渐进式显示 */}
        {diagnosisData ? (
          <DiagnosisCard data={diagnosisData} />
        ) : (
          <DiagnosisCardSkeleton />
        )}

        {/* Slow Lane Components - SSE异步加载 (等待诊断数据准备好后再加载) */}
        {diagnosisData && <StrategySection auditId={auditId} onDataLoaded={setSlowData} />}

        {/* 30天日历 - Slow Lane完成后显示 */}
        {slowData?.execution_calendar && (
          <ExecutionCalendar calendar={slowData.execution_calendar} />
        )}
      </main>
    </div>
  )
}

/**
 * DiagnosisCard骨架屏
 */
function DiagnosisCardSkeleton() {
  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">诊断结果</h2>

      <div className="flex items-start gap-16">
        {/* 左: 评分圆环骨架 */}
        <div className="flex-shrink-0 text-center">
          <div className="relative w-44 h-44 mb-4 animate-pulse">
            <div className="w-44 h-44 rounded-full border-12 border-sand-200"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-charcoal-300 border-t-charcoal-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="inline-block bg-sand-100 px-4 py-1.5 border border-sand-200 animate-pulse">
            <span className="font-sans text-sm font-semibold text-charcoal-600">分析中...</span>
          </div>
        </div>

        {/* 右: 问题列表骨架 */}
        <div className="flex-1">
          <div className="h-6 bg-sand-100 w-3/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-sand-50 w-full mb-6 animate-pulse"></div>

          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-start bg-sand-50 border border-sand-200 p-3 animate-pulse">
                <div className="flex-shrink-0 w-6 h-6 bg-sand-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-sand-200 w-full"></div>
                  <div className="h-4 bg-sand-200 w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * DiagnosisCard组件 (诊断卡片)
 */
function DiagnosisCard({ data }: { data: any }) {
  const { score, summary_title, key_issues } = data

  const getScoreColor = (s: number) => {
    if (s >= 80) return { color: '#8DA399', label: '优秀' }
    if (s >= 60) return { color: '#3B82F6', label: '良好' }
    if (s >= 40) return { color: '#F59E0B', label: '待改进' }
    return { color: '#d97757', label: '警戒' }
  }

  const scoreInfo = getScoreColor(score)

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">诊断结果</h2>

      <div className="flex items-start gap-16">
        {/* 左: 评分圆环 */}
        <div className="flex-shrink-0 text-center">
          <div className="relative w-44 h-44 mb-4">
            <svg className="transform -rotate-90 w-44 h-44">
              <circle cx="88" cy="88" r="80" stroke="#e6e2d6" strokeWidth="12" fill="none" />
              <circle
                cx="88"
                cy="88"
                r="80"
                stroke={scoreInfo.color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-serif text-5xl font-bold text-charcoal-900">{score}</div>
              <div className="font-sans text-sm text-charcoal-600 mt-1">/ 100</div>
            </div>
          </div>
          <div className="inline-block bg-sand-100 px-4 py-1.5 border border-sand-200">
            <span className="font-sans text-sm font-semibold text-charcoal-900">{scoreInfo.label}</span>
          </div>
        </div>

        {/* 右: 问题列表 */}
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
            {summary_title}
          </h3>
          <p className="font-sans text-sm text-charcoal-600 mb-6">
            基于我们的分析,以下是需要改进的关键领域:
          </p>

          <div className="space-y-3">
            {key_issues.map((issue: string, index: number) => (
              <div
                key={index}
                className="flex gap-3 items-start bg-sand-50 border border-sand-200 p-3"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-terracotta text-white flex items-center justify-center font-sans text-xs font-bold">
                  {index + 1}
                </div>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed flex-1">
                  {issue}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
