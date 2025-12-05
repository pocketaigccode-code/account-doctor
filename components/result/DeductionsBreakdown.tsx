/**
 * 扣分明细展示组件
 * 显示详细的扣分项目和修复建议
 */

'use client'

import type { Deduction } from '@/lib/ai/scoring-engine'

interface DeductionsBreakdownProps {
  deductions: Deduction[]
  initialScore?: number
}

export function DeductionsBreakdown({ deductions, initialScore = 100 }: DeductionsBreakdownProps) {
  if (!deductions || deductions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">Perfect Score!</h3>
        <p className="text-green-700">No deductions - your account is optimally configured!</p>
      </div>
    )
  }

  // 按维度分组
  const groupedByDimension = deductions.reduce((acc, deduction) => {
    if (!acc[deduction.dimension]) {
      acc[deduction.dimension] = []
    }
    acc[deduction.dimension].push(deduction)
    return acc
  }, {} as Record<string, Deduction[]>)

  // 计算总扣分
  const totalDeduction = deductions.reduce((sum, d) => sum + Math.abs(d.score), 0)
  const finalScore = initialScore - totalDeduction

  // 维度图标映射
  const dimensionIcons: Record<string, string> = {
    'Activity': '⚡',
    'Profile Integrity': '🏗️',
    'Operations': '🎯',
    'Health': '💊'
  }

  // 严重程度颜色映射
  const severityColors: Record<string, { bg: string, border: string, text: string }> = {
    'high': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
    'medium': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
    'low': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' }
  }

  return (
    <div className="space-y-6">
      {/* 分数计算公式 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-center gap-4 text-xl font-mono">
          <span className="text-4xl font-bold text-purple-800">{initialScore}</span>
          <span className="text-2xl text-purple-600">-</span>
          <span className="text-4xl font-bold text-red-600">{totalDeduction}</span>
          <span className="text-2xl text-purple-600">=</span>
          <span className="text-5xl font-bold text-gradient-instagram">{finalScore}</span>
        </div>
        <p className="text-center text-sm text-gray-600 mt-3">
          Starting Score - Total Deductions = Your Health Score
        </p>
      </div>

      {/* 按维度展示扣分项 */}
      <div className="space-y-4">
        {Object.entries(groupedByDimension).map(([dimension, items]) => {
          const dimensionTotal = items.reduce((sum, d) => sum + Math.abs(d.score), 0)

          return (
            <div key={dimension} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* 维度标题 */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dimensionIcons[dimension] || '📊'}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{dimension}</h3>
                      <p className="text-sm text-gray-600">{items.length} issue{items.length > 1 ? 's' : ''} detected</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">-{dimensionTotal}</div>
                    <div className="text-xs text-gray-500">points lost</div>
                  </div>
                </div>
              </div>

              {/* 扣分项列表 */}
              <div className="divide-y divide-gray-100">
                {items.map((deduction, index) => {
                  const colors = severityColors[deduction.severity]

                  return (
                    <div key={index} className={`p-6 ${colors.bg} hover:bg-opacity-80 transition-colors`}>
                      <div className="flex items-start gap-4">
                        {/* 扣分值 */}
                        <div className={`flex-shrink-0 w-16 h-16 rounded-full ${colors.border} border-2 flex items-center justify-center ${colors.bg}`}>
                          <span className={`text-2xl font-bold ${colors.text}`}>
                            {deduction.score}
                          </span>
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{deduction.item}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.border} border ${colors.text} uppercase whitespace-nowrap`}>
                              {deduction.severity}
                            </span>
                          </div>

                          {/* 修复建议 */}
                          <div className="bg-white rounded-lg p-4 border-l-4 ${colors.border}">
                            <div className="flex items-start gap-2">
                              <span className="text-xl flex-shrink-0">💡</span>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <strong className="text-gray-900">Fix:</strong> {deduction.fixTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部行动建议 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">🚀</span>
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Quick Win Checklist</h3>
            <ul className="space-y-2">
              {deductions
                .sort((a, b) => a.score - b.score) // 按扣分从多到少排序
                .slice(0, 3) // 只显示前3个最严重的
                .map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">{i + 1}.</span>
                    <span className="text-sm text-blue-800">{d.item}: {d.fixTip.split('.')[0]}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
