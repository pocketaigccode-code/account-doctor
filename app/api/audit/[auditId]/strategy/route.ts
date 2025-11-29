/**
 * Strategy SSE API - 串行执行版 (打字机效果)
 * 架构: 5个模块依次执行,每完成一个立即推送
 * 总耗时: 36秒 (但每5秒用户看到新内容)
 * ⚠️ 一次只发一个AI请求给DeerAPI,避免并发限流
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  PERSONA_SYSTEM_PROMPT,
  AUDIENCE_SYSTEM_PROMPT,
  CONTENT_MIX_SYSTEM_PROMPT,
  DAY1_SYSTEM_PROMPT,
  MONTH_PLAN_SYSTEM_PROMPT,
  generatePersonaPrompt,
  generateAudiencePrompt,
  generateContentMixPrompt,
  generateDay1Prompt,
  generateMonthPlanPrompt
} from '@/lib/ai/prompts/micro-strategy'

// 🚨 Serverless配置
export const runtime = 'nodejs'
export const maxDuration = 60

// DeerAPI客户端 - 支持动态max_tokens
async function callGemini(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 1000
): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

  console.log('[AI Call] 📤 发送请求到DeerAPI, max_tokens:', maxTokens)

  // 添加超时控制 - 根据max_tokens动态调整
  const controller = new AbortController()
  const timeoutDuration = maxTokens > 2000 ? 90000 : 45000 // 大量tokens需要90秒
  const timeout = setTimeout(() => controller.abort(), timeoutDuration)

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
      const errorText = await response.text()
      console.error('[AI Call] ❌ DeerAPI错误:', response.status, errorText)
      throw new Error(`DeerAPI failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    console.log('[AI Call] 📥 收到响应,长度:', aiResponse.length)

    // 🚨 检查空响应
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('[AI Call] ❌ 收到空响应!完整data:', JSON.stringify(data))
      throw new Error('AI返回空响应,可能超时或配额耗尽')
    }

    return aiResponse
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[AI Call] ❌ 请求超时 (${timeoutDuration / 1000}秒)`)
      throw new Error(`AI request timeout after ${timeoutDuration / 1000} seconds`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// 解析JSON响应 - 严格清洗
function parseJSON(aiResponse: string, moduleName: string = ''): any {
  console.log(`[parseJSON ${moduleName}] 原始响应长度:`, aiResponse.length)

  // 尝试直接解析
  try {
    const trimmed = aiResponse.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed)
    }
  } catch (e: any) {
    console.log(`[parseJSON ${moduleName}] 直接解析失败:`, e.message)
    console.log(`[parseJSON ${moduleName}] 尝试清洗和修复...`)
  }

  // 清洗JSON: 移除注释和多余换行
  let cleaned = aiResponse
    .replace(/\/\/.*$/gm, '')  // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .trim()

  // 提取JSON
  let jsonMatch

  // 首先尝试找到JSON的开始和结束位置
  const startIndex = cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : cleaned.indexOf('{')
  if (startIndex === -1) {
    console.error(`[parseJSON ${moduleName}] 找不到JSON起始符号`)
    throw new Error(`AI返回格式错误,无法解析JSON (模块: ${moduleName})`)
  }

  // 从起始位置提取到最后
  const jsonStr = cleaned.substring(startIndex)

  console.log(`[parseJSON ${moduleName}] JSON字符串长度:`, jsonStr.length)
  console.log(`[parseJSON ${moduleName}] JSON前100字符:`, jsonStr.substring(0, 100))
  console.log(`[parseJSON ${moduleName}] JSON后100字符:`, jsonStr.substring(jsonStr.length - 100))

  try {
    return JSON.parse(jsonStr)
  } catch (e: any) {
    console.error(`[parseJSON ${moduleName}] JSON解析失败:`, e.message)
    console.error(`[parseJSON ${moduleName}] 错误位置:`, e.message.match(/position (\d+)/)?.[1])

    // 显示错误位置附近的内容
    const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0')
    if (errorPos > 0) {
      console.error(`[parseJSON ${moduleName}] 错误位置前后:`, jsonStr.substring(Math.max(0, errorPos - 50), errorPos + 50))
    }

    // 尝试修复常见JSON错误
    console.log(`[parseJSON ${moduleName}] 尝试自动修复JSON格式错误...`)

    try {
      let fixedJson = jsonStr
        // 修复尾随逗号
        .replace(/,(\s*[}\]])/g, '$1')
        // 修复单引号为双引号
        .replace(/'/g, '"')
        // 修复未转义的换行符
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        // 修复未闭合的字符串(尝试在最后添加")
        .replace(/"([^"]*?)$/g, '"$1"')

      const fixed = JSON.parse(fixedJson)
      console.log(`[parseJSON ${moduleName}] ✅ 自动修复成功!`)
      return fixed
    } catch (fixError: any) {
      console.error(`[parseJSON ${moduleName}] ❌ 自动修复也失败:`, fixError.message)
      throw new Error(`JSON解析失败: ${e.message}`)
    }
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[SSE Strategy] Connection established for: ${auditId}`)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // 心跳机制
      const heartbeat = setInterval(() => {
        sendEvent('ping', { timestamp: Date.now() })
      }, 15000)

      try {
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
        // Step 2: 检查完整缓存
        // ================================================
        if (audit.strategy_section && audit.execution_calendar) {
          console.log(`[SSE Strategy] ✅ Full cache hit`)
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
        // Step 3: 准备上下文
        // ================================================
        const context = {
          category: audit.profile_snapshot?.category_label || '本地商家',
          bio: audit.apify_raw_data?.profile?.biography || '',
          diagnosis_summary: audit.diagnosis_card?.summary_title || '需要改进'
        }

        console.log(`[SSE Strategy] 🔄 Starting serial execution`)

        // ================================================
        // Module 1: Persona (串行,5秒)
        // ================================================
        sendEvent('status', { phase: 'generating_persona', progress: 10 })
        console.log('[Module 1] 📤 Generating Persona...')

        const personaResponse = await callGemini(
          generatePersonaPrompt(context),
          PERSONA_SYSTEM_PROMPT
        )
        const personaData = parseJSON(personaResponse, 'Persona')

        console.log('[Module 1] ✅ Persona completed:', personaData)

        // 立即推送给前端
        sendEvent('partial_update', {
          brand_persona: personaData,
          progress: 20
        })

        // ================================================
        // Module 2: Content Mix (串行,3秒) - 提前到第2位
        // ================================================
        sendEvent('status', { phase: 'planning_content_mix', progress: 25 })
        console.log('[Module 2] 📤 Planning Content Mix...')

        const mixResponse = await callGemini(
          generateContentMixPrompt(context),
          CONTENT_MIX_SYSTEM_PROMPT
        )
        const mixData = parseJSON(mixResponse, 'ContentMix')

        console.log('[Module 2] ✅ Content Mix completed:', Array.isArray(mixData), mixData)

        const mixArray = Array.isArray(mixData) ? mixData : (mixData.mix || [])

        // 立即推送
        sendEvent('partial_update', {
          content_mix_chart: mixArray,
          progress: 35
        })

        // ================================================
        // Module 3: Audience (串行,5秒) - 移到第3位
        // ================================================
        sendEvent('status', { phase: 'analyzing_audience', progress: 40 })
        console.log('[Module 3] 📤 Analyzing Audience...')

        const audienceResponse = await callGemini(
          generateAudiencePrompt(context),
          AUDIENCE_SYSTEM_PROMPT
        )
        const audienceData = parseJSON(audienceResponse, 'Audience')

        console.log('[Module 3] ✅ Audience completed:', Array.isArray(audienceData), audienceData)

        // 立即推送
        sendEvent('partial_update', {
          target_audience: Array.isArray(audienceData) ? audienceData : [audienceData],
          progress: 55
        })

        // ================================================
        // Module 4: Day 1 Creative (串行,8秒)
        // ================================================
        sendEvent('status', { phase: 'creating_day1', progress: 60 })
        console.log('[Module 4] 📤 Creating Day 1 Content...')

        const day1Response = await callGemini(
          generateDay1Prompt({
            category: context.category,
            bio: context.bio,
            persona: personaData
          }),
          DAY1_SYSTEM_PROMPT,
          2000  // ✅ Day1需要更多tokens (450-500字文案)
        )
        const day1Data = parseJSON(day1Response, 'Day1')

        console.log('[Module 4] ✅ Day 1 completed:', day1Data)

        // 立即推送
        sendEvent('partial_update', {
          day_1_detail: day1Data,
          progress: 75
        })

        // ================================================
        // 先保存前4个模块的结果 (不包含month_plan)
        // ================================================
        const partialTime = Date.now() - startTime

        const partialStrategySection = {
          brand_persona: personaData,
          target_audience: Array.isArray(audienceData) ? audienceData : [audienceData],
          content_mix_chart: mixArray
        }

        const partialExecutionCalendar = {
          day_1_detail: day1Data,
          month_plan: null // 暂时为null,后台生成
        }

        // 先保存部分结果(不包含month_plan,但状态已完成)
        await supabaseAdmin
          .from('audits')
          .update({
            strategy_section: partialStrategySection,
            execution_calendar: partialExecutionCalendar,
            status: 'completed', // 标记为已完成,month_plan会异步补充
            progress: 100,
            ai_model_used: 'gpt-5.1',
            generation_time_ms: partialTime
          })
          .eq('id', auditId)

        // ================================================
        // SSE立即返回(不等待月度计划)
        // ================================================
        clearInterval(heartbeat)
        sendEvent('complete', {
          strategy_section: partialStrategySection,
          execution_calendar: partialExecutionCalendar,
          cached: false,
          generation_time_ms: partialTime,
          progress: 100, // 前端期望100表示完成
          month_plan_generating: true // 告知前端月度计划需要额外加载
        })

        console.log(`[SSE Strategy] ✅ Partial completion in ${partialTime}ms`)
        console.log(`[SSE Strategy] 📌 月度计划将通过 /strategy/calendar API 异步生成`)
        controller.close()

      } catch (error: any) {
        console.error('[SSE Strategy] Fatal error:', error)
        clearInterval(heartbeat)

        await supabaseAdmin
          .from('audits')
          .update({
            status: 'strategy_failed',
            error_code: 'AI_STRATEGY_FAILED',
            error_message: error.message
          })
          .eq('id', auditId)

        sendEvent('error', {
          error: 'AI_STRATEGY_FAILED',
          message: error.message
        })

        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
