/**
 * Content Mix API - 独立生成内容配比策略
 * 参考Month Plan的异步加载架构
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CONTENT_MIX_SYSTEM_PROMPT, generateContentMixPrompt } from '@/lib/ai/prompts/micro-strategy'
import { callGemini, parseJSON } from '@/lib/ai/gemini-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[ContentMix API] 📤 Request received for audit: ${auditId}`)

  try {
    // 1. 检查缓存
    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      console.error('[ContentMix API] ❌ Audit not found:', error)
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: 'Audit record not found'
      }, { status: 404 })
    }

    // 如果已有content_mix_chart,直接返回缓存
    if (audit.strategy_section?.content_mix_chart) {
      console.log('[ContentMix API] ✅ Cache hit, returning cached data')
      return Response.json({
        success: true,
        content_mix_chart: audit.strategy_section.content_mix_chart,
        cached: true
      })
    }

    // 2. 准备上下文数据
    const promptContext = {
      category: audit.profile_snapshot?.category_label || '本地商家',
      bio: audit.apify_raw_data?.profile?.biography || '',
      diagnosis_summary: audit.diagnosis_card?.summary_title || '需要改进'
    }

    console.log('[ContentMix API] 🔄 Generating content mix with AI...')

    // 3. 调用AI生成
    const mixResponse = await callGemini(
      generateContentMixPrompt(promptContext),
      CONTENT_MIX_SYSTEM_PROMPT,
      1000
    )

    const mixData = parseJSON(mixResponse, 'ContentMix')

    // 确保返回数组格式
    const mixArray = Array.isArray(mixData) ? mixData : (mixData.mix || [])

    console.log('[ContentMix API] ✅ AI generation completed, items:', mixArray.length)

    // 4. 保存到数据库
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        strategy_section: {
          ...audit.strategy_section,
          content_mix_chart: mixArray
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('[ContentMix API] ❌ Database update failed:', updateError)
      throw new Error('Failed to save content mix data')
    }

    const duration = Date.now() - startTime

    console.log(`[ContentMix API] ✅ Completed in ${duration}ms`)

    return Response.json({
      success: true,
      content_mix_chart: mixArray,
      cached: false,
      generation_time_ms: duration
    })

  } catch (error: any) {
    console.error('[ContentMix API] ❌ Fatal error:', error)

    return Response.json({
      success: false,
      error: 'AI_GENERATION_FAILED',
      message: error.message || 'Failed to generate content mix'
    }, { status: 500 })
  }
}
