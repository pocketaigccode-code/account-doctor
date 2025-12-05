'use client'

import { useEffect, useState } from 'react'
import { getAnalyticsData, clearAnalyticsData, type ClickEventType } from '@/lib/analytics-tracker'

export default function AnalysisPage() {
  const [data, setData] = useState<Array<{ event: ClickEventType; count: number; timestamp: string }>>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const loadData = () => {
    const analyticsData = getAnalyticsData()
    setData(analyticsData)
    setLastUpdate(new Date().toLocaleString('zh-CN'))
  }

  useEffect(() => {
    loadData()
    // 每5秒自动刷新
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleReset = () => {
    if (confirm('确定要清除所有统计数据吗？')) {
      clearAnalyticsData()
      loadData()
    }
  }

  const getTotalClicks = () => {
    return data.reduce((sum, item) => sum + item.count, 0)
  }

  const getUnlockClicks = () => {
    return data.find(item => item.event === 'unlock_click')?.count || 0
  }

  const getVIPClicks = () => {
    return data.find(item => item.event === 'vip_service_click')?.count || 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Last updated: {lastUpdate}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                🗑️ Reset Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Total Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{getTotalClicks()}</p>
          </div>

          {/* Unlock Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Unlock Calendar Clicks</p>
              <span className="text-2xl">🔓</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{getUnlockClicks()}</p>
            <p className="text-xs text-gray-400 mt-1">Users interested in calendar</p>
          </div>

          {/* VIP Service Clicks */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">VIP Service Inquiries</p>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{getVIPClicks()}</p>
            <p className="text-xs text-gray-400 mt-1">High-intent leads</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Count</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Last Click</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">
                      No data yet. Click some buttons to see stats!
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {item.event === 'unlock_click' ? '🔒 Unlock Calendar' : '💼 VIP Service'}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-bold text-gray-900">
                        {item.count}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-500">
                        {new Date(item.timestamp).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong>此页面使用localStorage存储数据，仅在当前浏览器中有效。每5秒自动刷新。
          </p>
        </div>
      </div>
    </div>
  )
}
