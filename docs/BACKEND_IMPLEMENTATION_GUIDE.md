# 后端实现指南 - API Route Handlers

> 详细说明如何实现双速响应架构的后端逻辑

---

## 📁 文件结构

```
app/api/
├── audit/
│   ├── init/
│   │   └── route.ts              # POST /api/audit/init (Fast Lane入口)
│   └── [auditId]/
│       ├── status/
│       │   └── route.ts          # GET /api/audit/{id}/status (轮询)
│       └── strategy/
│           └── route.ts          # GET /api/audit/{id}/strategy (SSE)
├── internal/
│   └── apify/
│       └── scrape/route.ts       # 内部Apify调用接口
└── webhooks/
    └── apify/route.ts            # Apify回调 (可选)

lib/
├── ai/
│   ├── prompts/
│   │   ├── profile-analyst.ts   # Prompt Set 1
│   │   └── strategic-director.ts # Prompt Set 2
│   ├── gemini.ts                 # DeerAPI客户端
│   └── fallback.ts               # 降级策略
├── scrapers/
│   ├── apify-instagram-full.ts  # 完整版Scraper
│   └── types.ts                  # 类型定义
├── cache/
│   ├── apify-cache.ts           # 缓存逻辑
│   └── cache-keys.ts            # 缓存键管理
└── errors/
    └── audit-errors.ts          # 错误处理
```

---

## 🚀 Fast Lane 实现

### Route: POST /api/audit/init

```typescript
// app/api/audit/init/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getCachedOrFetch } from '@/lib/cache/apify-cache'
import { parseFastLaneData } from '@/lib/ai/profile-analyst'
import { AuditErrorCode, ERROR_UI_MESSAGES } from '@/lib/errors/audit-errors'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { username, skip_cache = false } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_USERNAME', message: 'Username is required' },
        { status: 400 }
      )
    }

    // 清理用户名
    const cleanUsername = username.trim().toLowerCase().replace('@', '')

    console.log(`[Audit Init] Starting for: ${cleanUsername}`)

    // ================================================
    // Step 1: 检查缓存或调用Apify (Fast Lane核心)
    // ================================================
    let apifyData: any
    let cacheHit = false
    let auditId: string

    try {
      const cached = await getCachedOrFetch(cleanUsername, skip_cache)
      apifyData = cached.data
      cacheHit = cached.cacheHit
      auditId = cached.auditId || randomUUID()

      console.log(`[Cache] ${cacheHit ? 'Hit' : 'Miss'} - ${Date.now() - startTime}ms`)

    } catch (error: any) {
      // 处理Apify错误
      if (error.message === 'PROFILE_NOT_FOUND') {
        return NextResponse.json({
          error: AuditErrorCode.PROFILE_NOT_FOUND,
          ...ERROR_UI_MESSAGES.PROFILE_NOT_FOUND
        }, { status: 404 })
      }

      if (error.message === 'PROFILE_PRIVATE') {
        return NextResponse.json({
          error: AuditErrorCode.PROFILE_PRIVATE,
          ...ERROR_UI_MESSAGES.PROFILE_PRIVATE
        }, { status: 403 })
      }

      throw error
    }

    // ================================================
    // Step 2: Fast Lane 数据解析 (使用AI Prompt Set 1)
    // ================================================
    const parsedData = await parseFastLaneData(apifyData)

    console.log(`[Fast Lane] Parsed in ${Date.now() - startTime}ms`)

    // ================================================
    // Step 3: 存储到数据库
    // ================================================
    if (!cacheHit) {
      await supabaseAdmin
        .from('audits')
        .insert({
          id: auditId,
          username: cleanUsername,
          apify_raw_data: apifyData,
          profile_snapshot: parsedData.profile_snapshot,
          diagnosis_card: parsedData.diagnosis_card,
          status: 'snapshot_ready'  // ⚠️ 不触发后台任务!
        })
    }

    // ================================================
    // Step 4: 立即返回Fast Lane结果
    // ================================================
    // 🚨 Serverless架构修正:
    // - 不在此处触发Slow Lane任务 (进程会被冻结)
    // - Slow Lane改为"懒加载"模式
    // - 当前端建立SSE连接时才开始AI生成
    const totalTime = Date.now() - startTime
    console.log(`[Audit Init] Completed in ${totalTime}ms`)

    return NextResponse.json({
      audit_id: auditId,
      status: 'snapshot_ready',
      profile_snapshot: parsedData.profile_snapshot,
      diagnosis_card: parsedData.diagnosis_card,
      created_at: new Date().toISOString(),
      cache_hit: cacheHit,
      performance: {
        total_time_ms: totalTime,
        cached: cacheHit
      }
    })

  } catch (error: any) {
    console.error('[Audit Init] Fatal error:', error)

    return NextResponse.json({
      error: AuditErrorCode.DATABASE_ERROR,
      message: error.message,
      ui_message: '系统错误,请稍后重试'
    }, { status: 500 })
  }
}

// 🚨 原triggerSlowLaneProcessing函数已删除
// Serverless架构下,后台任务会在响应返回后被冻结
// 改为在SSE连接时才执行AI生成 (见下方SSE实现)
```

---

## 🐌 Slow Lane 实现 (懒加载模式)

### 🚨 Serverless架构关键修正

**核心原则**: SSE连接建立时才执行AI生成,利用长连接保持进程存活。

### Route: GET /api/audit/[auditId]/strategy (SSE)

```typescript
// app/api/audit/[auditId]/strategy/route.ts

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateStrategyPrompt, STRATEGIC_DIRECTOR_SYSTEM_PROMPT } from '@/lib/ai/prompts/strategic-director'
import { callGemini } from '@/lib/ai/gemini'

export const runtime = 'nodejs' // ⚠️ 使用Node.js运行时,支持长连接
export const maxDuration = 60   // ⚠️ 最大执行时间60秒 (Vercel Pro需要)

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  const { auditId } = params
  const startTime = Date.now()

  // ================================================
  // 创建SSE响应流 (保持连接活跃)
  // ================================================
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 辅助函数: 发送SSE事件
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        // 心跳机制 (防止Vercel超时)
        const heartbeat = setInterval(() => {
          sendEvent('ping', { timestamp: Date.now() })
        }, 15000)

        // ================================================
        // Step 1: 获取Audit记录
        // ================================================
        sendEvent('status', { phase: 'loading', progress: 0 })

        const { data: audit, error } = await supabaseAdmin
          .from('audits')
          .select('*')
          .eq('id', auditId)
          .single()

        if (error || !audit) {
          clearInterval(heartbeat)
          sendEvent('error', { error: 'AUDIT_NOT_FOUND' })
          controller.close()
          return
        }

        // ================================================
        // Step 2: 检查是否已有缓存策略 (情况A)
        // ================================================
        if (audit.strategy_section && audit.execution_calendar) {
          console.log(`[SSE] Cache hit - returning existing strategy`)

          clearInterval(heartbeat)
          sendEvent('complete', {
            strategy_section: audit.strategy_section,
            execution_calendar: audit.execution_calendar,
            cached: true
          })
          controller.close()
          return
        }

        // ================================================
        // Step 3: 情况B - 无缓存,开始AI生成 (懒加载核心)
        // ================================================
        console.log(`[SSE] No cache - starting AI generation for: ${auditId}`)

        // 标记为"分析中"
        await supabaseAdmin
          .from('audits')
          .update({ status: 'analyzing', progress: 10 })
          .eq('id', auditId)

        sendEvent('status', { phase: 'analyzing', progress: 10 })

        // ================================================
        // Step 4: AI Prompt Set 2 (Strategic Director)
        // ================================================
        const profileSnapshot = audit.profile_snapshot
        const rawBio = audit.apify_raw_data?.biography || ''
        const category = profileSnapshot?.profile_snapshot?.category_label || 'Local Business'

        const promptText = generateStrategyPrompt(profileSnapshot, rawBio)

        sendEvent('status', { phase: 'generating_persona', progress: 30 })

        // 🔥 关键: SSE连接保持进程存活,AI可以安全执行
        const aiResponse = await callGemini(
          promptText,
          STRATEGIC_DIRECTOR_SYSTEM_PROMPT,
          {
            timeout: 45000  // 45秒超时
          }
        )

        // 更新进度
        await supabaseAdmin
          .from('audits')
          .update({ progress: 60 })
          .eq('id', auditId)

        sendEvent('status', { phase: 'building_calendar', progress: 60 })

        // ================================================
        // Step 5: 解析AI响应
        // ================================================
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('AI_PARSE_ERROR')
        }

        const strategyData = JSON.parse(jsonMatch[0])

        sendEvent('status', { phase: 'finalizing', progress: 90 })

        // ================================================
        // Step 6: 保存到数据库 (持久化)
        // ================================================
        await supabaseAdmin
          .from('audits')
          .update({
            strategy_section: strategyData.strategy_section,
            execution_calendar: strategyData.execution_calendar,
            status: 'completed',
            progress: 100,
            ai_model_used: 'gemini-3-pro-preview',
            generation_time_ms: Date.now() - startTime
          })
          .eq('id', auditId)

        // ================================================
        // Step 7: 发送完成事件
        // ================================================
        clearInterval(heartbeat)
        sendEvent('complete', {
          ...strategyData,
          cached: false,
          generation_time_ms: Date.now() - startTime
        })

        console.log(`[SSE] Strategy completed in ${Date.now() - startTime}ms`)
        controller.close()

      } catch (error: any) {
        console.error('[SSE] Error:', error)

        // 清理心跳
        clearInterval(heartbeat)

        const errorCode = error.message === 'AI_PARSE_ERROR'
          ? AuditErrorCode.AI_PARSE_ERROR
          : AuditErrorCode.AI_TIMEOUT

        // 保存错误状态
        await supabaseAdmin
          .from('audits')
          .update({
            status: 'failed',
            error_code: errorCode,
            error_message: error.message
          })
          .eq('id', auditId)

        // 推送错误事件
        controller.enqueue(encoder.encode(
          `event: error\ndata: ${JSON.stringify({
            error: errorCode,
            fallback_available: true,
            message: error.message
          })}\n\n`
        ))

        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // 禁用Nginx缓冲
    }
  })
}
```

---

### Route: GET /api/audit/[auditId]/status (轮询备用)

```typescript
// app/api/audit/[auditId]/status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    const { auditId } = params

    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      return NextResponse.json(
        { error: 'AUDIT_NOT_FOUND', message: 'Audit record not found' },
        { status: 404 }
      )
    }

    const response: any = {
      audit_id: audit.id,
      status: audit.status,
      progress: audit.progress || 0,
      created_at: audit.created_at
    }

    // 根据状态返回不同数据
    switch (audit.status) {
      case 'snapshot_ready':
      case 'analyzing':
        response.profile_snapshot = audit.profile_snapshot
        response.diagnosis_card = audit.diagnosis_card
        break

      case 'completed':
        response.result = {
          strategy_section: audit.strategy_section,
          execution_calendar: audit.execution_calendar
        }
        break

      case 'failed':
        response.error = audit.error_code
        response.error_message = audit.error_message
        break
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Status API] Error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: (error as Error).message },
      { status: 500 }
    )
  }
}
```

---

## 🧠 AI调用实现

### Profile Analyst (Prompt Set 1)

```typescript
// lib/ai/profile-analyst.ts

import { callGemini } from './gemini'

export const PROFILE_ANALYST_SYSTEM_PROMPT = `
# Role
你是一个 Instagram 账号数据分析专家。你的任务是接收原始的 JSON 数据(由 Apify 抓取),提取关键业务字段,并对账号的健康度进行客观诊断。

# Analysis Logic
1. **活跃度判定**:
   - Active: 最新贴在 7 天内
   - Dormant: 最新贴在 7-30 天内
   - Inactive: 最新贴 > 30 天

2. **完整性检查**:
   - 检查是否有 Website Link (externalUrl)
   - 检查 Bio 中是否包含 Location 信息

3. **行业推断**:
   - 优先使用 businessCategoryName
   - 如果为空,根据 biography 和 username 推断

4. **健康度打分**:
   - 满分 100 分,基础分 60
   - 扣分项: 不活跃(-20), 无链接(-10), 无地址(-10), 标签混乱(-10)

# Output Format (严格JSON)
{
  "profile_snapshot": {
    "handle": "@username",
    "full_name": "Full Name",
    "avatar_url": "url",
    "is_verified": false,
    "followers_display": "1.2K",
    "activity_status": "Active",
    "last_post_date": "2025-01-26",
    "avg_likes": 128,
    "category_label": "Coffee Shop",
    "missing_elements": ["Website"]
  },
  "diagnosis_card": {
    "score": 64,
    "summary_title": "Great Foundation, Missed Opportunities",
    "key_issues": [
      "Bio缺少地址信息,本地客户难以找到门店位置",
      "最近5篇帖子未使用本地标签,错失本地流量",
      "视觉风格不统一,难以建立品牌记忆"
    ]
  }
}
`

export async function parseFastLaneData(apifyRawData: any) {
  const prompt = `
请分析以下 Instagram 账号数据:

=== 基础信息 ===
用户名: ${apifyRawData.username}
全名: ${apifyRawData.fullName}
Bio: ${apifyRawData.biography || '(空)'}
头像: ${apifyRawData.profilePicUrl}
粉丝数: ${apifyRawData.followersCount}
关注数: ${apifyRawData.followingCount}
帖子数: ${apifyRawData.postsCount}
认证状态: ${apifyRawData.verified ? '已认证' : '未认证'}
行业类别: ${apifyRawData.businessCategoryName || '未知'}
外部链接: ${apifyRawData.externalUrl || '无'}

=== 最近帖子数据 ===
${JSON.stringify(apifyRawData.latestPosts?.slice(0, 6) || [], null, 2)}

请按照系统提示词中的JSON格式输出分析结果。
`

  try {
    const response = await callGemini(prompt, PROFILE_ANALYST_SYSTEM_PROMPT)

    // 提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[Fast Lane] AI返回格式错误,使用智能降级')
      return getFastLaneFallback(apifyRawData)
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 添加最近帖子预览
    parsed.profile_snapshot.recent_posts_preview = (apifyRawData.latestPosts || [])
      .slice(0, 5)
      .map((post: any) => ({
        thumbnail_url: post.displayUrl,
        type: post.type,
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0
      }))

    return parsed

  } catch (error) {
    console.error('[Fast Lane] Parse error:', error)
    return getFastLaneFallback(apifyRawData)
  }
}

/**
 * Fast Lane 智能降级 (不依赖AI)
 */
function getFastLaneFallback(rawData: any) {
  // 计算活跃度
  const lastPostTimestamp = rawData.latestPosts?.[0]?.timestamp
  const daysSinceLastPost = lastPostTimestamp
    ? Math.floor((Date.now() - new Date(lastPostTimestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const activityStatus =
    daysSinceLastPost <= 7 ? 'Active' :
    daysSinceLastPost <= 30 ? 'Dormant' : 'Inactive'

  // 计算平均点赞
  const avgLikes = rawData.latestPosts?.length > 0
    ? Math.floor(
        rawData.latestPosts.reduce((sum: number, p: any) => sum + (p.likesCount || 0), 0) /
        rawData.latestPosts.length
      )
    : 0

  // 检查缺失元素
  const missingElements = []
  if (!rawData.externalUrl) missingElements.push('Website')
  if (!rawData.biography?.match(/\d{1,5}\s+\w+\s+(St|Ave|Blvd|Rd)/i)) {
    missingElements.push('Location')
  }

  // 计算评分
  let score = 60 // 基础分
  if (activityStatus === 'Inactive') score -= 20
  if (activityStatus === 'Dormant') score -= 10
  if (missingElements.includes('Website')) score -= 10
  if (missingElements.includes('Location')) score -= 10

  return {
    profile_snapshot: {
      handle: rawData.username,
      full_name: rawData.fullName || rawData.username,
      avatar_url: rawData.profilePicUrl || '',
      is_verified: rawData.verified || false,
      followers_display: formatFollowerCount(rawData.followersCount || 0),
      activity_status: activityStatus,
      last_post_date: lastPostTimestamp
        ? new Date(lastPostTimestamp).toISOString().split('T')[0]
        : 'Unknown',
      avg_likes: avgLikes,
      category_label: rawData.businessCategoryName || inferCategory(rawData),
      missing_elements: missingElements,
      recent_posts_preview: (rawData.latestPosts || []).slice(0, 5).map((p: any) => ({
        thumbnail_url: p.displayUrl,
        type: p.type,
        likes: p.likesCount || 0,
        comments: p.commentsCount || 0
      }))
    },
    diagnosis_card: {
      score: Math.max(0, Math.min(100, score)),
      summary_title: score >= 70
        ? 'Solid Foundation, Minor Tweaks Needed'
        : score >= 50
        ? 'Good Start, Optimization Required'
        : 'Critical Issues Detected',
      key_issues: generateIssues(rawData, missingElements, activityStatus)
    }
  }
}

function formatFollowerCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

function inferCategory(rawData: any): string {
  const bio = rawData.biography?.toLowerCase() || ''
  const username = rawData.username?.toLowerCase() || ''

  const patterns: Record<string, string[]> = {
    'Coffee Shop': ['coffee', 'cafe', 'espresso', 'latte'],
    'Restaurant': ['restaurant', 'dining', 'food', 'cuisine'],
    'Nail Salon': ['nail', 'manicure', 'pedicure', 'spa'],
    'Hair Salon': ['hair', 'salon', 'barber', 'stylist'],
    'Fitness': ['gym', 'fitness', 'yoga', 'training'],
    'Realtor': ['realtor', 'real estate', 'property', 'homes'],
    'Boutique': ['boutique', 'fashion', 'clothing', 'apparel']
  }

  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(k => bio.includes(k) || username.includes(k))) {
      return category
    }
  }

  return 'Local Business'
}

function generateIssues(
  rawData: any,
  missingElements: string[],
  activityStatus: string
): string[] {
  const issues: string[] = []

  // 活跃度问题
  if (activityStatus === 'Inactive') {
    issues.push('账号已超过30天未更新,算法会大幅降低你的内容曝光率')
  } else if (activityStatus === 'Dormant') {
    issues.push('发帖频率偏低,建议保持每周2-3次的规律更新')
  }

  // 缺失元素
  if (missingElements.includes('Website')) {
    issues.push('Bio缺少网站链接,白白流失了引流到官网或预订页面的机会')
  }
  if (missingElements.includes('Location')) {
    issues.push('Bio缺少地址信息,本地客户难以找到门店位置')
  }

  // 标签问题
  const recentHashtags = rawData.latestPosts
    ?.flatMap((p: any) => p.hashtags || [])
    .filter(Boolean)

  if (!recentHashtags || recentHashtags.length === 0) {
    issues.push('最近帖子完全没有使用标签,严重影响内容的可发现性')
  } else {
    const hasLocalTag = recentHashtags.some((tag: string) =>
      /NYC|Seattle|LA|SF|Chicago/i.test(tag)
    )
    if (!hasLocalTag) {
      issues.push('未使用本地标签(如#城市名),错失本地客户搜索流量')
    }
  }

  // 视觉一致性
  const postTypes = rawData.latestPosts?.map((p: any) => p.type) || []
  const uniqueTypes = new Set(postTypes)
  if (uniqueTypes.size > 3 && postTypes.length > 5) {
    issues.push('帖子格式过于分散(图文/视频/轮播混杂),建议形成固定的视觉风格')
  }

  return issues.slice(0, 3)
}
```

### ⚠️ Serverless部署配置 (Vercel)

```typescript
// app/api/audit/[auditId]/strategy/route.ts

// 🚨 关键配置: 必须添加这两行
export const runtime = 'nodejs'    // 使用Node.js运行时(非Edge)
export const maxDuration = 60      // 最大执行60秒 (需要Vercel Pro)

// 如果使用Vercel Free Plan (10秒限制)
// 需要分段生成或使用外部队列服务
```

**为什么这样设计?**

```
❌ 错误方式 (进程会被冻结):
POST /api/audit/init
  └─→ 返回Response
       └─→ 触发后台任务 triggerSlowLane()
            ↓
           🔴 进程冻结,AI任务中断!

✅ 正确方式 (懒加载):
POST /api/audit/init
  └─→ 返回Response (仅Fast Lane数据)
       ↓
      前端建立SSE连接
       ↓
GET /api/audit/{id}/strategy (SSE)
  └─→ 连接保持活跃
       └─→ 在连接内执行AI生成
            ↓
           ✅ 进程存活,AI安全完成!
```

---

## 📊 进度追踪实现

### 进度更新辅助函数

```typescript
// lib/utils/progress-tracker.ts

export async function updateProgress(
  auditId: string,
  progress: number,
  phase: string
) {
  await supabaseAdmin
    .from('audits')
    .update({
      progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', auditId)

  console.log(`[Progress] ${auditId}: ${phase} - ${progress}%`)
}

// 使用示例
await updateProgress(auditId, 10, 'analyzing')
await updateProgress(auditId, 30, 'generating_persona')
await updateProgress(auditId, 60, 'building_calendar')
await updateProgress(auditId, 100, 'completed')
```

---

## 🔐 安全与限流

### Rate Limiting 中间件

```typescript
// middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const RATE_LIMIT_CONFIG = {
  free_user: {
    requests_per_day: 3,
    requests_per_hour: 1
  },
  authenticated_user: {
    requests_per_day: 10,
    requests_per_hour: 3
  }
}

export async function checkRateLimit(
  identifier: string,  // IP地址或用户ID
  tier: 'free_user' | 'authenticated_user' = 'free_user'
): Promise<{ allowed: boolean; retryAfter?: number }> {

  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 查询最近的请求记录
  const { data: recentRequests } = await supabaseAdmin
    .from('audits')
    .select('created_at')
    .eq('user_id', identifier)
    .gte('created_at', dayAgo.toISOString())

  if (!recentRequests) return { allowed: true }

  const requestsInLastHour = recentRequests.filter(
    r => new Date(r.created_at) > hourAgo
  ).length

  const requestsInLastDay = recentRequests.length

  const limits = RATE_LIMIT_CONFIG[tier]

  // 检查是否超限
  if (requestsInLastHour >= limits.requests_per_hour) {
    return {
      allowed: false,
      retryAfter: 3600 // 1小时
    }
  }

  if (requestsInLastDay >= limits.requests_per_day) {
    return {
      allowed: false,
      retryAfter: 86400 // 24小时
    }
  }

  return { allowed: true }
}

// 在API Route中使用
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const rateLimitCheck = await checkRateLimit(ip)
  if (!rateLimitCheck.allowed) {
    return NextResponse.json({
      error: 'RATE_LIMIT_EXCEEDED',
      retry_after: rateLimitCheck.retryAfter,
      message: '您已达到今日免费额度限制'
    }, { status: 429 })
  }

  // 继续处理请求...
}
```

---

## 🎯 完整请求流程示例

### 场景: 用户输入 @zongzi_coffee

```typescript
// ================================================
// Timeline: 用户体验时间线
// ================================================

// T+0ms: 用户提交表单
POST /api/audit/init { username: "zongzi_coffee" }

// T+50ms: 数据库缓存检查
[Cache] Checking for existing audit within 24h...
[Cache] Miss - proceeding to Apify

// T+3500ms: Apify爬虫完成
[Apify] Scrape completed:
{
  username: "zongzi_coffee",
  followers: 1247,
  posts: 83,
  category: "Coffee Shop"
}

// T+4200ms: AI Fast Lane解析
[AI Prompt 1] Parsing profile data...
[AI Prompt 1] Response: { score: 64, activity: "Dormant" }

// T+4500ms: 返回Fast Lane结果
Response 200 OK:
{
  audit_id: "uuid-xxx",
  status: "snapshot_ready",
  profile_snapshot: { ... },  // ✅ 前端立即渲染
  diagnosis_card: { ... }      // ✅ 前端立即渲染
}

// T+4500ms: 后台触发Slow Lane (非阻塞)
[Background Task] Starting AI strategy generation...

// T+5000ms: 前端建立SSE连接
GET /api/audit/{id}/strategy
Connection: keep-alive

// T+8000ms: AI生成品牌人设
SSE Event: status
data: {"phase": "generating_persona", "progress": 30}

// T+15000ms: AI生成内容日历
SSE Event: status
data: {"phase": "building_calendar", "progress": 60}

// T+25000ms: 完成
SSE Event: complete
data: {
  strategy_section: { ... },      // ✅ 前端渲染策略
  execution_calendar: { ... }      // ✅ 前端渲染日历
}

// ================================================
// 用户感知: 页面分步渲染,无白屏等待
// ================================================
```

---

## 🛡️ 错误处理完整示例

```typescript
// app/api/audit/init/route.ts (完整版)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, skip_cache = false } = body

    // ================================================
    // 1. 参数验证
    // ================================================
    if (!username) {
      return NextResponse.json({
        error: 'INVALID_INPUT',
        field: 'username',
        message: 'Username is required'
      }, { status: 400 })
    }

    // ================================================
    // 2. Rate Limiting
    // ================================================
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = await checkRateLimit(ip)

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: AuditErrorCode.APIFY_RATE_LIMIT,
        retry_after: rateLimit.retryAfter,
        ui_message: '您已达到今日免费额度,请明天再试或升级至Pro版'
      }, { status: 429 })
    }

    // ================================================
    // 3. 缓存检查
    // ================================================
    const cached = await getCachedOrFetch(username, skip_cache)

    // ================================================
    // 4. Fast Lane解析
    // ================================================
    const parsed = await parseFastLaneData(cached.data)

    // ================================================
    // 5. 触发Slow Lane
    // ================================================
    if (!cached.cacheHit) {
      triggerSlowLaneProcessing(cached.auditId, cached.data, parsed)
    }

    // ================================================
    // 6. 返回结果
    // ================================================
    return NextResponse.json({
      audit_id: cached.auditId,
      status: 'snapshot_ready',
      ...parsed,
      cache_hit: cached.cacheHit
    })

  } catch (error: any) {
    // ================================================
    // 全局错误处理
    // ================================================
    console.error('[Audit Init] Error:', error)

    const errorCode = error.message as AuditErrorCode
    const errorInfo = ERROR_UI_MESSAGES[errorCode] || {
      title: '系统错误',
      message: error.message,
      action: '返回首页'
    }

    return NextResponse.json({
      error: errorCode || 'UNKNOWN_ERROR',
      ...errorInfo
    }, { status: error.message === 'PROFILE_NOT_FOUND' ? 404 : 500 })
  }
}
```

---

## 🔧 环境变量配置

```bash
# .env.local

# Apify
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx

# DeerAPI (Gemini)
DEER_API_BASE_URL=https://api.deerapi.com
DEER_API_KEY=sk-xxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Sidewalk AI (预留)
SIDEWALK_API_KEY=sk-xxxxxxxxxxxxx

# 性能配置
APIFY_TIMEOUT_MS=10000
AI_GENERATION_TIMEOUT_MS=30000
CACHE_TTL_HOURS=24
```

---

## 📈 监控与日志

### 结构化日志

```typescript
// lib/logger.ts

export const logger = {
  audit: (auditId: string, event: string, meta?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      audit_id: auditId,
      event,
      ...meta
    }))
  }
}

// 使用示例
logger.audit(auditId, 'apify_scrape_started', { username })
logger.audit(auditId, 'apify_scrape_completed', { duration_ms: 3500 })
logger.audit(auditId, 'fast_lane_completed', { score: 64 })
logger.audit(auditId, 'slow_lane_started')
logger.audit(auditId, 'slow_lane_completed', { duration_ms: 25000 })
```

---

**文档版本**: v1.0
**最后更新**: 2025-01-28
