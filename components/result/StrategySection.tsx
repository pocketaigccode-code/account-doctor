/**
 * StrategySection - 策略展示组件 (Slow Lane)
 * 使用SSE订阅AI生成进度,渐进式渲染
 */

'use client'

import { useEffect, useState } from 'react'
import { FullStrategyPlan } from './FullStrategyPlan'

interface StrategyData {
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
  strategy_plan?: any  // 新格式的完整策划案
}

interface StrategySectionProps {
  auditId: string
  onDataLoaded?: (data: StrategyData) => void
}

export function StrategySection({ auditId, onDataLoaded }: StrategySectionProps) {
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

    // 监听完成事件
    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      setStrategy(data)
      setProgress(100)
      console.log(`[SSE] Completed - Generation time: ${data.generation_time_ms}ms`)

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

  // 加载状态
  if (!strategy) {
    return <AIThinkingAnimation phase={phase} progress={progress} error={error} />
  }

  // 渲染策略内容
  // 判断是否有完整策划案(新格式)或简化版(旧格式)
  if (strategy.strategy_plan) {
    // 新格式: 完整策划案
    return <FullStrategyPlan plan={strategy.strategy_plan} />
  }

  // 旧格式: 简化版策略
  return (
    <div className="space-y-8">
      {/* 品牌人设 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          Your Brand Persona
        </h2>
        <div className="bg-sand-50 border border-sand-200 p-6">
          <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
            {strategy.strategy_section?.brand_persona?.archetype || 'The Community Hub'}
          </h3>
          <p className="font-sans text-base text-charcoal-800 leading-relaxed mb-4">
            {strategy.strategy_section?.brand_persona?.tone_voice || '温暖、真诚、接地气'}
          </p>
          <div className="bg-white border border-sand-200 p-4">
            <p className="font-sans text-xs text-charcoal-600 mb-1 font-semibold">
              Optimized Bio:
            </p>
            <p className="font-sans text-sm text-charcoal-900">
              {strategy.strategy_section?.brand_persona?.one_liner_bio || '你的社区咖啡驿站 ☕'}
            </p>
          </div>
        </div>
      </div>

      {/* 内容配比 */}
      {strategy.strategy_section?.content_mix_chart && (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Content Mix Strategy
          </h2>
          <div className="space-y-4">
            {strategy.strategy_section.content_mix_chart.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-sans text-base font-bold text-charcoal-900">
                    {item.label}
                  </h3>
                  <span className="font-sans text-sm text-charcoal-600">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-sand-100 h-3">
                  <div
                    className="bg-sage h-3 transition-all duration-1000"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 目标受众 */}
      {strategy.strategy_section?.target_audience && (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Target Audience
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
                  <span className="font-semibold">Pain Point:</span> {audience.pain_point}
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
