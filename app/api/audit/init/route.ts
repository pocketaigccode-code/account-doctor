/**
 * Fast Lane API - 真正的双速响应架构
 * 阶段1: 立即返回Apify原始数据 (0等待)
 * 阶段2: 异步AI增强数据 (后台处理)
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getCachedOrFetch, getExpiresAt } from '@/lib/cache/apify-cache'
import { generateAnalystPrompt, PROFILE_ANALYST_SYSTEM_PROMPT, getFastLaneFallback } from '@/lib/ai/prompts/profile-analyst'
import type { InstagramScanData } from '@/lib/scrapers/instagram'

// 临时使用现有的callGemini (后续会优化)
async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

  console.log('[AI Call] 📤 发送请求到 DeerAPI')
  console.log('[AI Call] 模型:', 'gemini-3-pro-preview')
  console.log('[AI Call] System Prompt 长度:', systemPrompt.length, '字符')
  console.log('[AI Call] User Prompt 长度:', prompt.length, '字符')
  console.log('[AI Call] User Prompt 预览:', prompt.substring(0, 500))

  const response = await fetch(`${DEERAPI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEERAPI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-3-pro-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AI Call] ❌ DeerAPI 错误:', response.status, errorText)
    throw new Error(`DeerAPI调用失败: ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content || ''

  console.log('[AI Call] 📥 收到响应')
  console.log('[AI Call] 响应长度:', aiResponse.length, '字符')
  console.log('[AI Call] 响应预览:', aiResponse.substring(0, 500))

  return aiResponse
}

/**
 * 从Apify原始数据生成即时可用的数据
 */
function generateInstantData(scanData: InstagramScanData) {
  const { profile, recentPosts } = scanData

  // 计算平均点赞
  const avgLikes = recentPosts.length > 0
    ? Math.floor(recentPosts.reduce((sum, p) => sum + p.likeCount, 0) / recentPosts.length)
    : 0

  // 计算活跃度
  const lastPostTimestamp = recentPosts[0]?.publishedAt
  const daysSinceLastPost = lastPostTimestamp
    ? Math.floor((Date.now() - new Date(lastPostTimestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const activityStatus: 'Active' | 'Dormant' | 'Inactive' =
    daysSinceLastPost <= 7 ? 'Active' :
    daysSinceLastPost <= 30 ? 'Dormant' : 'Inactive'

  return {
    // 基础身份信息 (直接从Apify获取,0计算)
    username: profile.username,
    full_name: profile.fullName,
    avatar_url: profile.profilePicUrl || '',
    bio: profile.biography || '',
    is_verified: profile.isVerified || false,

    // 统计数据 (直接从Apify获取,0计算)
    follower_count: profile.followerCount,
    following_count: profile.followingCount,
    post_count: profile.postCount,

    // 简单计算字段 (毫秒级计算)
    activity_status: activityStatus,
    last_post_date: lastPostTimestamp
      ? new Date(lastPostTimestamp).toISOString().split('T')[0]
      : 'Unknown',
    avg_likes: avgLikes,

    // 帖子预览
    recent_posts_preview: recentPosts.slice(0, 5).map((post: any) => {
      const thumbnailUrl = post.displayUrl || post.mediaUrls?.[0] || ''
      console.log('[帖子图片] displayUrl:', post.displayUrl, 'mediaUrls:', post.mediaUrls, '最终URL:', thumbnailUrl)
      return {
        thumbnail_url: thumbnailUrl,
        type: post.type,
        likes: post.likeCount,
        comments: post.commentCount
      }
    }),

    // 行业类别 (优先使用businessCategoryName)
    category_label: profile.businessCategoryName || '本地商家'
  }
}

/**
 * 后台异步处理: AI增强分析
 */
async function processAIEnhancement(auditId: string, scanData: InstagramScanData) {
  try {
    console.log(`[AI Enhancement] Starting for audit: ${auditId}`)
    console.log(`[AI Enhancement] 账号信息:`, {
      username: scanData.profile.username,
      followers: scanData.profile.followerCount,
      posts: scanData.recentPosts.length,
      lastPost: scanData.recentPosts[0]?.publishedAt
    })

    const prompt = generateAnalystPrompt(scanData)
    const aiResponse = await callGemini(prompt, PROFILE_ANALYST_SYSTEM_PROMPT)

    // 提取JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI返回格式错误,无法解析JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])

    console.log('[AI Enhancement] 📊 解析后的数据:', {
      category: parsed.profile_snapshot?.category_label,
      missing: parsed.profile_snapshot?.missing_elements,
      score: parsed.diagnosis_card?.score,
      summary: parsed.diagnosis_card?.summary_title
    })

    const aiEnhancedData = {
      category_label: parsed.profile_snapshot?.category_label || '未知',
      missing_elements: parsed.profile_snapshot?.missing_elements || [],
      diagnosis_card: parsed.diagnosis_card
    }

    // 验证必要字段
    if (!aiEnhancedData.diagnosis_card || !aiEnhancedData.diagnosis_card.score) {
      console.error('[AI Enhancement] ❌ 数据验证失败:', aiEnhancedData)
      throw new Error('AI返回数据缺少必要字段')
    }

    // 获取现有的profile_snapshot
    const { data: existingAudit } = await supabaseAdmin
      .from('audits')
      .select('profile_snapshot')
      .eq('id', auditId)
      .single()

    // 更新数据库
    await supabaseAdmin
      .from('audits')
      .update({
        // 合并AI增强数据到profile_snapshot
        profile_snapshot: {
          ...(existingAudit?.profile_snapshot || {}),
          category_label: aiEnhancedData.category_label,
          missing_elements: aiEnhancedData.missing_elements
        },
        diagnosis_card: aiEnhancedData.diagnosis_card,
        status: 'snapshot_ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    console.log(`[AI Enhancement] ✅ Completed for audit: ${auditId}`)

  } catch (error: any) {
    console.error('[AI Enhancement] Failed:', error)

    // AI失败时标记为失败状态,不使用降级方案
    await supabaseAdmin
      .from('audits')
      .update({
        status: 'ai_failed',
        error_code: 'AI_ENHANCEMENT_FAILED',
        error_message: error.message || 'AI分析失败'
      })
      .eq('id', auditId)

    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { username, skip_cache = false } = body

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_USERNAME',
          message: 'Username is required',
          ui_message: '请输入有效的Instagram用户名'
        },
        { status: 400 }
      )
    }

    // 清理用户名
    const cleanUsername = username.trim().toLowerCase().replace('@', '')

    console.log(`[Audit Init] Starting for: ${cleanUsername}`)

    // ================================================
    // Step 1: 检查缓存或调用Apify
    // ================================================
    let scanData: any
    let cacheHit = false
    let auditId: string | undefined

    try {
      const cached = await getCachedOrFetch(cleanUsername, skip_cache)
      scanData = cached.data
      cacheHit = cached.cacheHit
      auditId = cached.auditId

      console.log(`[Cache] ${cacheHit ? '✅ Hit' : '❌ Miss'} - ${Date.now() - startTime}ms`)

    } catch (error: any) {
      // 处理Apify错误
      if (error.message === 'PROFILE_NOT_FOUND') {
        return NextResponse.json({
          error: 'PROFILE_NOT_FOUND',
          message: "This account doesn't exist or is private",
          ui_message: '抱歉,该账号不存在或已设为私密'
        }, { status: 404 })
      }

      throw error
    }

    // ================================================
    // Step 2: 立即生成即时数据 (0 AI等待)
    // ================================================
    const instantData = generateInstantData(scanData)

    console.log(`[Instant Data] Generated in ${Date.now() - startTime}ms`)

    // ================================================
    // Step 3: 保存初始数据到数据库
    // ================================================
    if (!cacheHit) {
      auditId = randomUUID()

      await supabaseAdmin
        .from('audits')
        .insert({
          id: auditId,
          username: cleanUsername,
          apify_raw_data: scanData,
          profile_snapshot: instantData,  // 先保存即时数据
          status: 'analyzing',  // 标记为分析中
          expires_at: getExpiresAt().toISOString()
        })

      console.log(`[Database] Saved initial data for: ${auditId}`)

      // ================================================
      // Step 4: 触发后台AI增强 (不等待)
      // ================================================
      // 使用 Promise 立即触发,但不等待结果
      processAIEnhancement(auditId, scanData).catch(err => {
        console.error('[Background AI] Error:', err)
      })

      console.log(`[Background AI] Triggered for: ${auditId}`)
    }

    // ================================================
    // Step 5: 立即返回即时数据给前端
    // ================================================
    const totalTime = Date.now() - startTime
    console.log(`[Audit Init] ✅ Returned instant data in ${totalTime}ms`)

    return NextResponse.json({
      audit_id: auditId,
      status: cacheHit ? 'snapshot_ready' : 'analyzing',  // 新数据标记为analyzing
      instant_data: instantData,
      has_ai_enhancement: cacheHit,  // 缓存命中的已经有AI数据
      created_at: new Date().toISOString(),
      cache_hit: cacheHit,
      expires_at: cacheHit ? undefined : getExpiresAt().toISOString(),
      performance: {
        total_time_ms: totalTime,
        cached: cacheHit
      }
    })

  } catch (error: any) {
    console.error('[Audit Init] Fatal error:', error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: error.message,
      ui_message: '系统错误,请稍后重试'
    }, { status: 500 })
  }
}
