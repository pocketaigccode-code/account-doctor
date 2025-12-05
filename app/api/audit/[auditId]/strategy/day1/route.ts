/**
 * Day 1 Content API - 独立生成首日内容
 * 依赖brand_persona数据，需要更多tokens生成详细内容
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DAY1_SYSTEM_PROMPT, generateDay1Prompt } from '@/lib/ai/prompts/micro-strategy'
import { callGemini, parseJSON } from '@/lib/ai/gemini-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[Day1 API] 📤 Request received for audit: ${auditId}`)

  try {
    // 1. 检查缓存
    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      console.error('[Day1 API] ❌ Audit not found:', error)
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: 'Audit record not found'
      }, { status: 404 })
    }

    // 如果已有day_1_detail,直接返回缓存
    if (audit.execution_calendar?.day_1_detail) {
      console.log('[Day1 API] ✅ Cache hit, returning cached data')
      return Response.json({
        success: true,
        day_1_detail: audit.execution_calendar.day_1_detail,
        cached: true
      })
    }

    // 2. 检查依赖：必须先有brand_persona
    if (!audit.strategy_section?.brand_persona) {
      console.error('[Day1 API] ❌ Brand persona not ready')
      return Response.json({
        success: false,
        error: 'PERSONA_NOT_READY',
        message: 'Brand persona must be generated first. Please wait for persona to complete.'
      }, { status: 400 })
    }

    // 3. 准备上下文数据
    const promptContext = {
      category: audit.profile_snapshot?.category_label || '本地商家',
      bio: audit.apify_raw_data?.profile?.biography || '',
      persona: audit.strategy_section.brand_persona
    }

    console.log('[Day1 API] 🔄 Creating Day 1 content with AI...')

    // 4. 调用AI生成 - 使用2000 tokens生成详细内容
    const day1Response = await callGemini(
      generateDay1Prompt(promptContext),
      DAY1_SYSTEM_PROMPT,
      2000  // 需要更多tokens生成450-500字文案
    )

    const day1Data = parseJSON(day1Response, 'Day1')

    console.log('[Day1 API] ✅ AI generation completed')

    // 直接从audit记录读取Pexels关键词（优先从列读取，降级到JSONB）
    const pexelsQuery = audit.pexels_query || audit.profile_snapshot?.pexels_query || 'business professional modern'
    console.log(`[Day1 API] 📸 使用Pexels关键词: "${pexelsQuery}"`)

    // 将pexels_query添加到day1Data
    const enrichedDay1Data = {
      ...day1Data,
      pexels_query: pexelsQuery
    }

    // 5. 保存到数据库 - 注意保存到execution_calendar字段
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        execution_calendar: {
          ...audit.execution_calendar,
          day_1_detail: enrichedDay1Data
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('[Day1 API] ❌ Database update failed:', updateError)
      throw new Error('Failed to save Day 1 content')
    }

    const duration = Date.now() - startTime

    console.log(`[Day1 API] ✅ Completed in ${duration}ms`)

    return Response.json({
      success: true,
      day_1_detail: enrichedDay1Data,
      cached: false,
      generation_time_ms: duration
    })

  } catch (error: any) {
    console.error('[Day1 API] ❌ Fatal error:', error)

    return Response.json({
      success: false,
      error: 'AI_GENERATION_FAILED',
      message: error.message || 'Failed to generate Day 1 content'
    }, { status: 500 })
  }
}
