/**
 * 新架构结果页 - 真正的双速响应
 * 阶段1: 立即渲染即时数据 (用户信息、统计数据)
 * 阶段2: 轮询AI增强数据 (诊断分数、建议)
 */

'use client'

import { use, useEffect, useState } from 'react'
import { ProfileSnapshot } from '@/components/result/ProfileSnapshot'
import { StrategySection } from '@/components/result/StrategySection'
import { UnifiedStrategyDashboard } from '@/components/result/UnifiedStrategyDashboard'
import { PageLoadingAnimation, AILoadingAnimation } from '@/components/loading/AILoadingAnimation'



interface PageProps {
  params: Promise<{ auditId: string }>
}

export default function AuditResultPage({ params }: PageProps) {
  // Next.js 16: params是Promise,需要unwrap
  const { auditId } = use(params)
  
  const [instantData, setInstantData] = useState<any>(null)
  const [diagnosisData, setDiagnosisData] = useState<any>(null)
  const [strategyData, setStrategyData] = useState<any>(null)  // 策略数据(Persona+Mix+Audience)
  const [personaData, setPersonaData] = useState<any>(null)  // Persona数据（用于立即显示下一步加载）
  const [day1Data, setDay1Data] = useState<any>(null)  // Day1内容
  const [calendarData, setCalendarData] = useState<any>(null)  // 30天日历
  const [strategyProgress, setStrategyProgress] = useState(0)  // Strategy进度
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
            setError('Data not ready, please refresh later')
          }
        }
      })
      .catch(err => {
        console.error('❌ [结果页] 请求失败:', err)
        setError('Loading failed: ' + err.message)
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
      <PageLoadingAnimation
        title="Loading Account Data..."
        subtitle="Retrieving your Instagram profile information"
      />
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
          <h2 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">Loading Failed</h2>
          <p className="font-sans text-sm text-charcoal-600 mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-6 hover:bg-charcoal-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>
      {/* Navigation - Instagram Style Header */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-[#dbdbdb] h-[60px]">
        <div className="max-w-[935px] mx-auto h-full flex items-center justify-between px-4 lg:px-0">

          {/* Left: Navigation */}
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-1 sm:gap-2 text-[#262626] hover:opacity-70 transition-opacity group whitespace-nowrap"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold text-xs sm:text-sm tracking-tight">Back to Home</span>
          </button>

          {/* Center: CTA Button */}
          <a
            href="https://www.sidewalksocial.ai/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              import('@/lib/analytics-tracker').then(({ trackClick }) => {
                trackClick('cta_sidewalk_click', {
                  user_id: instantData?.username || auditId,
                  component_location: 'AuditResultPage-Header',
                  event_category: 'cta',
                  metadata: { destination: 'sidewalksocial.ai' }
                })
              })
            }}
            className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-[8px] text-xs sm:text-sm font-semibold transition-opacity whitespace-nowrap sm:absolute sm:left-1/2 sm:-translate-x-1/2"
          >
            <span>✨ Meet Sidewalk: AI Manager~</span>
          </a>

          {/* Right: Empty Space for Balance */}
          <div className="w-[120px]"></div>

        </div>
      </header>

      {/* Main Content - 使用Sidewalk容器样式 */}
      <main className="container-sidewalk" style={{ paddingTop: '60px', paddingBottom: '80px' }}>
        {/* 阶段1: 即时数据 - 立即渲染 */}
        <ProfileSnapshot data={instantData}  />

        {/* 阶段2: AI增强数据 - 渐进式显示 */}
        {diagnosisData ? (
          <>
            <DiagnosisCard data={diagnosisData} />
          </>
        ) : aiFailed ? (
          <DiagnosisCardAIFailed />
        ) : (
          <DiagnosisCardSkeleton />
        )}

        {/* Slow Lane Components - SSE异步加载 */}
        {diagnosisData && (
          <StrategySection
            auditId={auditId}
            profileData={instantData}
            diagnosisData={diagnosisData}
            onDataLoaded={setStrategyData}
            onDay1Loaded={setDay1Data}
            onCalendarLoaded={setCalendarData}
            onProgressUpdate={setStrategyProgress}
            onPersonaLoaded={setPersonaData}
          />
        )}

        {/* Day 1内容已整合到日历中，不再单独显示 */}

        {/* 统一策略仪表板 - 整合Content Mix + Instant Content Fix + 30天日历 */}
        {/* 只要Persona加载完成就立即显示 */}
        {diagnosisData && personaData && (
          <>
            {/* 所有数据加载完成，显示完整仪表板 */}
            {day1Data && calendarData && strategyData?.strategy_section?.content_mix_chart ? (
              <UnifiedStrategyDashboard
                contentMix={strategyData.strategy_section.content_mix_chart}
                brandPersona={strategyData.strategy_section.brand_persona}
                calendar={{ day_1_detail: day1Data, month_plan: calendarData }}
                profileData={instantData}
                auditId={auditId}
              />
            ) : (
              /* 数据加载中，显示加载动画 */
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-float)',
                padding: '40px',
                border: '1px solid #f1f5f9'
              }}>
                <h2 className="section-title">30-Day Content Calendar</h2>
                <div className="py-8">
                  <AILoadingAnimation
                    steps={[
                      { title: 'Loading Strategy', detail: 'Preparing your content mix...', progress: 20 },
                      { title: 'Creating Day 1 Post', detail: 'Generating viral content...', progress: 50 },
                      { title: 'Planning Calendar', detail: 'Building 30-day roadmap...', progress: 80 },
                      { title: 'Finalizing', detail: 'Almost ready...', progress: 95 }
                    ]}
                    icon="📅"
                    autoPlay={true}
                    stepInterval={6250}
                  />
                </div>
              </div>
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
      <h2 className="font-serif text-3xl font-bold mb-2">
        <span className="text-gradient-brand">Missed Traffic Check</span>
      </h2>
      <p className="font-sans text-sm text-charcoal-600 mb-8">See exactly where you are losing potential customers in your bio and posts.</p>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-yellow-50 border-2 border-yellow-600 flex items-center justify-center mx-auto mb-4 rounded-full">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">AI Analysis Failed</h3>
        <p className="font-sans text-sm text-charcoal-600 mb-6">Unable to generate diagnosis score, please return to home and try again</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-6 hover:bg-charcoal-800 transition-colors"
        >
          Return to Home and Retry
        </button>
      </div>
    </div>
  )
}

/**
 * Day1内容预览组件 - 参考Sidewalk设计
 */
function Day1Preview({ day1, profileData }: { day1: any, profileData?: any }) {
  return (
    <div className="section-gap">
      <h2 className="section-title text-center">Instant Content Fix</h2>
      <p className="section-subtitle text-center">
        Don't just get data. Get ready-to-post images and captions generated by AI.
      </p>

      {/* 3D手机样机 - 参考Sidewalk设计 */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="glow-bg"></div>

        <div className="phone-3d">
          <div style={{ background: 'white', borderRadius: '32px', height: '540px', overflow: 'hidden' }}>
            {/* Instagram Post Header */}
            <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {profileData?.username || 'yourbusiness'}
              </span>
              <span>...</span>
            </div>

            {/* Image Placeholder */}
            <div style={{ height: '300px', background: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '40px' }}>📸</span>
                <div style={{ fontSize: '12px', background: 'white', padding: '4px 10px', borderRadius: '10px', color: '#ec4899', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginTop: '10px' }}>
                  ✨ AI Generated
                </div>
              </div>
            </div>

            {/* Post Actions & Caption */}
            <div style={{ padding: '15px', fontSize: '12px', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%' }}></div>
                <div style={{ width: '20px', height: '20px', background: '#eee', borderRadius: '50%' }}></div>
              </div>
              <strong>{profileData?.username || 'yourbusiness'}</strong>{' '}
              {day1.caption.substring(0, 80)}...
              <br />
              <span style={{ color: '#00376b' }}>{day1.hashtags.slice(0, 3).join(' ')}</span>
            </div>
          </div>
        </div>

        {/* Float Buttons */}
        <div style={{ position: 'absolute', right: '-80px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 3 }}>
          <div className="float-btn" title="Download">⬇️</div>
          <div className="float-btn" title="Copy">📋</div>
        </div>
      </div>

      {/* Caption & Hashtags Details - 放在手机样机下方 */}
      <div style={{ marginTop: '60px', maxWidth: '800px', margin: '60px auto 0' }}>
        <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Generated Caption</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>{day1.caption}</p>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Recommended Hashtags</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {day1.hashtags.map((tag: string, i: number) => (
              <span key={i} className="tag-item" style={{ fontSize: '12px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-8 rounded-xl shadow-card">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Image Generation Prompt</h3>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#6b7280' }}>{day1.image_gen_prompt}</p>
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
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-float)',
      padding: '40px',
      border: '1px solid #f1f5f9'
    }}>
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">Instant Content Fix</h2>

      <div className="py-8">
        <AILoadingAnimation
          steps={[
            { title: 'Analyzing Your Style', detail: 'Understanding your brand voice...', progress: 25 },
            { title: 'Generating Caption', detail: 'Creating engaging post copy...', progress: 50 },
            { title: 'Selecting Hashtags', detail: 'Finding optimal hashtags...', progress: 75 },
            { title: 'Finalizing Content', detail: 'Preparing your Day 1 post...', progress: 100 }
          ]}
          icon="✨"
          autoPlay={true}
          stepInterval={6250}
        />
      </div>
    </div>
  )
}

/**
 * 日历骨架屏
 */
function CalendarSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-float)',
      padding: '40px',
      border: '1px solid #f1f5f9'
    }}>
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">30-Day Content Calendar</h2>

      <div className="py-8">
        <AILoadingAnimation
          steps={[
            { title: 'Planning Strategy', detail: 'Creating content themes...', progress: 20 },
            { title: 'Scheduling Posts', detail: 'Optimizing posting times...', progress: 40 },
            { title: 'Generating Captions', detail: 'Writing 30 unique captions...', progress: 60 },
            { title: 'Finalizing Calendar', detail: 'Preparing your monthly plan...', progress: 90 }
          ]}
          icon="📅"
          autoPlay={true}
          stepInterval={6250}
        />
      </div>
    </div>
  )
}

/**
 * DiagnosisCard骨架屏
 */
function DiagnosisCardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-float)',
      padding: '40px',
      marginBottom: '32px',
      border: '1px solid #f1f5f9'
    }}>
      <h2 className="font-serif text-3xl font-bold mb-2">
        <span className="text-gradient-brand">Missed Traffic Check</span>
      </h2>
      <p className="font-sans text-sm text-charcoal-600 mb-8">See exactly where you are losing potential customers in your bio and posts.</p>

      {/* AI加载动画 */}
      <div className="py-8">
        <AILoadingAnimation
          steps={[
            { title: 'Analyzing Profile', detail: 'Examining your bio and profile setup...', progress: 20 },
            { title: 'Scanning Content', detail: 'Reviewing recent posts and engagement...', progress: 40 },
            { title: 'Visual Analysis', detail: 'Checking color palette and consistency...', progress: 60 },
            { title: 'Competitor Research', detail: 'Comparing with local businesses...', progress: 80 },
            { title: 'Calculating Score', detail: 'Generating your health score...', progress: 95 }
          ]}
          icon="🔍"
          autoPlay={true}
          stepInterval={5000}
        />
      </div>
    </div>
  )
}

/**
 * DiagnosisCard组件 (诊断卡片) - 参考Sidewalk设计
 */
function DiagnosisCard({ data }: { data: any }) {
  const { score, summary_title, key_issues } = data

  const getScoreColor = (s: number) => {
    if (s >= 80) return { label: 'EXCELLENT', color: '#10b981' } // 绿色
    if (s >= 50) return { label: 'GOOD', color: '#F59E0B' } // 黄色
    return { label: 'NEEDS WORK', color: '#ef4444' } // 红色
  }

  const scoreInfo = getScoreColor(score)

  // 计算半圆仪表盘旋转角度 (0-180度对应0-100分)
  const rotation = (score / 100) * 180 // 0-100分对应0-180度旋转

  return (
    <div className="section-gap">
      {/* Hero Section - 完全参考Sidewalk设计 */}
      <section className="hero-section rounded-[var(--radius-lg)] shadow-card mb-12">
        <span className="score-badge">AUDIT COMPLETE</span>
        <h1 className="hero-title">
          What's Your <span className="text-gradient-instagram">Instagram Health Score?</span>
        </h1>
        <p className="section-subtitle" style={{ marginBottom: '50px' }}>
          {summary_title}
        </p>

        {/* 半圆仪表盘 - SVG 填充 */}
        <div style={{ position: 'relative', width: '240px', height: '120px', margin: '40px auto 20px' }}>
          <svg width="240" height="120" viewBox="0 0 240 120">
            {/* 灰色背景半圆环 */}
            <path
              d="M 20 120 A 100 100 0 0 1 220 120"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="40"
              strokeLinecap="round"
            />
            {/* 黄色填充半圆环 - 从左到右 */}
            <path
              d="M 20 120 A 100 100 0 0 1 220 120"
              fill="none"
              stroke={scoreInfo.color}
              strokeWidth="40"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 314} 314`}
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          {/* 分数显示 */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}>
              {score}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: scoreInfo.color }}>
              {scoreInfo.label}
            </div>
          </div>
        </div>

        {/* 社交证明 */}
        <div className="social-proof-hero">
          <div className="avatars">
            <img src="https://i.pravatar.cc/100?img=1" alt="User 1" />
            <img src="https://i.pravatar.cc/100?img=5" alt="User 2" />
            <img src="https://i.pravatar.cc/100?img=8" alt="User 3" />
          </div>
          Trusted by 5,000+ local businesses
        </div>
      </section>

      {/* Missed Traffic Check Section - 参考Sidewalk审计卡片设计 */}
      <h2 className="section-title text-center">Missed Traffic Check</h2>
      <p className="section-subtitle text-center">
        Solve these {key_issues.length} issues to rank higher locally.
      </p>

      <div className="audit-grid">
        {key_issues.map((issue: string, index: number) => {
          // 根据位置分配不同图标和颜色
          const cardStyles = [
            { icon: '⚡️', bgColor: '#fee2e2', iconColor: '#ef4444', statusText: 'Fix: Add clear CTA', statusColor: '#ef4444' },
            { icon: '🎨', bgColor: '#fee2e2', iconColor: '#ef4444', statusText: 'Fix: Improve consistency', statusColor: '#ef4444' },
            { icon: '🔍', bgColor: '#fee2e2', iconColor: '#ef4444', statusText: 'Fix: Add booking link', statusColor: '#ef4444' },
          ]
          const style = cardStyles[index] || cardStyles[0]

          // 去除开头的分类标签（如 "SEO & Discoverability:", "Visual Appeal:", "Conversion Path:"）
          const cleanIssue = issue.replace(/^[^:]+:\s*/, '')

          return (
            <div key={index} className="audit-card">
              <div className="icon-box" style={{ background: style.bgColor, color: style.iconColor }}>
                {style.icon}
              </div>
              <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '14px', lineHeight: '1.6' }}>
                {cleanIssue}
              </p>
              <div style={{ color: style.statusColor, fontWeight: 700, marginTop: '10px', fontSize: '14px' }}>
                {style.statusText}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
