/**
 * Brand Persona API - 独立生成品牌人设
 * 参考Month Plan的异步加载架构
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PERSONA_SYSTEM_PROMPT, generatePersonaPrompt } from '@/lib/ai/prompts/micro-strategy'
import { callGemini, parseJSON } from '@/lib/ai/gemini-client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[Persona API] 📤 Request received for audit: ${auditId}`)

  try {
    // 1. 检查缓存
    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      console.error('[Persona API] ❌ Audit not found:', error)
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: 'Audit record not found'
      }, { status: 404 })
    }

    // 如果已有brand_persona,直接返回缓存
    if (audit.strategy_section?.brand_persona) {
      console.log('[Persona API] ✅ Cache hit, returning cached data')
      return Response.json({
        success: true,
        brand_persona: audit.strategy_section.brand_persona,
        cached: true
      })
    }

    // 2. 准备上下文数据
    const promptContext = {
      category: audit.profile_snapshot?.category_label || '本地商家',
      bio: audit.apify_raw_data?.profile?.biography || '',
      diagnosis_summary: audit.diagnosis_card?.summary_title || '需要改进'
    }

    console.log('[Persona API] 🔄 Generating brand persona with AI...')

    // 3. 调用AI生成
    const personaResponse = await callGemini(
      generatePersonaPrompt(promptContext),
      PERSONA_SYSTEM_PROMPT,
      1000
    )

    const personaData = parseJSON(personaResponse, 'Persona')

    console.log('[Persona API] ✅ AI generation completed:', personaData)

    // 4. 保存到数据库 - 使用JSONB合并操作避免覆盖其他字段
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        strategy_section: {
          ...audit.strategy_section,
          brand_persona: personaData
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('[Persona API] ❌ Database update failed:', updateError)
      throw new Error('Failed to save persona data')
    }

    const duration = Date.now() - startTime

    console.log(`[Persona API] ✅ Completed in ${duration}ms`)

    return Response.json({
      success: true,
      brand_persona: personaData,
      cached: false,
      generation_time_ms: duration
    })

  } catch (error: any) {
    console.error('[Persona API] ❌ Fatal error:', error)

    return Response.json({
      success: false,
      error: 'AI_GENERATION_FAILED',
      message: error.message || 'Failed to generate brand persona'
    }, { status: 500 })
  }
}
