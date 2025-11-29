/**
 * StrategySection - 策略展示组件 (Slow Lane)
 * 使用SSE订阅AI生成进度,渐进式渲染
 */

'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const CHART_COLORS = [
  '#8DA399', '#d97757', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#EC4899', '#10B981', '#6366F1', '#F97316', '#14B8A6'
]

interface StrategyData {
  strategy_text?: string  // 纯文本策划案(最新格式)
  strategy_plan?: any  // 结构化策划案(旧格式)
  strategy_section?: {
    brand_persona: {
      archetype: string
      one_liner_bio: string
      tone_voice: string
    }
    target_audience: Array<{
      type: 'Main' | 'Secondary'
      description: string
      pain_point: string
    }>
    content_mix_chart: Array<{
      label: string
      percentage: number
    }>
  }
  execution_calendar?: {
    day_1_detail: {
      title: string
      caption: string
      hashtags: string[]
      image_gen_prompt: string
    }
    month_plan: Array<{
      day: number
      theme: string
      idea: string
    }>
  }
}

interface StrategySectionProps {
  auditId: string
  onDataLoaded?: (data: StrategyData) => void
  onDay1Loaded?: (day1: any) => void
  onCalendarLoaded?: (calendar: any) => void
}

export function StrategySection({ auditId, onDataLoaded, onDay1Loaded, onCalendarLoaded }: StrategySectionProps) {
  const [strategy, setStrategy] = useState<StrategyData | null>(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log(`[SSE Client] Establishing connection for audit: ${auditId}`)

    const eventSource = new EventSource(`/api/audit/${auditId}/strategy`)

    // 监听状态更新
    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data)
      setPhase(data.phase)
      setProgress(data.progress)
      console.log(`[SSE] Progress: ${data.progress}% - ${data.phase}`)
    })

    // 监听增量更新 (打字机效果)
    eventSource.addEventListener('partial_update', (e) => {
      const data = JSON.parse(e.data)
      console.log(`[SSE] Partial update - Progress: ${data.progress}%`, data)

      setStrategy(prev => {
        const current = prev || { strategy_section: {}, execution_calendar: {} }
        return {
          ...current,
          strategy_section: {
            ...current.strategy_section,
            ...(data.brand_persona && { brand_persona: data.brand_persona }),
            ...(data.target_audience && { target_audience: data.target_audience }),
            ...(data.content_mix_chart && { content_mix_chart: data.content_mix_chart })
          },
          execution_calendar: {
            ...current.execution_calendar,
            ...(data.day_1_detail && { day_1_detail: data.day_1_detail }),
            ...(data.month_plan && { month_plan: data.month_plan })
          }
        }
      })

      setProgress(data.progress)

      // 触发回调
      if (data.day_1_detail && onDay1Loaded) {
        console.log('[SSE] 触发Day1回调')
        onDay1Loaded(data.day_1_detail)
      }
      if (data.month_plan && onCalendarLoaded) {
        console.log('[SSE] 触发Calendar回调')
        onCalendarLoaded(data.month_plan)
      }
    })

    // 监听完成事件
    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      setStrategy(data)
      setProgress(100)
      console.log(`[SSE] Completed - Generation time: ${data.generation_time_ms}ms`)

      // 触发所有回调 (确保Day1和Calendar数据被传递)
      if (data.execution_calendar?.day_1_detail && onDay1Loaded) {
        console.log('[SSE Complete] 触发Day1回调')
        onDay1Loaded(data.execution_calendar.day_1_detail)
      }
      if (data.execution_calendar?.month_plan && onCalendarLoaded) {
        console.log('[SSE Complete] 触发Calendar回调, length:', data.execution_calendar.month_plan.length)
        onCalendarLoaded(data.execution_calendar.month_plan)
      }

      // 通知父组件数据已加载
      if (onDataLoaded) {
        onDataLoaded(data)
      }

      eventSource.close()
    })

    // 监听心跳
    eventSource.addEventListener('ping', (e) => {
      console.log('[SSE] Heartbeat received')
    })

    // 监听错误
    eventSource.addEventListener('error', (e: any) => {
      console.error('[SSE] Error:', e)

      // 检查是否是数据错误(而非网络错误)
      if (e.data) {
        try {
          const errorData = JSON.parse(e.data)
          if (errorData.error === 'AI_GENERATION_FAILED' && errorData.message.includes('Diagnosis data not ready')) {
            setError('诊断数据尚未准备好,请稍候片刻再刷新页面')
            eventSource.close()
            return
          }
        } catch {}
      }

      setError('连接中断,正在尝试重连...')
      eventSource.close()

      // 降级到轮询
      setTimeout(() => {
        fallbackToPolling(auditId, setStrategy, setProgress, setError)
      }, 2000)
    })

    // 清理函数
    return () => {
      console.log('[SSE] Closing connection')
      eventSource.close()
    }
  }, [auditId])

  // 加载状态 - 每个模块都显示骨架屏
  if (!strategy) {
    return (
      <div className="space-y-8">
        {/* 品牌人设骨架屏 */}
        <SkeletonCard title="品牌人设" />

        {/* 内容配比骨架屏 */}
        <SkeletonCard title="内容配比策略" />

        {/* 目标受众骨架屏 */}
        <SkeletonCard title="目标受众" />

        {/* AI思考动画 (作为悬浮提示) */}
        <AIThinkingAnimation phase={phase} progress={progress} error={error} />
      </div>
    )
  }

  // 渲染策略内容
  return (
    <div className="space-y-8">
      {/* 品牌人设 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          品牌人设
        </h2>
        <div className="bg-sand-50 border border-sand-200 p-6">
          <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
            {strategy.strategy_section?.brand_persona?.archetype}
          </h3>
          <p className="font-sans text-base text-charcoal-800 leading-relaxed mb-4">
            {strategy.strategy_section?.brand_persona?.tone_voice}
          </p>
          <div className="bg-white border border-sand-200 p-4">
            <p className="font-sans text-xs text-charcoal-600 mb-1 font-semibold">
              优化后的简介:
            </p>
            <p className="font-sans text-sm text-charcoal-900">
              {strategy.strategy_section?.brand_persona?.one_liner_bio}
            </p>
          </div>
        </div>
      </div>

      {/* 内容配比 */}
      {strategy.strategy_section?.content_mix_chart && (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            内容配比策略
          </h2>
          <ContentMixPieChart data={strategy.strategy_section.content_mix_chart} />
        </div>
      )}

      {/* 目标受众 */}
      {strategy.strategy_section?.target_audience && (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            目标受众
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {strategy.strategy_section.target_audience.map((audience: any, i: number) => (
              <div key={i} className="bg-sand-50 border border-sand-200 p-6">
                <span className="inline-block bg-charcoal-900 text-white px-3 py-1.5 font-sans text-xs font-bold mb-3">
                  {audience.type}
                </span>
                <h4 className="font-serif text-lg font-bold text-charcoal-900 mb-2">
                  {audience.description}
                </h4>
                <p className="font-sans text-sm text-charcoal-600">
                  <span className="font-semibold">痛点:</span> {audience.pain_point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 骨架屏卡片组件 - 双层转圈动画
 */
function SkeletonCard({ title }: { title: string }) {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
        {title}
      </h2>
      <div className="flex items-center justify-center h-48">
        {/* 双层转圈动画 */}
        <div className="relative w-20 h-20">
          {/* 外圈 - 顺时针慢速 */}
          <div
            className="absolute inset-0 border-4 border-sand-200 rounded-full border-t-sage"
            style={{ animation: 'spin 2s linear infinite' }}
          ></div>
          {/* 内圈 - 逆时针快速 */}
          <div
            className="absolute inset-2 border-4 border-sand-200 rounded-full border-b-charcoal-900"
            style={{ animation: 'spin 1s linear infinite reverse' }}
          ></div>
        </div>
      </div>
    </div>
  )
}

/**
 * 内容配比饼图组件
 */
function ContentMixPieChart({ data }: { data: Array<{ label: string; percentage: number }> }) {
  // 转换数据格式
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.percentage
  }))

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      {/* 左侧饼图 */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 右侧图例 */}
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            ></div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm font-bold text-charcoal-900">
                  {item.label}
                </span>
                <span className="font-sans text-sm text-charcoal-600">
                  {item.percentage}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AI思考动画组件
 */
function AIThinkingAnimation({ phase, progress, error }: {
  phase: string
  progress: number
  error: string | null
}) {
  const PHASE_MESSAGES: Record<string, string> = {
    loading: '正在加载数据...',
    analyzing: '正在分析账号特征...',
    generating_persona: '正在设计品牌人设...',
    building_calendar: '正在规划30天内容日历...',
    finalizing: '正在完成策略生成...'
  }

  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <div className="text-center max-w-md mx-auto">
        {/* 动画圆环 */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-sand-200 rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-charcoal-900 rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-sans text-lg font-bold text-charcoal-900">
              {progress}%
            </span>
          </div>
        </div>

        {/* 状态文字 */}
        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">
          AI is crafting your strategy...
        </h3>
        <p className="font-sans text-sm text-charcoal-600 mb-4">
          {PHASE_MESSAGES[phase] || '处理中...'}
        </p>

        {/* 进度条 */}
        <div className="w-full bg-sand-100 h-2 overflow-hidden mb-4">
          <div
            className="bg-sage h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {error && (
          <div className="bg-terracotta-light border-l-4 border-terracotta p-3 mb-4">
            <p className="font-sans text-xs text-charcoal-800">{error}</p>
          </div>
        )}

        <p className="font-sans text-xs text-charcoal-600">
          This usually takes 15-30 seconds
        </p>
      </div>
    </div>
  )
}

/**
 * 降级到轮询的备用方案
 */
async function fallbackToPolling(
  auditId: string,
  setStrategy: Function,
  setProgress: Function,
  setError: Function
) {
  console.log('[Polling] Starting fallback polling')
  setError(null)

  let attempts = 0
  const maxAttempts = 60  // 最多2分钟

  const poll = async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}/status`)

      if (!res.ok) {
        throw new Error('Polling failed')
      }

      const data = await res.json()

      setProgress(data.progress || 0)

      if (data.status === 'completed' && data.strategy_section) {
        setStrategy({
          strategy_section: data.strategy_section,
          execution_calendar: data.execution_calendar
        })
        console.log('[Polling] Strategy received')
        return
      }

      if (data.status === 'failed') {
        setError('AI生成失败,请刷新页面重试')
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000)  // 每2秒轮询一次
      } else {
        setError('生成超时,请刷新页面重试')
      }

    } catch (err) {
      console.error('[Polling] Error:', err)
      setError('连接失败,请检查网络')
    }
  }

  poll()
}
