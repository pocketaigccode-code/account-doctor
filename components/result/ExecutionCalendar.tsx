/**
 * ExecutionCalendar - 30天执行日历组件
 * Day 1完整展示, Day 2-30锁定状态
 * 支持月度计划异步加载
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SimpleLoadingSpinner } from '../loading/AILoadingAnimation'

interface ExecutionCalendarProps {
  calendar: {
    day_1_detail: {
      title: string
      caption: string
      hashtags: string[]
      image_gen_prompt: string
    }
    month_plan: Array<{
      day: number
      theme: string
      idea: string
    }> | null
  }
  
}

export function ExecutionCalendar({ calendar }: ExecutionCalendarProps) {
  const params = useParams()
  const auditId = params?.auditId as string

  // Day 1 异步加载
  const [day1Detail, setDay1Detail] = useState(calendar?.day_1_detail || null)
  const [isLoadingDay1, setIsLoadingDay1] = useState(false)

  // Month Plan 异步加载
  const [monthPlan, setMonthPlan] = useState(calendar?.month_plan || null)
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)

  // 异步加载 Day 1
  useEffect(() => {
    // 初始化day1Detail state
    if (calendar?.day_1_detail && !day1Detail) {
      setDay1Detail(calendar.day_1_detail)
      return
    }

    // 如果已有day1Detail或正在加载,跳过
    if (day1Detail || isLoadingDay1 || !auditId) {
      return
    }

    console.log('[Calendar] 检测到day_1_detail为null,启动异步加载')
    setIsLoadingDay1(true)

    // 调用day1 API
    fetch(`/api/audit/${auditId}/strategy/day1`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.day_1_detail) {
          console.log('[Calendar] ✅ Day 1内容加载成功')
          setDay1Detail(data.day_1_detail)
        } else {
          console.error('[Calendar] ❌ Day 1加载失败:', data)
        }
      })
      .catch(error => {
        console.error('[Calendar] ❌ Day 1请求失败:', error)
      })
      .finally(() => {
        setIsLoadingDay1(false)
      })
  }, [auditId, day1Detail, isLoadingDay1])

  // 异步加载 Month Plan
  useEffect(() => {
    // 初始化monthPlan state
    if (calendar?.month_plan && !monthPlan) {
      setMonthPlan(calendar.month_plan)
      return
    }

    // 如果已有monthPlan或正在加载,跳过
    if (monthPlan || isLoadingMonth || !auditId) {
      return
    }

    // 只在有day1但没有month_plan时触发
    if (!day1Detail) {
      return
    }

    console.log('[Calendar] 检测到month_plan为null,启动异步加载')
    setIsLoadingMonth(true)

    // 调用calendar API
    fetch(`/api/audit/${auditId}/strategy/calendar`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.month_plan) {
          console.log('[Calendar] ✅ 月度计划加载成功, length:', data.month_plan.length)
          setMonthPlan(data.month_plan)
        } else {
          console.error('[Calendar] ❌ 月度计划加载失败:', data)
        }
      })
      .catch(error => {
        console.error('[Calendar] ❌ 月度计划请求失败:', error)
      })
      .finally(() => {
        setIsLoadingMonth(false)
      })
  }, [auditId, day1Detail, monthPlan, isLoadingMonth])

  // 如果Day1正在加载或还没有数据,显示加载动画
  if (!day1Detail) {
    if (isLoadingDay1) {
      return (
        <div className="bg-white border border-sand-200 p-10 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
            Smart Content Calendar
          </h2>
          <div className="flex flex-col items-center justify-center py-16">
            <MonthPlanLoadingAnimation />
            <p className="font-sans text-lg font-bold text-charcoal-900 mt-8">
              Creating Day 1 content...
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* 30天智能日历 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          Smart Content Calendar
        </h2>

        {/* Day 1-7 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {/* Day 1 - 准备发布 */}
          <div className="border-2 border-sage p-4 bg-white">
            <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day 1 </div>
            <div className="aspect-square bg-sand-100 mb-2 flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-sans text-xs font-semibold text-charcoal-900 mb-1">Ready to Publish</h4>
            <p className="font-sans text-xs text-charcoal-600 line-clamp-2">
              {day1Detail.caption.substring(0, 40)}...
            </p>
          </div>

          {/* Day 2-7 - 已规划 或 加载中 */}
          {!monthPlan && isLoadingMonth ? (
            // Loading animation placeholder
            <div className="col-span-6 flex flex-col items-center justify-center py-8">
              <MonthPlanLoadingAnimation />
              <p className="font-sans text-sm text-charcoal-600 mt-4">Generating remaining 29-day content plan...</p>
            </div>
          ) : (
            monthPlan?.slice(0, 6).map((day) => (
              <div key={day.day} className="border border-sand-200 p-4 bg-sand-50">
                <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day {day.day} </div>
                <div className="aspect-square bg-sand-200 mb-2"></div>
                <h4 className="font-sans text-xs font-semibold text-sage mb-1">✓ Planned</h4>
                <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
              </div>
            ))
          )}
        </div>

        {/* Day 8-14 - 仅在月度计划加载完成后显示 */}
        {monthPlan && (
        <div className="grid grid-cols-7 gap-4 mb-8">
          {monthPlan.slice(6, 13).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day {day.day} </div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">✓ Planned</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>
        )}

        {/* Day 15-21 - 仅在月度计划加载完成后显示 */}
        {monthPlan && (
        <div className="grid grid-cols-7 gap-4 mb-8">
          {monthPlan.slice(13, 20).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day {day.day} </div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">✓ Planned</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>
        )}

        {/* Day 22-28 - 仅在月度计划加载完成后显示 */}
        {monthPlan && (
        <div className="grid grid-cols-7 gap-4 mb-8">
          {monthPlan.slice(20, 27).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day {day.day} </div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">✓ Planned</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>
        )}

        {/* Day 29-30 - 仅在月度计划加载完成后显示 */}
        {monthPlan && (
        <div className="grid grid-cols-7 gap-4 mb-8">
          {monthPlan.slice(27, 29).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day {day.day} </div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">✓ Planned</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
          {/* 填充空格 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`empty-${i}`} className="invisible"></div>
          ))}
        </div>
        )}

        {/* CTA */}
        <div className="bg-sand-100 border-2 border-charcoal-900 p-8 text-center">
          <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
            Unlock Full 30-Day Plan
          </h3>
          <p className="font-sans text-sm text-charcoal-600 mb-6 max-w-md mx-auto">
            Get the complete content calendar with daily publishing recommendations, optimal timing, and professional copy
          </p>
          <button className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-8 hover:bg-charcoal-800 transition-colors">
            Sign Up Free to Unlock
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 月度计划加载动画 - 三层旋转圆圈
 */
function MonthPlanLoadingAnimation() {
  return (
    <SimpleLoadingSpinner
      icon="📅"
      text="Generating monthly content plan..."
    />
  )
}
