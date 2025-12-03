/**
 * Target Audience API - 独立生成目标受众分析
 * 这是用户brewhahacafe报错的模块，通过独立API解决超时问题
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AUDIENCE_SYSTEM_PROMPT, generateAudiencePrompt } from '@/lib/ai/prompts/micro-strategy'
import { callGemini, parseJSON } from '@/lib/ai/gemini-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[Audience API] 📤 Request received for audit: ${auditId}`)

  try {
    // 1. 检查缓存
    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      console.error('[Audience API] ❌ Audit not found:', error)
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: 'Audit record not found'
      }, { status: 404 })
    }

    // 如果已有target_audience,直接返回缓存
    if (audit.strategy_section?.target_audience) {
      console.log('[Audience API] ✅ Cache hit, returning cached data')
      return Response.json({
        success: true,
        target_audience: audit.strategy_section.target_audience,
        cached: true
      })
    }

    // 2. 准备上下文数据
    const promptContext = {
      category: audit.profile_snapshot?.category_label || '本地商家',
      bio: audit.apify_raw_data?.profile?.biography || ''
    }

    console.log('[Audience API] 🔄 Analyzing target audience with AI...')

    // 3. 调用AI生成
    const audienceResponse = await callGemini(
      generateAudiencePrompt(promptContext),
      AUDIENCE_SYSTEM_PROMPT,
      1000
    )

    const audienceData = parseJSON(audienceResponse, 'Audience')

    // 确保返回数组格式（2个对象：Main + Secondary）
    const audienceArray = Array.isArray(audienceData) ? audienceData : [audienceData]

    console.log('[Audience API] ✅ AI generation completed, profiles:', audienceArray.length)

    // 4. 保存到数据库
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        strategy_section: {
          ...audit.strategy_section,
          target_audience: audienceArray
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('[Audience API] ❌ Database update failed:', updateError)
      throw new Error('Failed to save audience data')
    }

    const duration = Date.now() - startTime

    console.log(`[Audience API] ✅ Completed in ${duration}ms`)

    return Response.json({
      success: true,
      target_audience: audienceArray,
      cached: false,
      generation_time_ms: duration
    })

  } catch (error: any) {
    console.error('[Audience API] ❌ Fatal error:', error)

    return Response.json({
      success: false,
      error: 'AI_GENERATION_FAILED',
      message: error.message || 'Failed to generate target audience analysis'
    }, { status: 500 })
  }
}
