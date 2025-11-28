/**
 * Slow Lane SSE API - 懒加载AI策略生成
 * 职责: 当前端建立SSE连接时,才开始执行AI生成
 * ⚠️ Serverless关键: SSE长连接保持进程存活
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateStrategyPrompt, STRATEGIC_DIRECTOR_SYSTEM_PROMPT, getStrategyFallback } from '@/lib/ai/prompts/strategic-director'

// 🚨 Serverless配置 - 关键!
export const runtime = 'nodejs'      // 使用Node.js运行时(非Edge)
export const maxDuration = 60        // 最大执行60秒 (Vercel Pro需要)

// 临时DeerAPI客户端
async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

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
      max_tokens: 3000,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeerAPI failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[SSE] Connection established for audit: ${auditId}`)

  // ================================================
  // 创建SSE响应流 (保持连接活跃)
  // ================================================
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // 辅助函数: 发送SSE事件
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // 心跳机制 (防止Vercel超时)
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
          sendEvent('error', { error: 'AUDIT_NOT_FOUND', message: '诊断记录不存在' })
          controller.close()
          return
        }

        // ================================================
        // Step 2: 检查是否已有缓存策略 (情况A)
        // ================================================
        if (audit.strategy_section && audit.execution_calendar) {
          console.log(`[SSE] ✅ Cache hit - returning existing strategy`)

          clearInterval(heartbeat)
          sendEvent('complete', {
            strategy_section: audit.strategy_section,
            execution_calendar: audit.execution_calendar,
            cached: true,
            generation_time_ms: 0
          })
          controller.close()
          return
        }

        // ================================================
        // Step 3: 情况B - 无缓存,开始AI生成 (懒加载核心)
        // ================================================
        console.log(`[SSE] ❌ No cache - starting AI generation`)

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
        const diagnosisCard = audit.diagnosis_card
        const rawBio = audit.apify_raw_data?.profile?.biography || ''
        const category = profileSnapshot?.category_label || '本地商家'

        // 验证必要数据是否存在
        if (!diagnosisCard || !diagnosisCard.score) {
          console.error('[SSE] Missing diagnosis_card or score, cannot proceed with strategy generation')
          clearInterval(heartbeat)
          sendEvent('error', {
            error: 'AI_GENERATION_FAILED',
            message: 'Diagnosis data not ready, please wait or refresh',
            fallback_available: false
          })
          controller.close()
          return
        }

        const promptText = generateStrategyPrompt(
          { profile_snapshot: profileSnapshot, diagnosis_card: diagnosisCard },
          rawBio
        )

        sendEvent('status', { phase: 'generating_persona', progress: 30 })

        let strategyData: any

        // 🔥 关键: SSE连接保持进程存活,AI可以安全执行
        const aiResponse = await callGemini(
          promptText,
          STRATEGIC_DIRECTOR_SYSTEM_PROMPT
        )

        console.log(`[AI Prompt 2] Response preview:`, aiResponse.substring(0, 100))

        // 解析JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('AI返回格式错误,无法解析JSON')
        }

        strategyData = JSON.parse(jsonMatch[0])

        // 验证必要字段
        if (!strategyData.strategy_section || !strategyData.execution_calendar) {
          throw new Error('AI返回数据缺少必要字段')
        }

        // 更新进度
        await supabaseAdmin
          .from('audits')
          .update({ progress: 80 })
          .eq('id', auditId)

        sendEvent('status', { phase: 'finalizing', progress: 80 })

        // ================================================
        // Step 5: 保存到数据库 (持久化)
        // ================================================
        const generationTime = Date.now() - startTime

        await supabaseAdmin
          .from('audits')
          .update({
            strategy_section: strategyData.strategy_section,
            execution_calendar: strategyData.execution_calendar,
            status: 'completed',
            progress: 100,
            ai_model_used: 'gemini-3-pro-preview',
            generation_time_ms: generationTime
          })
          .eq('id', auditId)

        // ================================================
        // Step 6: 发送完成事件
        // ================================================
        clearInterval(heartbeat)
        sendEvent('complete', {
          ...strategyData,
          cached: false,
          generation_time_ms: generationTime
        })

        console.log(`[SSE] ✅ Strategy completed in ${generationTime}ms`)
        controller.close()

      } catch (error: any) {
        console.error('[SSE] Fatal error:', error)

        // 清理心跳
        clearInterval(heartbeat)

        // 保存错误状态
        supabaseAdmin
          .from('audits')
          .update({
            status: 'failed',
            error_code: 'AI_TIMEOUT',
            error_message: error.message
          })
          .eq('id', auditId)
          .then(() => {
            // 忽略错误
          })

        // 推送错误事件
        sendEvent('error', {
          error: 'AI_GENERATION_FAILED',
          message: error.message,
          fallback_available: true
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
      'X-Accel-Buffering': 'no',  // 禁用Nginx缓冲
    }
  })
}
