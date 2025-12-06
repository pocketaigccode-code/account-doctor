'use client'

import { useEffect, useState } from 'react'
import { fetchAnalyticsFromAPI, deleteAnalyticsEvents, type ClickEventType } from '@/lib/analytics-tracker'

interface AnalyticsEvent {
  id: string
  event_type: ClickEventType
  event_category?: string
  user_id?: string
  session_id?: string
  page_path?: string
  component_location?: string
  created_at: string
  metadata?: any
}

interface GroupedData {
  key: string
  count: number
  events: AnalyticsEvent[]
}

export default function AnalysisPage() {
  // Data state
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [groupedData, setGroupedData] = useState<GroupedData[] | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('')
  const [userIdFilter, setUserIdFilter] = useState<string>('')
  const [dateFromFilter, setDateFromFilter] = useState<string>('')
  const [dateToFilter, setDateToFilter] = useState<string>('')
  const [groupBy, setGroupBy] = useState<string>('')

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // UI state
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const filters: any = {
        limit: 1000
      }

      if (eventTypeFilter) filters.event_type = eventTypeFilter
      if (userIdFilter) filters.user_id = userIdFilter
      if (dateFromFilter) filters.date_from = dateFromFilter
      if (dateToFilter) filters.date_to = dateToFilter
      if (groupBy) filters.group_by = groupBy

      const result = await fetchAnalyticsFromAPI(filters)

      if (result && result.success) {
        setEvents(result.events || [])
        setGroupedData(result.grouped_data || null)
        setTotal(result.total || 0)
      }

      setLastUpdate(new Date().toLocaleString('zh-CN'))
    } catch (error) {
      console.error('[Analysis] Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventTypeFilter, userIdFilter, dateFromFilter, dateToFilter, groupBy])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [eventTypeFilter, userIdFilter, dateFromFilter, dateToFilter, groupBy])

  // Delete selected events
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert('请先选择要删除的事件')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个事件吗？`)) {
      return
    }

    try {
      const result = await deleteAnalyticsEvents({
        ids: Array.from(selectedIds)
      })

      if (result && result.success) {
        alert(`成功删除 ${result.deleted_count} 个事件`)
        setSelectedIds(new Set())
        loadData()
      }
    } catch (error) {
      console.error('[Analysis] Failed to delete:', error)
      alert('删除失败，请重试')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const csvData = events.map(event => ({
      ID: event.id,
      'Event Type': event.event_type,
      'Event Category': event.event_category || '',
      'User ID': event.user_id || 'anonymous',
      'Session ID': event.session_id || '',
      'Page Path': event.page_path || '',
      'Component': event.component_location || '',
      'Created At': new Date(event.created_at).toLocaleString(),
      'Metadata': JSON.stringify(event.metadata || {})
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Select all
  const selectAll = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(events.map(e => e.id)))
    }
  }

  // Calculate stats
  const getTotalClicks = () => events.length
  const getUnlockClicks = () => events.filter(e => e.event_type === 'unlock_click').length
  const getVIPClicks = () => events.filter(e => e.event_type === 'vip_service_click').length
  const getModalClicks = () => events.filter(e => e.event_type === 'modal_option1_click' || e.event_type === 'modal_option2_click').length
  const getCTAClicks = () => events.filter(e => e.event_type === 'cta_sidewalk_click').length
  const getUniqueUsers = () => new Set(events.filter(e => e.user_id).map(e => e.user_id)).size

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">数据分析仪表盘</h1>
              <p className="text-sm text-gray-500">最后更新: {lastUpdate}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                🔄 {loading ? '加载中...' : '刷新'}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={events.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                📥 导出CSV
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                🗑️ 删除选中 ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">筛选条件</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">事件类型</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部事件</option>
                <option value="unlock_click">解锁日历</option>
                <option value="vip_service_click">打开服务窗口</option>
                <option value="modal_option1_click">弹窗 - 试用产品</option>
                <option value="modal_option2_click">弹窗 - 代运营服务</option>
                <option value="cta_sidewalk_click">CTA - Meet Sidewalk</option>
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户ID</label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                placeholder="按用户筛选..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分组方式</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">不分组</option>
                <option value="event_type">按事件类型</option>
                <option value="user_id">按用户ID</option>
                <option value="page_path">按页面路径</option>
                <option value="component_location">按组件位置</option>
                <option value="date">按日期</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(eventTypeFilter || userIdFilter || dateFromFilter || dateToFilter || groupBy) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setEventTypeFilter('')
                  setUserIdFilter('')
                  setDateFromFilter('')
                  setDateToFilter('')
                  setGroupBy('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                清除所有筛选
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          {/* Total Events */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">总事件数</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{getTotalClicks()}</p>
          </div>

          {/* Unlock Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">日历解锁</p>
              <span className="text-2xl">🔓</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{getUnlockClicks()}</p>
          </div>

          {/* VIP Service Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">服务窗口</p>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{getVIPClicks()}</p>
          </div>

          {/* Modal Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">弹窗操作</p>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{getModalClicks()}</p>
          </div>

          {/* CTA Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">CTA点击</p>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-3xl font-bold text-pink-600">{getCTAClicks()}</p>
          </div>

          {/* Unique Users */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">独立用户</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{getUniqueUsers()}</p>
          </div>
        </div>

        {/* Grouped Data Display */}
        {groupedData && groupedData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">分组统计数据</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedData.map((group, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{group.key}</p>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                      {group.count}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    占总数的 {(group.count / getTotalClicks() * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">事件详情</h2>
            {events.length > 0 && (
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedIds.size === events.length ? '取消全选' : '全选'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={events.length > 0 && selectedIds.size === events.length}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">事件</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">用户</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">位置</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">页面</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      未找到事件。试试调整筛选条件。
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(event.id)}
                          onChange={() => toggleSelection(event.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center gap-2">
                          {event.event_type === 'unlock_click' && '🔓'}
                          {event.event_type === 'vip_service_click' && '💼'}
                          {event.event_type === 'modal_option1_click' && '🚀'}
                          {event.event_type === 'modal_option2_click' && '📧'}
                          {event.event_type === 'cta_sidewalk_click' && '✨'}
                          <span className="font-medium text-gray-900">
                            {event.event_type === 'unlock_click' && '解锁日历'}
                            {event.event_type === 'vip_service_click' && '打开服务窗口'}
                            {event.event_type === 'modal_option1_click' && '弹窗-试用产品'}
                            {event.event_type === 'modal_option2_click' && '弹窗-代运营服务'}
                            {event.event_type === 'cta_sidewalk_click' && 'CTA-Meet Sidewalk'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {event.user_id || <span className="text-gray-400 italic">匿名</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {event.component_location || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {event.page_path || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          {events.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              显示 {events.length} 条，共 {total} 条事件
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
