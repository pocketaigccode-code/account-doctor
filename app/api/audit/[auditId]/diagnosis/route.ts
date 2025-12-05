/**
 * Diagnosis SSE API - AI诊断卡懒加载
 * 职责: 当前端建立SSE连接时,才开始生成diagnosis_card
 * ⚠️ Serverless关键: SSE长连接保持进程存活
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateAnalystPrompt, PROFILE_ANALYST_SYSTEM_PROMPT } from '@/lib/ai/prompts/profile-analyst'

// 🚨 Serverless配置 - 关键!
export const runtime = 'nodejs'      // 使用Node.js运行时(非Edge)
export const maxDuration = 60        // 最大执行60秒 (Vercel Pro需要)

// DeerAPI客户端
async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

  console.log('[Diagnosis AI Call] 📤 发送请求到 DeerAPI')
  console.log('[Diagnosis AI Call] 模型:', 'gpt-5.1')

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
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Diagnosis AI Call] ❌ DeerAPI 错误:', response.status, errorText)
    throw new Error(`DeerAPI failed: ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices?.[0]?.message?.content || ''

  console.log('[Diagnosis AI Call] 📥 收到响应,长度:', aiResponse.length)

  return aiResponse
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params
  const startTime = Date.now()

  console.log(`[SSE Diagnosis] Connection established for audit: ${auditId}`)

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
          sendEvent('error', { error: 'AUDIT_NOT_FOUND', message: 'Audit record not found' })
          controller.close()
          return
        }

        // ================================================
        // Step 2: 检查是否已有诊断卡 (情况A: 缓存命中)
        // ================================================
        if (audit.diagnosis_card && audit.diagnosis_card.score) {
          console.log(`[SSE Diagnosis] ✅ Cache hit - returning existing diagnosis`)

          clearInterval(heartbeat)
          sendEvent('complete', {
            diagnosis_card: audit.diagnosis_card,
            profile_snapshot: audit.profile_snapshot,
            cached: true,
            generation_time_ms: 0
          })
          controller.close()
          return
        }

        // ================================================
        // Step 3: 情况B - 无缓存,开始AI生成 (懒加载核心)
        // ================================================
        console.log(`[SSE Diagnosis] ❌ No cache - starting AI generation`)

        // 标记为"分析中"
        await supabaseAdmin
          .from('audits')
          .update({ status: 'analyzing_diagnosis', progress: 10 })
          .eq('id', auditId)

        sendEvent('status', { phase: 'analyzing', progress: 10 })

        // ================================================
        // Step 4: AI生成诊断卡
        // ================================================
        const scanData = audit.apify_raw_data

        if (!scanData || !scanData.profile) {
          throw new Error('Missing apify_raw_data')
        }

        const promptText = generateAnalystPrompt(scanData)

        sendEvent('status', { phase: 'generating_diagnosis', progress: 30 })

        // 🔥 关键: SSE连接保持进程存活,AI可以安全执行
        const aiResponse = await callGemini(
          promptText,
          PROFILE_ANALYST_SYSTEM_PROMPT
        )

        // 解析 JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('AI返回格式错误,无法解析JSON')
        }

        const parsed = JSON.parse(jsonMatch[0])

        // 验证必要字段
        if (!parsed.diagnosis_card || !parsed.diagnosis_card.score) {
          throw new Error('AI返回数据缺少必要字段')
        }

        // 更新进度
        sendEvent('status', { phase: 'finalizing', progress: 80 })

        // ================================================
        // Step 5: 保存到数据库 (持久化)
        // ================================================
        const generationTime = Date.now() - startTime

        // 合并AI增强数据到profile_snapshot
        const updatedProfileSnapshot = {
          ...(audit.profile_snapshot || {}),
          category_label: parsed.profile_snapshot?.category_label || audit.profile_snapshot?.category_label,
          missing_elements: parsed.profile_snapshot?.missing_elements || []
        }

        await supabaseAdmin
          .from('audits')
          .update({
            profile_snapshot: updatedProfileSnapshot,
            diagnosis_card: parsed.diagnosis_card,
            status: 'snapshot_ready',
            progress: 100,
            ai_model_used: 'gpt-5.1',
            generation_time_ms: generationTime
          })
          .eq('id', auditId)

        // ================================================
        // Step 6: 发送完成事件
        // ================================================
        clearInterval(heartbeat)
        sendEvent('complete', {
          diagnosis_card: parsed.diagnosis_card,
          profile_snapshot: updatedProfileSnapshot,
          cached: false,
          generation_time_ms: generationTime
        })

        console.log(`[SSE Diagnosis] ✅ Diagnosis completed in ${generationTime}ms`)
        controller.close()

      } catch (error: any) {
        console.error('[SSE Diagnosis] Fatal error:', error)

        // 清理心跳
        clearInterval(heartbeat)

        // 保存错误状态
        await supabaseAdmin
          .from('audits')
          .update({
            status: 'ai_failed',
            error_code: 'AI_DIAGNOSIS_FAILED',
            error_message: error.message
          })
          .eq('id', auditId)

        // 推送错误事件
        sendEvent('error', {
          error: 'AI_DIAGNOSIS_FAILED',
          message: error.message,
          fallback_available: false
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
