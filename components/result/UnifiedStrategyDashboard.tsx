/**
 * UnifiedStrategyDashboard - 统一策略仪表板
 * 将Content Mix整合到日历中显示
 */

'use client'

import { MosaicCalendar } from './MosaicCalendar'

interface UnifiedStrategyDashboardProps {
  contentMix: Array<{
    label: string
    percentage: number
  }>
  brandPersona?: {
    archetype: string
    tone_voice: string
  }
  calendar: {
    day_1_detail: any
    month_plan: any[]
  }
  profileData?: any  // 用户资料数据
  auditId: string
}

export function UnifiedStrategyDashboard({
  contentMix,
  brandPersona,
  calendar,
  profileData,
  auditId
}: UnifiedStrategyDashboardProps) {
  return (
    <MosaicCalendar
      day1Detail={calendar.day_1_detail}
      monthPlan={calendar.month_plan}
      contentMix={contentMix}
      brandPersona={brandPersona}
      profileData={profileData}
      auditId={auditId}
    />
  )
}
