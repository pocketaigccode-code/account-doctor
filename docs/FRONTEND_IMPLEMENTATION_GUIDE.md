# 前端实现指南 - 双速响应架构

> 本文档详细说明如何实现分步渲染的结果页,确保用户体验流畅

---

## 📐 页面结构设计

### 层级关系

```
Result Page (结果页)
├── 1️⃣ Profile Snapshot         [Fast Lane - 毫秒级]
├── 2️⃣ Diagnosis Card            [Fast Lane - 毫秒级]
├── 3️⃣ Strategy Section          [Slow Lane - 异步加载]
├── 4️⃣ Content Preview           [Slow Lane - 异步加载]
├── 5️⃣ Execution Calendar        [Slow Lane - 异步加载]
└── 6️⃣ Conversion CTA            [静态]
```

---

## 🎯 组件实现详解

### 1. ProfileSnapshot (顶部概览)

**设计原则**: 名片式布局,左中右三栏,展示账号"身份证"

```typescript
// components/result/ProfileSnapshot.tsx

interface ProfileSnapshotData {
  handle: string
  full_name: string
  avatar_url: string
  is_verified: boolean
  followers_display: string
  activity_status: 'Active' | 'Dormant' | 'Inactive'
  last_post_date: string
  avg_likes: number
  category_label: string
  missing_elements: string[]
  recent_posts_preview: Array<{
    thumbnail_url: string
    type: 'Image' | 'Video' | 'Reel'
    likes: number
    comments: number
  }>
}

export function ProfileSnapshot({ data }: { data: ProfileSnapshotData }) {
  const getActivityColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-sage border-sage'
      case 'Dormant': return 'text-yellow-600 border-yellow-600'
      case 'Inactive': return 'text-terracotta border-terracotta'
    }
  }

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      {/* === 三栏布局 === */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">

        {/* 左: 身份锚点 */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={data.avatar_url}
              alt={data.handle}
              className="w-20 h-20 rounded-full border-2 border-sand-200"
            />
            {data.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-charcoal-900">
              {data.full_name}
            </h2>
            <p className="font-sans text-sm text-charcoal-600">
              @{data.handle}
            </p>
            <span className="inline-block mt-2 bg-sand-100 border border-sand-200 px-3 py-1 font-sans text-xs text-charcoal-900">
              {data.category_label}
            </span>
          </div>
        </div>

        {/* 中: 核心体征 */}
        <div className="space-y-4">
          <div>
            <p className="font-sans text-xs text-charcoal-600 mb-1">Audience Reach</p>
            <p className="font-serif text-2xl font-bold text-charcoal-900">
              {data.followers_display}
            </p>
          </div>
          <div>
            <p className="font-sans text-xs text-charcoal-600 mb-1">Activity Status</p>
            <div className={`inline-flex items-center gap-2 border-2 px-3 py-1 ${getActivityColor(data.activity_status)}`}>
              <div className={`w-2 h-2 rounded-full ${data.activity_status === 'Active' ? 'bg-sage' : data.activity_status === 'Dormant' ? 'bg-yellow-600' : 'bg-terracotta'}`}></div>
              <span className="font-sans text-sm font-bold">{data.activity_status}</span>
            </div>
            <p className="font-sans text-xs text-charcoal-600 mt-1">
              Last post: {data.last_post_date}
            </p>
          </div>
        </div>

        {/* 右: 商业转化检查 */}
        <div>
          <p className="font-sans text-xs font-bold text-charcoal-900 mb-3">
            Conversion Checklist
          </p>
          {data.missing_elements.length > 0 ? (
            <div className="space-y-2">
              {data.missing_elements.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 bg-terracotta-light border border-terracotta flex items-center justify-center">
                    <svg className="w-3 h-3 text-terracotta" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-sans text-charcoal-800">Missing {item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-sage">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-sans font-bold">All Set Up</span>
            </div>
          )}
        </div>
      </div>

      {/* === 底部: 视觉足迹 === */}
      <div className="border-t border-sand-200 pt-6">
        <p className="font-sans text-xs font-bold text-charcoal-900 mb-3">
          Recent Content (Visual Footprint)
        </p>
        <div className="grid grid-cols-5 gap-3">
          {data.recent_posts_preview.map((post, i) => (
            <div key={i} className="relative aspect-square bg-sand-100 border border-sand-200 group">
              <img
                src={post.thumbnail_url}
                alt={`Post ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-charcoal-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                {post.type === 'Video' && (
                  <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                )}
                <div className="font-sans text-xs">
                  ❤️ {post.likes} · 💬 {post.comments}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

### 2. DiagnosisCard (诊断卡片)

```typescript
// components/result/DiagnosisCard.tsx

interface DiagnosisCardProps {
  score: number
  summary_title: string
  key_issues: string[]
}

export function DiagnosisCard({ score, summary_title, key_issues }: DiagnosisCardProps) {
  const getScoreGrade = (s: number) => {
    if (s >= 80) return { label: '优秀', color: 'text-sage', bg: 'bg-sage/10' }
    if (s >= 60) return { label: '良好', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (s >= 40) return { label: '待改进', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: '警戒', color: 'text-terracotta', bg: 'bg-terracotta-light' }
  }

  const grade = getScoreGrade(score)

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
        Health Diagnosis
      </h2>

      <div className="flex items-start gap-12">
        {/* 左: 评分圆环 */}
        <div className="flex-shrink-0 text-center">
          <div className="relative w-40 h-40 mb-4">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle cx="80" cy="80" r="70" stroke="#e6e2d6" strokeWidth="14" fill="none" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={grade.color.replace('text-', '#')}
                strokeWidth="14"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-serif text-5xl font-bold text-charcoal-900">{score}</div>
              <div className="font-sans text-sm text-charcoal-600">/100</div>
            </div>
          </div>
          <div className={`inline-block ${grade.bg} px-4 py-1.5 border border-sand-200`}>
            <span className="font-sans text-sm font-bold text-charcoal-900">{grade.label}</span>
          </div>
        </div>

        {/* 右: 问题列表 */}
        <div className="flex-1">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
            {summary_title}
          </h3>
          <p className="font-sans text-sm text-charcoal-600 mb-6">
            Based on our analysis of your profile, here are the key areas to improve:
          </p>

          <div className="space-y-3">
            {key_issues.map((issue, index) => {
              const isWarning = issue.includes('警告') || issue.includes('Missing')
              const isGood = issue.includes('✅') || issue.includes('优秀')

              return (
                <div
                  key={index}
                  className={`flex gap-3 items-start p-4 border-l-4 ${
                    isGood ? 'bg-sage/5 border-sage' :
                    isWarning ? 'bg-terracotta-light border-terracotta' :
                    'bg-sand-50 border-sand-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center font-sans text-xs font-bold ${
                    isGood ? 'bg-sage text-white' :
                    isWarning ? 'bg-terracotta text-white' :
                    'bg-charcoal-600 text-white'
                  }`}>
                    {isGood ? '✓' : isWarning ? '!' : index + 1}
                  </div>
                  <p className="font-sans text-sm text-charcoal-800 leading-relaxed flex-1">
                    {issue}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 3. StrategySection (策略板块 - SSE加载)

```typescript
// components/result/StrategySection.tsx

'use client'

import { useEffect, useState } from 'react'

export function StrategySection({ auditId }: { auditId: string }) {
  const [strategy, setStrategy] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('analyzing')

  useEffect(() => {
    const eventSource = new EventSource(`/api/audit/${auditId}/strategy`)

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data)
      setPhase(data.phase)
      setProgress(data.progress)
    })

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data)
      setStrategy(data)
      eventSource.close()
    })

    eventSource.addEventListener('error', () => {
      console.error('SSE connection failed')
      eventSource.close()
      // 降级到轮询
      fallbackToPolling(auditId, setStrategy, setProgress)
    })

    return () => eventSource.close()
  }, [auditId])

  if (!strategy) {
    return <AIThinkingAnimation phase={phase} progress={progress} />
  }

  return (
    <div className="space-y-8">
      {/* 品牌人设 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          Your Brand Persona
        </h2>
        <div className="bg-sand-50 border border-sand-200 p-6">
          <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">
            {strategy.strategy_section.brand_persona.archetype}
          </h3>
          <p className="font-sans text-base text-charcoal-800 leading-relaxed mb-4">
            {strategy.strategy_section.brand_persona.tone_voice}
          </p>
          <div className="bg-white border border-sand-200 p-4">
            <p className="font-sans text-xs text-charcoal-600 mb-1">Optimized Bio:</p>
            <p className="font-sans text-sm text-charcoal-900">
              {strategy.strategy_section.brand_persona.one_liner_bio}
            </p>
          </div>
        </div>
      </div>

      {/* 内容配比饼图 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          The Golden Ratio
        </h2>
        <ContentMixChart data={strategy.strategy_section.content_mix_chart} />
      </div>

      {/* 目标受众 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          Target Audience
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {strategy.strategy_section.target_audience.map((audience: any, i: number) => (
            <div key={i} className="bg-sand-50 border border-sand-200 p-6">
              <span className="inline-block bg-charcoal-900 text-white px-3 py-1 font-sans text-xs font-bold mb-3">
                {audience.type}
              </span>
              <h4 className="font-serif text-lg font-bold text-charcoal-900 mb-2">
                {audience.description}
              </h4>
              <p className="font-sans text-sm text-charcoal-600">
                Pain Point: {audience.pain_point}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 降级到轮询的备用方案
async function fallbackToPolling(
  auditId: string,
  setStrategy: Function,
  setProgress: Function
) {
  let attempts = 0
  const maxAttempts = 60 // 最多轮询60次 (2分钟)

  const poll = async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}/status`)
      const data = await res.json()

      setProgress(data.progress)

      if (data.status === 'completed') {
        setStrategy(data.result)
        return
      }

      if (data.status === 'failed') {
        console.error('AI generation failed')
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000) // 每2秒轮询一次
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  poll()
}
```

---

### 4. AIThinkingAnimation (AI思考动画)

```typescript
// components/result/AIThinkingAnimation.tsx

const PHASE_MESSAGES: Record<string, string> = {
  analyzing: '正在分析账号数据...',
  generating_persona: '正在设计品牌人设...',
  building_calendar: '正在规划30天内容日历...',
  generating_image: '正在生成首日配图...'
}

export function AIThinkingAnimation({ phase, progress }: {
  phase: string
  progress: number
}) {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm">
      <div className="text-center max-w-md mx-auto">
        {/* 动画圆环 */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-sand-200 rounded-full"></div>
          <div
            className="absolute inset-0 border-4 border-charcoal-900 rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-sans text-sm font-bold text-charcoal-900">
              {progress}%
            </span>
          </div>
        </div>

        {/* 状态文字 */}
        <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
          AI is crafting your strategy...
        </h3>
        <p className="font-sans text-sm text-charcoal-600 mb-4">
          {PHASE_MESSAGES[phase] || '处理中...'}
        </p>

        {/* 进度条 */}
        <div className="w-full bg-sand-100 h-2 overflow-hidden">
          <div
            className="bg-sage h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="font-sans text-xs text-charcoal-600 mt-4">
          This usually takes 15-30 seconds
        </p>
      </div>
    </div>
  )
}
```

---

### 5. ExecutionCalendar (30天日历)

```typescript
// components/result/ExecutionCalendar.tsx

export function ExecutionCalendar({ calendar }: { calendar: any }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
        30-Day Execution Calendar
      </h2>

      {/* Day 1 - 完整展示 */}
      <div className="bg-sage/5 border-2 border-sage p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-sage text-white px-3 py-1.5 font-sans text-sm font-bold">
            Tomorrow (Day 1)
          </div>
          <span className="font-sans text-xs text-charcoal-600">Ready to Post</span>
        </div>

        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-4">
          {calendar.day_1_detail.title}
        </h3>

        {/* 生成的图片预览 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="aspect-square bg-gradient-to-br from-sand-100 to-sand-200 border border-sand-200 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-charcoal-600 opacity-20 mx-auto mb-3" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-sans text-xs text-charcoal-600">Image generating...</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-sans text-xs font-bold text-charcoal-900 mb-2">Caption:</h4>
              <div className="bg-sand-50 border border-sand-200 p-4">
                <p className="font-sans text-sm text-charcoal-900 leading-relaxed whitespace-pre-wrap">
                  {calendar.day_1_detail.caption}
                </p>
              </div>
              <button className="mt-2 font-sans text-xs text-sage hover:underline">
                Copy to clipboard
              </button>
            </div>

            <div>
              <h4 className="font-sans text-xs font-bold text-charcoal-900 mb-2">Hashtags:</h4>
              <div className="flex flex-wrap gap-2">
                {calendar.day_1_detail.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="bg-sand-100 border border-sand-200 px-3 py-1 font-sans text-xs text-charcoal-900">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day 2-30 - 锁定状态 */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {calendar.month_plan.map((day: any) => (
          <button
            key={day.day}
            onClick={() => setSelectedDay(day.day)}
            className="border border-sand-200 p-3 bg-sand-50 opacity-60 hover:opacity-80 transition-opacity relative group"
          >
            <div className="font-sans text-xs text-charcoal-600 mb-2">Day {day.day}</div>
            <div className="aspect-square bg-sand-200 blur-sm mb-2"></div>
            <p className="font-sans text-xs text-charcoal-600 truncate">{day.theme}</p>

            {/* 锁定图标 */}
            <div className="absolute top-2 right-2">
              <svg className="w-3 h-3 text-charcoal-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Hover提示 */}
            <div className="absolute inset-x-0 -bottom-12 bg-charcoal-900 text-white px-3 py-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {day.idea}
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-sand-100 border-2 border-charcoal-900 p-8 text-center">
        <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
          Unlock 30 Days of Content Strategy + Auto-Generated Images
        </h3>
        <p className="font-sans text-sm text-charcoal-600 mb-6 max-w-md mx-auto">
          Get full captions, hashtags, and AI-generated images for all 30 days
        </p>
        <button className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-8 hover:bg-charcoal-800 transition-colors">
          Start Free 7-Day Trial
        </button>
        <p className="font-sans text-xs text-charcoal-600 mt-3">
          Cancel anytime. No credit card required.
        </p>
      </div>
    </div>
  )
}
```

---

## 🔄 数据加载流程

### 前端状态机

```typescript
// hooks/useAuditFlow.ts

type AuditStatus = 'loading' | 'snapshot_ready' | 'analyzing' | 'completed' | 'error'

export function useAuditFlow(auditId: string) {
  const [status, setStatus] = useState<AuditStatus>('loading')
  const [snapshot, setSnapshot] = useState(null)
  const [strategy, setStrategy] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Step 1: 获取Fast Lane数据
    fetch(`/api/audit/init`, {
      method: 'POST',
      body: JSON.stringify({ audit_id: auditId })
    })
      .then(res => res.json())
      .then(data => {
        setSnapshot(data.profile_snapshot)
        setStatus('snapshot_ready')

        // Step 2: 触发Slow Lane (SSE)
        const sse = new EventSource(`/api/audit/${auditId}/strategy`)
        sse.addEventListener('complete', (e) => {
          setStrategy(JSON.parse(e.data))
          setStatus('completed')
          sse.close()
        })
      })
      .catch(err => {
        setError(err)
        setStatus('error')
      })
  }, [auditId])

  return { status, snapshot, strategy, error }
}
```

---

## 📱 响应式设计

### 移动端优化

```typescript
// components/result/ProfileSnapshot.mobile.tsx

export function ProfileSnapshotMobile({ data }: ProfileSnapshotProps) {
  return (
    <div className="bg-white border border-sand-200 p-6 shadow-sm">
      {/* 移动端: 垂直堆叠 */}
      <div className="space-y-6">
        {/* 身份区 */}
        <div className="flex items-center gap-4">
          <img src={data.avatar_url} className="w-16 h-16 rounded-full" />
          <div>
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              {data.full_name}
            </h2>
            <p className="font-sans text-xs text-charcoal-600">@{data.handle}</p>
          </div>
        </div>

        {/* 体征指标 - 横向滚动 */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <MetricPill label="Followers" value={data.followers_display} />
          <MetricPill label="Avg Likes" value={data.avg_likes} />
          <MetricPill label="Posts" value="123" />
        </div>

        {/* 缺失元素 - 警告条 */}
        {data.missing_elements.length > 0 && (
          <div className="bg-terracotta-light border-l-4 border-terracotta p-3">
            <p className="font-sans text-xs font-bold text-charcoal-900 mb-1">
              Missing:
            </p>
            <p className="font-sans text-xs text-charcoal-800">
              {data.missing_elements.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 🎨 动画与微交互

### 评分动画

```typescript
// hooks/useScoreAnimation.ts

export function useScoreAnimation(targetScore: number, duration = 1000) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = targetScore / (duration / 16) // 60fps

    const timer = setInterval(() => {
      start += increment
      if (start >= targetScore) {
        setScore(targetScore)
        clearInterval(timer)
      } else {
        setScore(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [targetScore, duration])

  return score
}
```

### 骨架屏

```typescript
// components/skeletons/StrategySkeleton.tsx

export function StrategySkeleton() {
  return (
    <div className="bg-white border border-sand-200 p-10 animate-pulse">
      <div className="h-8 bg-sand-100 w-1/3 mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 bg-sand-100 w-full"></div>
        <div className="h-4 bg-sand-100 w-5/6"></div>
        <div className="h-4 bg-sand-100 w-4/6"></div>
      </div>
    </div>
  )
}
```

---

## ✅ 性能优化清单

- [ ] **Code Splitting**: 使用 `next/dynamic` 懒加载日历组件
- [ ] **Image Optimization**: 使用 `next/image` 优化头像和缩略图
- [ ] **SSE Connection Pool**: 限制同时打开的SSE连接数
- [ ] **Debounce**: 输入框防抖,避免频繁请求
- [ ] **Prefetch**: 鼠标悬停在结果链接时预加载数据
- [ ] **Service Worker**: 缓存静态资源
- [ ] **Lighthouse Score**: 目标 > 90分

---

**文档版本**: v1.0
**最后更新**: 2025-01-28
