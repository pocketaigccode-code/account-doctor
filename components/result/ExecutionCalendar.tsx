/**
 * ExecutionCalendar - 30天执行日历组件
 * Day 1完整展示, Day 2-30锁定状态
 * 支持月度计划异步加载
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
  t: (key: string) => string
}

export function ExecutionCalendar({ calendar, t }: ExecutionCalendarProps) {
  const params = useParams()
  const auditId = params?.auditId as string
  const [monthPlan, setMonthPlan] = useState(calendar?.month_plan || null)
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)

  // 如果month_plan为null,尝试异步加载
  useEffect(() => {
    // 初始化monthPlan state
    if (calendar?.month_plan && !monthPlan) {
      setMonthPlan(calendar.month_plan)
      return
    }

    // 如果已有monthPlan或正在加载,跳过
    if (monthPlan || isLoadingCalendar || !auditId) {
      return
    }

    // 只在有day1但没有month_plan时触发
    if (!calendar?.day_1_detail) {
      return
    }

    console.log('[Calendar] 检测到month_plan为null,启动异步加载')
    setIsLoadingCalendar(true)

    // 调用calendar API
    fetch(`/api/audit/${auditId}/strategy/calendar`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.month_plan) {
          console.log('[Calendar] ✅ 月度计划加载成功, length:', data.month_plan.length)
          setMonthPlan(data.month_plan)
        } else {
          console.error('[Calendar] ❌ 加载失败:', data)
        }
      })
      .catch(error => {
        console.error('[Calendar] ❌ 请求失败:', error)
      })
      .finally(() => {
        setIsLoadingCalendar(false)
      })
  }, [auditId, monthPlan, isLoadingCalendar])

  if (!calendar || !calendar.day_1_detail) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* 30天智能日历 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          {t('result.calendar.title')}
        </h2>

        {/* Day 1-7 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {/* Day 1 - 准备发布 */}
          <div className="border-2 border-sage p-4 bg-white">
            <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} 1 {t('result.calendar.dayUnit')}</div>
            <div className="aspect-square bg-sand-100 mb-2 flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-sans text-xs font-semibold text-charcoal-900 mb-1">{t('result.calendar.readyToPublish')}</h4>
            <p className="font-sans text-xs text-charcoal-600 line-clamp-2">
              {calendar.day_1_detail.caption.substring(0, 40)}...
            </p>
          </div>

          {/* Day 2-7 - 已规划 或 加载中 */}
          {!monthPlan && isLoadingCalendar ? (
            // 加载动画占位
            <div className="col-span-6 flex flex-col items-center justify-center py-8">
              <MonthPlanLoadingAnimation />
              <p className="font-sans text-sm text-charcoal-600 mt-4">正在生成剩余29天内容计划...</p>
            </div>
          ) : (
            monthPlan?.slice(0, 6).map((day) => (
              <div key={day.day} className="border border-sand-200 p-4 bg-sand-50">
                <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
                <div className="aspect-square bg-sand-200 mb-2"></div>
                <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
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
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
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
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
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
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
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
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
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
            {t('result.calendar.unlockTitle')}
          </h3>
          <p className="font-sans text-sm text-charcoal-600 mb-6 max-w-md mx-auto">
            {t('result.calendar.unlockDesc')}
          </p>
          <button className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-8 hover:bg-charcoal-800 transition-colors">
            {t('result.calendar.unlockButton')}
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
    <div className="relative w-32 h-32 mx-auto">
      {/* 外圈 - 黑色,慢速 */}
      <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s' }}>
        <circle
          cx="64"
          cy="64"
          r="60"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray="80 300"
          className="text-charcoal-900"
        />
      </svg>

      {/* 中圈 - 珊瑚色,中速 */}
      <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] animate-spin" style={{ animationDuration: '1.5s' }}>
        <circle
          cx="52"
          cy="52"
          r="48"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeDasharray="70 250"
          className="text-coral"
        />
      </svg>

      {/* 内圈 - 绿色,快速 */}
      <svg className="absolute inset-6 w-[calc(100%-48px)] h-[calc(100%-48px)] animate-spin" style={{ animationDuration: '1s' }}>
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray="60 200"
          className="text-sage"
        />
      </svg>
    </div>
  )
}
