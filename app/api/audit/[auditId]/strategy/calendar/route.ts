/**
 * Calendar API - 独立生成30天月度计划
 * 设计目的: 绕过Vercel 60秒限制,允许长时间AI生成
 * 架构: 启动后台任务,立即返回任务ID,前端轮询获取结果
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  MONTH_PLAN_SYSTEM_PROMPT,
  generateMonthPlanPrompt
} from '@/lib/ai/prompts/micro-strategy'

// 🚨 Serverless配置
export const runtime = 'nodejs'
export const maxDuration = 60

// DeerAPI客户端
async function callGemini(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 3000
): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

  console.log('[Calendar AI] 📤 发送请求, max_tokens:', maxTokens)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 50000) // 50秒超时

  try {
    const response = await fetch(`${DEERAPI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEERAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`DeerAPI failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    if (!aiResponse || aiResponse.trim().length === 0) {
      throw new Error('AI返回空响应')
    }

    return aiResponse
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('AI request timeout after 50 seconds')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// JSON解析
function parseJSON(aiResponse: string): any {
  try {
    const trimmed = aiResponse.trim()
    return JSON.parse(trimmed)
  } catch (e) {
    // 尝试修复
    let fixed = aiResponse
      .trim()
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/'/g, '"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')

    return JSON.parse(fixed)
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params

  try {
    console.log(`[Calendar API] 🚀 启动月度计划生成: ${auditId}`)

    // 获取audit记录
    const { data: audit } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (!audit) {
      return Response.json({ error: 'AUDIT_NOT_FOUND' }, { status: 404 })
    }

    // 检查是否已有月度计划
    if (audit.execution_calendar?.month_plan) {
      console.log('[Calendar API] ✅ 已有缓存')
      return Response.json({
        success: true,
        month_plan: audit.execution_calendar.month_plan,
        cached: true
      })
    }

    // 准备上下文
    const category = audit.profile_snapshot?.category_label || '本地商家'
    const mixArray = audit.strategy_section?.content_mix_chart || []
    const personaData = audit.strategy_section?.brand_persona || {}

    // 生成月度计划
    const monthPlanResponse = await callGemini(
      generateMonthPlanPrompt({
        category,
        content_mix: mixArray,
        persona: personaData
      }),
      MONTH_PLAN_SYSTEM_PROMPT,
      3000
    )

    const monthPlanData = parseJSON(monthPlanResponse)
    console.log('[Calendar API] ✅ 解析成功, length:', monthPlanData?.length)

    // 更新数据库
    const { error: updateError } = await supabaseAdmin
      .from('audits')
      .update({
        execution_calendar: {
          ...audit.execution_calendar,
          month_plan: monthPlanData
        },
        status: 'completed',
        progress: 100
      })
      .eq('id', auditId)

    if (updateError) {
      throw updateError
    }

    console.log('[Calendar API] ✅ 已保存到数据库')

    return Response.json({
      success: true,
      month_plan: monthPlanData,
      cached: false
    })

  } catch (error: any) {
    console.error('[Calendar API] ❌ 失败:', error.message)

    // 标记失败
    await supabaseAdmin
      .from('audits')
      .update({
        status: 'calendar_failed',
        error_message: error.message
      })
      .eq('id', auditId)

    return Response.json(
      { error: 'CALENDAR_GENERATION_FAILED', message: error.message },
      { status: 500 }
    )
  }
}
