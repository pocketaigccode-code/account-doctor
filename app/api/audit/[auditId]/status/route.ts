/**
 * Status API - 轮询状态查询 (SSE的备用方案)
 * 职责: 返回当前audit的状态和进度
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auditId: string }> }
) {
  try {
    const { auditId } = await context.params

    const { data: audit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      return NextResponse.json(
        {
          error: 'AUDIT_NOT_FOUND',
          message: 'Audit record not found',
          ui_message: '诊断记录不存在'
        },
        { status: 404 }
      )
    }

    const response: any = {
      audit_id: audit.id,
      username: audit.username,
      status: audit.status,
      progress: audit.progress || 0,
      created_at: audit.created_at,
      updated_at: audit.updated_at
    }

    // 根据状态返回不同数据
    switch (audit.status) {
      case 'snapshot_ready':
      case 'analyzing':
        // Fast Lane数据已就绪
        response.profile_snapshot = audit.profile_snapshot
        response.diagnosis_card = audit.diagnosis_card
        break

      case 'completed':
        // Slow Lane数据也已就绪
        response.profile_snapshot = audit.profile_snapshot
        response.diagnosis_card = audit.diagnosis_card
        response.strategy_section = audit.strategy_section
        response.execution_calendar = audit.execution_calendar
        break

      case 'failed':
        // 失败状态
        response.error_code = audit.error_code
        response.error_message = audit.error_message
        break
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('[Status API] Error:', error)

    return NextResponse.json({
      error: 'INTERNAL_ERROR',
      message: error.message,
      ui_message: '获取状态失败'
    }, { status: 500 })
  }
}
