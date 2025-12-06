/**
 * 完整的点击追踪系统（基于Supabase数据库）
 * 支持用户标识、位置追踪、会话管理
 */

export type ClickEventType =
  | 'unlock_click'
  | 'vip_service_click'
  | 'modal_option1_click'  // 点击"Try Product"选项
  | 'modal_option2_click'  // 点击"Managed Service"选项
  | 'cta_sidewalk_click'   // 点击"Meet Sidewalk"CTA按钮

export interface TrackClickOptions {
  event_type: ClickEventType
  event_category?: string  // 'calendar', 'service', 'modal'
  user_id?: string         // Instagram username or audit ID
  component_location?: string  // Component name where click happened
  metadata?: Record<string, any>  // Any additional data
}

// Legacy interface for backward compatibility
interface ClickEvent {
  event: ClickEventType
  timestamp: string
  count: number
}

const STORAGE_KEY = 'accountdoctor_analytics'
const SESSION_ID_KEY = 'accountdoctor_session_id'

/**
 * Get or create session ID
 */
function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    }
    return sessionId
  } catch (error) {
    return `session_${Date.now()}`
  }
}

/**
 * 追踪点击事件（新版 - 使用API）
 */
export async function trackClick(
  event_type: ClickEventType,
  options?: Partial<TrackClickOptions>
) {
  try {
    const sessionId = getSessionId()

    const payload: TrackClickOptions = {
      event_type,
      event_category: options?.event_category,
      user_id: options?.user_id,
      component_location: options?.component_location,
      metadata: options?.metadata || {}
    }

    // Send to API
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        session_id: sessionId,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`[Analytics] ✅ Tracked: ${event_type}`, result.event)
    } else {
      throw new Error('API request failed')
    }

    // Also update localStorage for backward compatibility (aggregate data)
    updateLocalStorage(event_type)

  } catch (error) {
    console.error('[Analytics] Failed to track via API, falling back to localStorage:', error)
    // Fallback to localStorage if API fails
    updateLocalStorage(event_type)
  }
}

/**
 * Update localStorage (for backward compatibility and offline support)
 */
function updateLocalStorage(event: ClickEventType) {
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
  } catch (error) {
    console.error('[Analytics] Failed to update localStorage:', error)
  }
}

/**
 * 获取分析数据（从localStorage - 保持向后兼容）
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
 * 清除所有数据（仅清除localStorage）
 */
export function clearAnalyticsData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('[Analytics] 🗑️ Local data cleared')
  } catch (error) {
    console.error('[Analytics] Failed to clear:', error)
  }
}

/**
 * 获取特定事件的点击次数（从localStorage）
 */
export function getClickCount(event: ClickEventType): number {
  const data = getAnalyticsData()
  return data.find(item => item.event === event)?.count || 0
}

/**
 * Fetch analytics from API
 */
export async function fetchAnalyticsFromAPI(filters?: {
  event_type?: ClickEventType
  user_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  group_by?: 'event_type' | 'user_id' | 'page_path' | 'date' | 'component_location'
}) {
  try {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`/api/analytics/events?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch analytics')
    }

    return await response.json()
  } catch (error) {
    console.error('[Analytics] Failed to fetch from API:', error)
    return null
  }
}

/**
 * Delete analytics events (batch delete)
 */
export async function deleteAnalyticsEvents(options: {
  ids?: string[]
  filters?: {
    event_type?: ClickEventType
    user_id?: string
    date_before?: string
  }
}) {
  try {
    const response = await fetch('/api/analytics/events', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      throw new Error('Failed to delete events')
    }

    return await response.json()
  } catch (error) {
    console.error('[Analytics] Failed to delete:', error)
    return null
  }
}
