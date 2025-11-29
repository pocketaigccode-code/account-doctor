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
  const [strategyData, setStrategyData] = useState<any>(null)  // 策略数据(Persona+Mix+Audience)
  const [day1Data, setDay1Data] = useState<any>(null)  // Day1内容
  const [calendarData, setCalendarData] = useState<any>(null)  // 30天日历
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiFailed, setAiFailed] = useState(false)

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
        } else {
          // 如果有profile_snapshot,说明数据已准备好
          if (data.profile_snapshot) {
            console.log('✅ [结果页] Profile Snapshot:', data.profile_snapshot)
            console.log('📊 [结果页] Diagnosis Card:', data.diagnosis_card)
            setInstantData(data.profile_snapshot)
            setDiagnosisData(data.diagnosis_card)

            // 检查AI是否失败
            if (data.status === 'ai_failed') {
              console.warn('⚠️ [结果页] AI分析失败,但显示基础数据')
              setAiFailed(true)
            }
          } else {
            setError('数据未准备好,请稍后刷新')
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

  // 阶段2: SSE连接获取AI诊断数据 (如果诊断数据未就绪)
  useEffect(() => {
    if (!instantData || diagnosisData) return

    console.log('🔄 [结果页] 建立SSE连接获取诊断数据...')

    const sse = new EventSource(`/api/audit/${auditId}/diagnosis`)

    sse.addEventListener('status', (e) => {
      const data = JSON.parse(e.data)
      console.log(`📡 [结果页] SSE状态: ${data.phase}, 进度: ${data.progress}%`)
    })

    sse.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      console.log('✅ [结果页] 诊断数据已就绪!', data)

      // 更新诊断数据
      setInstantData(data.profile_snapshot)
      setDiagnosisData(data.diagnosis_card)
      sse.close()
    })

    sse.addEventListener('error', (e) => {
      console.error('❌ [结果页] SSE连接错误')
      setAiFailed(true)
      sse.close()
    })

    sse.addEventListener('ping', () => {
      console.log('💓 [结果页] SSE心跳')
    })

    return () => {
      console.log('🔌 [结果页] 关闭SSE连接')
      sse.close()
    }
  }, [auditId, instantData, diagnosisData])

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
        ) : aiFailed ? (
          <DiagnosisCardAIFailed />
        ) : (
          <DiagnosisCardSkeleton />
        )}

        {/* Slow Lane Components - SSE异步加载 */}
        {diagnosisData && (
          <StrategySection
            auditId={auditId}
            onDataLoaded={setStrategyData}
            onDay1Loaded={setDay1Data}
            onCalendarLoaded={setCalendarData}
          />
        )}

        {/* Day 1内容预览 - 独立模块 (Audience显示后立即显示骨架屏) */}
        {diagnosisData && strategyData?.target_audience && (
          <>
            {console.log('[Day1渲染] day1Data存在?', !!day1Data, day1Data?.title)}
            {day1Data ? (
              <Day1Preview day1={day1Data} />
            ) : (
              <Day1Skeleton />
            )}
          </>
        )}

        {/* 30天日历 - 独立模块 (Day1显示后立即显示骨架屏) */}
        {diagnosisData && day1Data && (
          <>
            {console.log('[Calendar渲染] calendarData存在?', !!calendarData, calendarData?.length)}
            {calendarData ? (
              <ExecutionCalendar calendar={{ day_1_detail: day1Data, month_plan: calendarData }} />
            ) : (
              <CalendarSkeleton />
            )}
          </>
        )}
      </main>
    </div>
  )
}

/**
 * AI分析失败提示卡片
 */
function DiagnosisCardAIFailed() {
  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">诊断结果</h2>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-yellow-50 border-2 border-yellow-600 flex items-center justify-center mx-auto mb-4 rounded-full">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">AI 分析失败</h3>
        <p className="font-sans text-sm text-charcoal-600 mb-6">无法生成诊断评分,请返回首页重新诊断</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-6 hover:bg-charcoal-800 transition-colors"
        >
          返回首页重试
        </button>
      </div>
    </div>
  )
}

/**
 * Day1内容预览组件
 */
function Day1Preview({ day1 }: { day1: any }) {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
        内容预览与分析
      </h2>

      <div className="grid md:grid-cols-2 gap-10">
        {/* 左: 图片预览 */}
        <div>
          <div className="relative aspect-square bg-gradient-to-br from-sand-100 to-sand-200 border border-sand-200 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-24 h-24 text-charcoal-600 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="relative z-10 bg-white border-2 border-charcoal-900 px-6 py-3">
              <span className="font-serif text-xl font-bold text-charcoal-900">LOGO</span>
            </div>
          </div>
          <div className="mt-4 bg-sand-50 border border-sand-200 p-4">
            <h4 className="font-sans text-xs font-bold text-charcoal-900 mb-2">生图提示词</h4>
            <p className="font-sans text-xs text-charcoal-800 leading-relaxed">
              {day1.image_gen_prompt}
            </p>
          </div>
        </div>

        {/* 右: 文案 */}
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">生成文案</h3>
            <div className="bg-sand-50 border border-sand-200 p-5">
              <p className="font-sans text-sm text-charcoal-900 leading-relaxed whitespace-pre-wrap">
                {day1.caption}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">推荐标签</h3>
            <div className="flex flex-wrap gap-2">
              {day1.hashtags.map((tag: string, i: number) => (
                <span key={i} className="bg-sand-100 border border-sand-200 px-3 py-1.5 font-sans text-xs text-charcoal-900">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-sage/10 border-l-4 border-sage p-5">
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">AI 分析</h4>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              这篇内容融合了品牌故事与行动召唤,通过真诚的语调建立情感连接。发布时最佳时间为周二或周三的18:00-20:00,此时段受众活跃度最高。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Day1骨架屏
 */
function Day1Skeleton() {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <div className="h-8 bg-sand-200 w-1/3 mb-8 animate-pulse"></div>

      {/* 双层转圈动画 */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 border-[14px] border-sand-200 rounded-full"></div>
          <div className="absolute inset-0 border-[14px] border-transparent border-t-[#6fa88e] rounded-full animate-spin"></div>
          <div className="absolute inset-5 border-[12px] border-sand-100 rounded-full"></div>
          <div className="absolute inset-5 border-[12px] border-transparent border-t-[#e06744] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-charcoal-900 rounded-full animate-bounce"></div>
          </div>
        </div>
        <p className="font-serif text-xl font-bold text-charcoal-900 mt-8 mb-2">正在创作Day 1爆款内容</p>
        <p className="font-sans text-sm text-charcoal-600">AI正在为您撰写精致文案与标签...</p>
      </div>

      {/* 骨架网格 */}
      <div className="grid md:grid-cols-2 gap-10 mt-8 opacity-20 animate-pulse">
        <div className="aspect-square bg-sand-200"></div>
        <div className="space-y-4">
          <div className="h-6 bg-sand-200 w-full"></div>
          <div className="h-4 bg-sand-200 w-3/4"></div>
          <div className="h-4 bg-sand-200 w-full"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * 日历骨架屏
 */
function CalendarSkeleton() {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <div className="h-8 bg-sand-200 w-1/3 mb-8 animate-pulse"></div>

      {/* 双层转圈动画 */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-40 h-40">
          {/* 外圈 (更粗更明显) */}
          <div className="absolute inset-0 border-[14px] border-sand-200 rounded-full"></div>
          <div className="absolute inset-0 border-[14px] border-transparent border-t-[#6fa88e] rounded-full animate-spin"></div>
          {/* 内圈 (更粗更明显) */}
          <div className="absolute inset-5 border-[12px] border-sand-100 rounded-full"></div>
          <div className="absolute inset-5 border-[12px] border-transparent border-t-[#e06744] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          {/* 中心 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-charcoal-900 rounded-full animate-bounce"></div>
          </div>
        </div>
        <p className="font-serif text-xl font-bold text-charcoal-900 mt-8 mb-2">正在生成30天内容日历</p>
        <p className="font-sans text-sm text-charcoal-600">AI正在为您规划完整的月度内容策略...</p>
      </div>

      {/* 日历骨架网格 */}
      <div className="grid grid-cols-7 gap-4 mt-8 opacity-30 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border border-sand-200 p-3 bg-sand-50">
            <div className="h-3 bg-sand-200 w-12 mb-2"></div>
            <div className="aspect-square bg-sand-200"></div>
          </div>
        ))}
      </div>
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

      {/* 中心双层转圈动画 */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-48 h-48">
          {/* 外圈 */}
          <div className="absolute inset-0 border-[14px] border-sand-200 rounded-full"></div>
          <div className="absolute inset-0 border-[14px] border-transparent border-t-[#6fa88e] rounded-full animate-spin"></div>
          {/* 内圈 */}
          <div className="absolute inset-6 border-[12px] border-sand-100 rounded-full"></div>
          <div className="absolute inset-6 border-[12px] border-transparent border-t-[#e06744] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          {/* 中心 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-4 h-4 bg-charcoal-900 rounded-full mb-2 mx-auto animate-bounce"></div>
              <p className="font-sans text-xs text-charcoal-600 font-semibold">AI 分析中</p>
            </div>
          </div>
        </div>
        <p className="font-serif text-xl font-bold text-charcoal-900 mt-8 mb-2">正在生成诊断评分</p>
        <p className="font-sans text-sm text-charcoal-600">AI正在分析账号的5大维度...</p>
      </div>

      {/* 骨架内容 */}
      <div className="flex items-start gap-16 mt-12 opacity-20 animate-pulse">
        <div className="flex-shrink-0 text-center">
          <div className="w-44 h-44 rounded-full border-12 border-sand-200 mb-4"></div>
          <div className="inline-block bg-sand-100 px-4 py-1.5 border border-sand-200">
            <span className="font-sans text-sm font-semibold text-charcoal-600">分析中...</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-start bg-sand-50 border border-sand-200 p-3">
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
