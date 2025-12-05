/**
 * Fast Lane API - Serverless友好的快速响应
 * 职责:
 *   1. Apify爬取Instagram数据 (3-5秒)
 *   2. 生成即时数据 (毫秒级)
 *   3. 立即返回 (不等待AI)
 *
 * AI诊断通过SSE懒加载: /api/audit/[id]/diagnosis
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getCachedOrFetch, getExpiresAt } from '@/lib/cache/apify-cache'
import type { InstagramScanData } from '@/lib/scrapers/instagram'
import { generateIndustryKeywordsWithAI } from '@/lib/pexels-helper'

/**
 * 从Apify原始数据生成即时可用的数据 (Fast Lane)
 */
function generateInstantData(scanData: InstagramScanData) {
  const { profile, recentPosts } = scanData

  // 计算平均点赞
  const avgLikes = recentPosts.length > 0
    ? Math.floor(recentPosts.reduce((sum, p) => sum + p.likeCount, 0) / recentPosts.length)
    : 0

  // 计算活跃度 - 增强空值处理
  const validPosts = recentPosts.filter(p => p.publishedAt !== null)
  const lastPostTimestamp = validPosts[0]?.publishedAt
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
    // Step 2.5: 🤖 AI行业识别（生成Pexels关键词）
    // ================================================
    let pexelsQuery = 'business professional modern' // 默认值

    try {
      const aiResult = await generateIndustryKeywordsWithAI({
        biography: scanData.profile?.biography,
        latestPosts: scanData.posts?.slice(0, 5).map((post: any) => ({
          caption: post.caption,
          hashtags: post.hashtags
        }))
      })

      if (aiResult && aiResult.length > 0) {
        pexelsQuery = aiResult
        console.log(`[AI Industry] ✅ Pexels关键词: "${pexelsQuery}"`)
      } else {
        console.warn('[AI Industry] ⚠️ AI返回空值，使用默认关键词')
      }
    } catch (error) {
      console.error('[AI Industry] ❌ 识别失败:', error)
      console.log('[AI Industry] 使用默认关键词: "business professional modern"')
      // 继续执行，不要中断整个流程
    }

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
          profile_snapshot: {
            ...instantData,
            pexels_query: pexelsQuery  // ✅ 向后兼容：也存储在JSONB中
          },
          pexels_query: pexelsQuery,  // ✅ 存储在新列中（migration已执行）
          status: 'snapshot_ready',
          expires_at: getExpiresAt().toISOString()
        })

      console.log(`[Database] Saved initial data for: ${auditId}`)

      // ================================================
      // 🔴 不再触发AI增强任务 (避免Serverless进程冻结问题)
      // ================================================
      // AI增强任务现在通过前端触发SSE连接来懒加载
      // 详见: /api/audit/[auditId]/strategy
      console.log(`[Fast Lane] AI enhancement will be triggered by SSE connection`)
    }

    // ================================================
    // Step 5: 返回数据给前端 (仅Fast Lane数据)
    // ================================================
    const totalTime = Date.now() - startTime
    console.log(`[Audit Init] ✅ Fast Lane completed in ${totalTime}ms`)

    return NextResponse.json({
      audit_id: auditId,
      status: cacheHit ? 'snapshot_ready' : 'pending_diagnosis',  // 新增状态:等待诊断
      instant_data: instantData,
      has_diagnosis: cacheHit,  // 缓存命中则已有诊断数据
      created_at: new Date().toISOString(),
      cache_hit: cacheHit,
      expires_at: getExpiresAt().toISOString(),
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
