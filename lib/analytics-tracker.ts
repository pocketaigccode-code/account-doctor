/**
 * 简单的点击追踪系统（基于localStorage）
 */

export type ClickEventType = 'unlock_click' | 'vip_service_click'

interface ClickEvent {
  event: ClickEventType
  timestamp: string
  count: number
}

const STORAGE_KEY = 'accountdoctor_analytics'

/**
 * 追踪点击事件
 */
export function trackClick(event: ClickEventType) {
  try {
    const data = getAnalyticsData()
    const existing = data.find(item => item.event === event)

    if (existing) {
      existing.count++
      existing.timestamp = new Date().toISOString()
    } else {
      data.push({
        event,
        timestamp: new Date().toISOString(),
        count: 1
      })
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    console.log(`[Analytics] 📊 Tracked: ${event}`)
  } catch (error) {
    console.error('[Analytics] Failed to track:', error)
  }
}

/**
 * 获取分析数据
 */
export function getAnalyticsData(): ClickEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    return []
  }
}

/**
 * 清除所有数据
 */
export function clearAnalyticsData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('[Analytics] 🗑️ Data cleared')
  } catch (error) {
    console.error('[Analytics] Failed to clear:', error)
  }
}

/**
 * 获取特定事件的点击次数
 */
export function getClickCount(event: ClickEventType): number {
  const data = getAnalyticsData()
  return data.find(item => item.event === event)?.count || 0
}
