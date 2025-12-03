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
  onProgressUpdate?: (progress: number) => void
}

export function StrategySection({ auditId, onDataLoaded, onDay1Loaded, onCalendarLoaded, onProgressUpdate }: StrategySectionProps) {
  // 每个模块独立状态
  const [persona, setPersona] = useState<any>(null)
  const [contentMix, setContentMix] = useState<any>(null)
  const [audience, setAudience] = useState<any>(null)

  // 加载状态
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [loadingContentMix, setLoadingContentMix] = useState(false)
  const [loadingAudience, setLoadingAudience] = useState(false)

  // 错误状态
  const [error, setError] = useState<string | null>(null)

  // 1. 加载 Brand Persona（优先级最高，立即加载）
  useEffect(() => {
    if (persona || loadingPersona) return

    console.log('[Strategy] 📤 Loading Brand Persona...')
    setLoadingPersona(true)

    fetch(`/api/audit/${auditId}/strategy/persona`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[Strategy] ✅ Brand Persona loaded')
          setPersona(data.brand_persona)
          if (onProgressUpdate) onProgressUpdate(20)
        } else {
          throw new Error(data.message || 'Failed to load persona')
        }
      })
      .catch(err => {
        console.error('[Strategy] ❌ Brand Persona failed:', err)
        setError(err.message)
      })
      .finally(() => setLoadingPersona(false))
  }, [auditId, persona, loadingPersona])

  // 2. Persona完成后，并发加载 Content Mix 和 Audience
  useEffect(() => {
    if (!persona || contentMix || loadingContentMix) return

    console.log('[Strategy] 📤 Loading Content Mix...')
    setLoadingContentMix(true)

    fetch(`/api/audit/${auditId}/strategy/content-mix`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[Strategy] ✅ Content Mix loaded')
          setContentMix(data.content_mix_chart)
          if (onProgressUpdate) onProgressUpdate(40)
        } else {
          throw new Error(data.message || 'Failed to load content mix')
        }
      })
      .catch(err => {
        console.error('[Strategy] ❌ Content Mix failed:', err)
      })
      .finally(() => setLoadingContentMix(false))
  }, [auditId, persona, contentMix, loadingContentMix])

  useEffect(() => {
    if (!persona || audience || loadingAudience) return

    console.log('[Strategy] 📤 Loading Target Audience...')
    setLoadingAudience(true)

    fetch(`/api/audit/${auditId}/strategy/audience`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[Strategy] ✅ Target Audience loaded')
          setAudience(data.target_audience)
          if (onProgressUpdate) onProgressUpdate(60)
        } else {
          throw new Error(data.message || 'Failed to load audience')
        }
      })
      .catch(err => {
        console.error('[Strategy] ❌ Target Audience failed:', err)
      })
      .finally(() => setLoadingAudience(false))
  }, [auditId, persona, audience, loadingAudience])

  // 3. 通知父组件数据已加载（当所有模块完成时）
  useEffect(() => {
    if (persona && contentMix && audience && onDataLoaded) {
      console.log('[Strategy] ✅ All modules loaded, notifying parent')
      onDataLoaded({
        strategy_section: {
          brand_persona: persona,
          content_mix_chart: contentMix,
          target_audience: audience
        }
      })
      if (onProgressUpdate) onProgressUpdate(100)
    }
  }, [persona, contentMix, audience])

  // 加载状态 - 初始连接中
  if (!persona && loadingPersona) {
    return <AIThinkingAnimation message="Generating brand persona..." />
  }

  // 渲染策略内容 (渐进式显示)
  return (
    <div className="space-y-8 mb-8">
      {/* 品牌人设 - 数据或骨架屏 */}
      {persona ? (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Brand Persona
          </h2>
          <div className="bg-sand-50 border border-sand-200 p-6">
            <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
              {persona.archetype}
            </h3>
            <p className="font-sans text-base text-charcoal-800 leading-relaxed mb-4">
              {persona.tone_voice}
            </p>
            <div className="bg-white border border-sand-200 p-4">
              <p className="font-sans text-xs text-charcoal-600 mb-1 font-semibold">
                Optimized Bio:
              </p>
              <p className="font-sans text-sm text-charcoal-900">
                {persona.one_liner_bio}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <SkeletonCardLarge title="Brand Persona" message="Generating brand persona..." />
      )}

      {/* 内容配比 - 数据或骨架屏 */}
      {contentMix ? (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Content Mix Strategy
          </h2>
          <ContentMixPieChart data={contentMix} />
        </div>
      ) : persona ? (
        <SkeletonCardLarge title="Content Mix Strategy" message="Generating content mix strategy..." />
      ) : null}

      {/* 目标受众 - 数据或骨架屏 */}
      {audience ? (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Target Audience Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {audience.map((audienceItem: any, i: number) => (
              <div key={i} className="bg-sand-50 border border-sand-200 p-6">
                <span className="inline-block bg-charcoal-900 text-white px-3 py-1.5 font-sans text-xs font-bold mb-3">
                  {audienceItem.type === 'Main' ? 'Main' : 'Secondary'}
                </span>
                <h4 className="font-serif text-lg font-bold text-charcoal-900 mb-2">
                  {audienceItem.description}
                </h4>
                <p className="font-sans text-sm text-charcoal-600">
                  <span className="font-semibold">Pain Point:</span> {audienceItem.pain_point}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : persona ? (
        <SkeletonCardLarge title="Target Audience Analysis" message="Analyzing target audience..." />
      ) : null}
    </div>
  )
}

/**
 * 大号骨架屏 - 双层转圈动画
 */
function SkeletonCardLarge({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">{title}</h2>

      {/* 双层转圈动画 */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-56 h-56">
          <div className="absolute inset-0 border-[14px] border-sand-200 rounded-full"></div>
          <div className="absolute inset-0 border-[14px] border-transparent border-t-[#6fa88e] rounded-full animate-spin"></div>
          <div className="absolute inset-6 border-[12px] border-sand-100 rounded-full"></div>
          <div className="absolute inset-6 border-[12px] border-transparent border-t-[#e06744] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-4 h-4 bg-charcoal-900 rounded-full mb-2 mx-auto animate-bounce"></div>
              <p className="font-sans text-xs text-charcoal-600 font-semibold">AI Analyzing</p>
            </div>
          </div>
        </div>
        <p className="font-serif text-lg font-bold text-charcoal-900 mt-8">{message}</p>
      </div>
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
    <div className="flex flex-col gap-8">
      {/* 饼图 - 移除标签,避免截断 */}
      <div className="flex justify-center">
        <div className="w-full max-w-md h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E4D7',
                  borderRadius: '4px',
                  padding: '8px 12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 图例列表 - 放在饼图下方 */}
      <div className="grid md:grid-cols-2 gap-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-sand-50 border border-sand-200 p-4">
            <div
              className="w-5 h-5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            ></div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm font-bold text-charcoal-900 mb-1 truncate">
                {item.label}
              </div>
              <div className="font-sans text-2xl font-bold text-charcoal-900">
                {item.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * AI思考动画组件 - 简化版
 */
function AIThinkingAnimation({ message }: { message: string }) {
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
        </div>

        {/* 状态文字 */}
        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">
          AI is crafting your strategy...
        </h3>
        <p className="font-sans text-sm text-charcoal-600 mb-4">
          {message}
        </p>

        <p className="font-sans text-xs text-charcoal-600">
          This usually takes 15-30 seconds
        </p>
      </div>
    </div>
  )
}

