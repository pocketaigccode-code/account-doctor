/**
 * Strategy API - 简化版状态查询API
 * 不再执行AI生成，仅返回已缓存的数据
 * AI生成已拆分到独立API: /persona, /content-mix, /audience, /day1, /calendar
 *
 * 此API用于快速获取已有的策略数据，不会触发任何AI生成
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 10 // 简化后仅需查询数据库，10秒足够

/**
 * GET - 获取已缓存的策略数据
 * 不执行任何AI生成，仅返回数据库中的现有数据
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await context.params

  console.log(`[Strategy API] 📤 Fetching cached data for audit: ${auditId}`)

  try {
    // 获取audit记录
    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      console.error('[Strategy API] ❌ Audit not found:', error)
      return Response.json({
        success: false,
        error: 'AUDIT_NOT_FOUND',
        message: 'Audit record not found'
      }, { status: 404 })
    }

    console.log('[Strategy API] ✅ Cached data retrieved')

    // 返回已有的策略数据
    return Response.json({
      success: true,
      strategy_section: audit.strategy_section || {},
      execution_calendar: audit.execution_calendar || {},
      status: audit.status,
      progress: audit.progress || 0,
      cached: true
    })

  } catch (error: any) {
    console.error('[Strategy API] ❌ Error:', error)

    return Response.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to fetch strategy data'
    }, { status: 500 })
  }
}
