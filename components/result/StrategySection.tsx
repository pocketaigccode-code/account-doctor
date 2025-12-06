/**
 * StrategySection - 策略展示组件 (Slow Lane)
 * 使用SSE订阅AI生成进度,渐进式渲染
 */

'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { BrandPersonaCard } from './BrandPersonaCard'
import { InstagramProfileMockup } from '../mockup/InstagramProfileMockup'
import { AILoadingAnimation } from '../loading/AILoadingAnimation'

const CHART_COLORS = [
  '#8DA399', '#d97757', '#3B82F6', '#F59E0B', '#8B5CF6',
  '#EC4899', '#10B981', '#6366F1', '#F97316', '#14B8A6'
]

/**
 * Generate dynamic analysis explanation based on real user data
 */
function generateBrandAnalysis(
  profileData: any,
  diagnosisData: any,
  persona: any
): string {
  if (!profileData || !persona) {
    return "Our AI analyzed your profile to create this personalized brand positioning."
  }

  const parts: string[] = []

  // Mention what we analyzed
  parts.push(`Our AI analyzed your bio "${profileData.handle || 'account'}"`)

  if (profileData.category_label) {
    parts.push(`and identified you as a ${profileData.category_label}`)
  }

  // Mention specific insights from diagnosis
  if (diagnosisData?.key_issues && diagnosisData.key_issues.length > 0) {
    const firstIssue = diagnosisData.key_issues[0]
    if (firstIssue.includes('location') || firstIssue.includes('SEO')) {
      parts.push(`. We noticed your bio could benefit from stronger local SEO`)
    } else if (firstIssue.includes('visual') || firstIssue.includes('Visual')) {
      parts.push(`. Your visual consistency shows room for improvement`)
    } else if (firstIssue.includes('link') || firstIssue.includes('CTA')) {
      parts.push(`. Your conversion path needs optimization`)
    }
  }

  // Explain the archetype choice
  parts.push(`, so we positioned you as "${persona.archetype}" to resonate with your local audience.`)

  // Add actionable benefit
  parts.push(` The optimized bio incorporates SEO keywords for local discoverability while maintaining your authentic voice.`)

  return parts.join('')
}

interface StrategyData {
  strategy_text?: string  // 纯文本策划案(最新格式)
  strategy_plan?: any  // 结构化策划案(旧格式)
  strategy_section?: {
    brand_persona: {
      // 新字段
      archetype_name?: string
      archetype_ui_explanation?: string
      tone_voice_description?: string
      tone_keywords?: string[]
      optimized_bio?: string
      bio_ui_explanation?: string
      analysis_deep_dive?: string
      // 旧字段(兼容)
      archetype?: string
      one_liner_bio?: string
      tone_voice?: string
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
  profileData?: any  // Profile snapshot data for dynamic analysis
  diagnosisData?: any  // Diagnosis data for context

  onDataLoaded?: (data: StrategyData) => void
  onDay1Loaded?: (day1: any) => void
  onCalendarLoaded?: (calendar: any) => void
  onProgressUpdate?: (progress: number) => void
  onPersonaLoaded?: (persona: any) => void  // 新增：Persona加载完成回调
}

export function StrategySection({ auditId, profileData, diagnosisData, onDataLoaded, onDay1Loaded, onCalendarLoaded, onProgressUpdate, onPersonaLoaded }: StrategySectionProps) {
  // 每个模块独立状态
  const [persona, setPersona] = useState<any>(null)
  const [contentMix, setContentMix] = useState<any>(null)
  const [audience, setAudience] = useState<any>(null)
  const [day1, setDay1] = useState<any>(null)  // ⭐ Day 1状态
  const [monthPlan, setMonthPlan] = useState<any>(null)  // ⭐ 新增：月度计划状态

  // 加载状态
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [loadingContentMix, setLoadingContentMix] = useState(false)
  const [loadingAudience, setLoadingAudience] = useState(false)
  const [loadingDay1, setLoadingDay1] = useState(false)  // ⭐ Day 1加载状态
  const [loadingMonthPlan, setLoadingMonthPlan] = useState(false)  // ⭐ 新增：月度计划加载状态

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
          // 立即通知父组件Persona已加载
          if (onPersonaLoaded) onPersonaLoaded(data.brand_persona)
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

  // 3. Persona完成后，加载 Day 1 Content（需要Persona数据）
  useEffect(() => {
    if (!persona || day1 || loadingDay1) return

    console.log('[Strategy] 📤 Loading Day 1 Content...')
    setLoadingDay1(true)

    fetch(`/api/audit/${auditId}/strategy/day1`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[Strategy] ✅ Day 1 Content loaded')
          setDay1(data.day_1_detail)
          if (onProgressUpdate) onProgressUpdate(80)
          // ⭐ 通知父组件
          if (onDay1Loaded) {
            onDay1Loaded(data.day_1_detail)
          }
        } else {
          console.error('[Strategy] ❌ Day 1 failed:', data.message)
        }
      })
      .catch(err => {
        console.error('[Strategy] ❌ Day 1 Content failed:', err)
      })
      .finally(() => setLoadingDay1(false))
  }, [auditId, persona, day1, loadingDay1])

  // 4. Persona完成后，加载 Month Plan（需要Persona和ContentMix数据）
  useEffect(() => {
    if (!persona || !contentMix || monthPlan || loadingMonthPlan) return

    console.log('[Strategy] 📤 Loading Month Plan...')
    setLoadingMonthPlan(true)

    fetch(`/api/audit/${auditId}/strategy/calendar`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('[Strategy] ✅ Month Plan loaded')
          setMonthPlan(data.month_plan)
          if (onProgressUpdate) onProgressUpdate(100)
          // ⭐ 通知父组件
          if (onCalendarLoaded) {
            onCalendarLoaded(data.month_plan)
          }
        } else {
          console.error('[Strategy] ❌ Month Plan failed:', data.message)
        }
      })
      .catch(err => {
        console.error('[Strategy] ❌ Month Plan failed:', err)
      })
      .finally(() => setLoadingMonthPlan(false))
  }, [auditId, persona, contentMix, monthPlan, loadingMonthPlan])

  // 5. 通知父组件策略数据已加载（当前3个模块完成时）
  useEffect(() => {
    if (persona && contentMix && audience && onDataLoaded) {
      console.log('[Strategy] ✅ Strategy modules loaded, notifying parent')
      onDataLoaded({
        strategy_section: {
          brand_persona: persona,
          content_mix_chart: contentMix,
          target_audience: audience
        }
      })
    }
  }, [persona, contentMix, audience])

  // 加载状态 - 初始连接中
  if (!persona && loadingPersona) {
    return (
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-float)',
        padding: '40px',
        border: '1px solid #f1f5f9'
      }}>
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">Your New Brand Persona</h2>
        <AILoadingAnimation
          steps={[
            { title: 'Analyzing Brand', detail: 'Understanding your unique identity...', progress: 30 },
            { title: 'Creating Persona', detail: 'Crafting your brand archetype...', progress: 70 },
            { title: 'Optimizing Bio', detail: 'Generating SEO-friendly bio...', progress: 100 }
          ]}
          icon="✨"
          autoPlay={true}
          stepInterval={8333}
        />
      </div>
    )
  }

  // 渲染策略内容 (渐进式显示)
  return (
    <div className="section-gap">
      {/* 品牌人设 - 完全参考Sidewalk设计 */}
      {persona ? (
        <div>
          <h2 className="section-title text-center">Your New Brand Persona</h2>

          {/* Persona Container - 参考Sidewalk设计 */}
          <div className="persona-container section-gap">
            {/* 左侧：人设信息 */}
            <div className="persona-left">
              {/* 标题 */}
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '16px',
                letterSpacing: '0.3px'
              }}>
                Improvement Suggestions
              </div>

              {/* Emoji和说明并排 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '40px', flexShrink: 0 }}>✨</span>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  lineHeight: '1.4'
                }}>
                  {persona.archetype_ui_explanation || 'Blending luxury day spa vibes with urban stress relief.'}
                </div>
              </div>

              {/* Archetype名称 */}
              <h3 className="text-gradient-instagram" style={{
                fontSize: '28px',
                fontWeight: 800,
                margin: '20px 0',
                lineHeight: '1.2'
              }}>
                {persona.archetype_name || persona.archetype || 'Your Brand Archetype'}
              </h3>

              {/* Tone描述 */}
              <p style={{ color: '#4b5563', fontSize: '18px', lineHeight: '1.6' }}>
                {persona.tone_voice_description || persona.tone_voice || 'Your brand voice description'}
              </p>

              {/* Tag Cloud - 动态显示关键词 */}
              <div className="tag-cloud">
                {(persona.tone_keywords || ['Warm', 'Authentic', 'Community']).map((tag, i) => (
                  <span key={i} className="tag-item">{tag}</span>
                ))}
              </div>
            </div>

            {/* 右侧：手机样机 */}
            {profileData && (
              <div className="persona-right" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* 标题 */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                  textAlign: 'center'
                }}>
                  Profile Preview
                </div>

                {/* Bio 预览说明 */}
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {persona.bio_ui_explanation || 'Optimized Bio preview'}
                </div>

                <div className="phone-flat">
                  {/* 顶部:头像 + 用户名 + 统计数据 */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    {/* 左侧头像 */}
                    <div style={{ width: '77px', height: '77px', background: '#f3f4f6', borderRadius: '50%', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {profileData.avatar_url ? (
                        <img
                          src={`/api/image-proxy?url=${encodeURIComponent(profileData.avatar_url)}`}
                          alt={profileData.full_name || 'Profile'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '32px', color: '#9ca3af' }}>{profileData.full_name?.charAt(0).toUpperCase() || 'A'}</span>
                      )}
                    </div>

                    {/* 右侧:用户名 + 统计数据 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                      {/* 用户名 */}
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {profileData.username || profileData.full_name}
                      </div>

                      {/* 统计数据 */}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, color: '#000' }}>{profileData.post_count || 0}</div>
                          <div style={{ color: '#000' }}>posts</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, color: '#000' }}>
                            {profileData.follower_count >= 1000
                              ? `${(profileData.follower_count / 1000).toFixed(1)}K`
                              : profileData.follower_count}
                          </div>
                          <div style={{ color: '#000' }}>followers</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, color: '#000' }}>{profileData.following_count || 0}</div>
                          <div style={{ color: '#000' }}>following</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio区域 */}
                  <div style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                    {/* 分类标签 */}
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#000' }}>
                      {profileData.category_label || 'None,Product/service'}
                    </div>

                    {/* Bio内容 */}
                    <div style={{ color: '#000', whiteSpace: 'pre-wrap' }}>
                      {persona.optimized_bio || persona.one_liner_bio}
                    </div>
                  </div>

                  {/* 底部按钮组 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Follow按钮 */}
                    <button style={{
                      flex: 1,
                      background: '#0095f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}>
                      Follow
                    </button>

                    {/* Message按钮 */}
                    <button style={{
                      flex: 1,
                      background: '#efefef',
                      color: '#000',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}>
                      Message
                    </button>

                    {/* 添加好友图标按钮 */}
                    <button style={{
                      background: '#efefef',
                      color: '#000',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-float)',
          padding: '40px',
          border: '1px solid #f1f5f9'
        }}>
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">Your New Brand Persona</h2>
          <AILoadingAnimation
            title="Generating brand persona..."
            subtitle="This usually takes 15-30 seconds"
            icon="✨"
          />
        </div>
      )}

      {/* Content Mix已整合到日历中，不再单独显示 */}

    </div>
  )
}

/**
 * Content Mix Sidewalk Chart - 参考Sidewalk HTML设计
 * 左侧环形图 + 右侧进度条列表
 */
function ContentMixSidewalkChart({ data }: { data: Array<{ label: string; percentage: number }> }) {
  // Sidewalk配色方案
  const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

  // 生成环形图渐变 (conic-gradient)
  let gradientStops: string[] = []
  let currentPercent = 0
  data.forEach((item, i) => {
    const color = colors[i % colors.length]
    gradientStops.push(`${color} ${currentPercent}% ${currentPercent + item.percentage}%`)
    currentPercent += item.percentage
  })

  return (
    <div className="mix-card section-gap">
      {/* 左侧: 环形图 */}
      <div
        className="donut-chart"
        style={{ background: `conic-gradient(${gradientStops.join(', ')})` }}
      >
        <div className="donut-inner">
          <span style={{ fontSize: '30px' }}>🎯</span>
          <span style={{ fontSize: '12px', color: 'gray' }}>Optimal Mix</span>
        </div>
      </div>

      {/* 右侧: 进度条列表 */}
      <div className="mix-list">
        {data.map((item, i) => {
          const color = colors[i % colors.length]
          return (
            <div key={i} className="mix-row">
              <div className="mix-header">
                <span style={{ color }}>{item.label}</span>
                <span>{item.percentage}%</span>
              </div>
              <div className="mix-bar-bg">
                <div className="mix-bar-fill" style={{ width: `${item.percentage}%`, background: color }}></div>
              </div>
              <div style={{ fontSize: '13px', color: 'gray', marginTop: '5px' }}>
                {/* 动态描述 */}
                {i === 0 && 'High-quality content showcasing your best offerings.'}
                {i === 1 && 'Behind-the-scenes content to build authenticity.'}
                {i === 2 && 'Community engagement to strengthen connection.'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

