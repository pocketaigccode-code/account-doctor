/**
 * MosaicCalendar - Sidewalk风格日历（整合Content Mix）
 * 顶部：Content Mix饼图 + 策略说明
 * 下方：30天日历（根据Content Mix比例分配主题）
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface MosaicCalendarProps {
  day1Detail: {
    title: string
    caption: string
    hashtags: string[]
    image_gen_prompt: string
  }
  monthPlan: Array<{
    day: number
    theme: string
    idea: string
  }>
  contentMix: Array<{
    label: string
    percentage: number
  }>
  brandPersona?: {
    archetype: string
    tone_voice: string
  }
  profileData?: any  // 用于显示手机样机中的用户名
  auditId: string
}

// Content Mix配色方案（对应饼图颜色）
const CHART_COLORS = [
  '#9333EA', // 紫色 - 第1类内容
  '#EC4899', // 粉色 - 第2类内容
  '#F97316', // 橙色 - 第3类内容
  '#3B82F6', // 蓝色 - 第4类内容
  '#10B981', // 绿色 - 第5类内容
]

/**
 * 根据Content Mix比例分配30天的内容主题
 */
function distributeContentByMix(
  contentMix: Array<{ label: string; percentage: number }>,
  totalDays: number = 30
): Array<{ label: string; color: string }> {
  const distribution: Array<{ label: string; color: string }> = []

  contentMix.forEach((mix, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length]
    const count = Math.round((mix.percentage / 100) * totalDays)

    for (let i = 0; i < count; i++) {
      distribution.push({ label: mix.label, color })
    }
  })

  // 如果不足30天，用第一个主题补齐
  while (distribution.length < totalDays) {
    distribution.push({
      label: contentMix[0].label,
      color: CHART_COLORS[0]
    })
  }

  // 如果超过30天，截断
  return distribution.slice(0, totalDays)
}

export function MosaicCalendar({
  day1Detail,
  monthPlan,
  contentMix,
  brandPersona,
  profileData,
  auditId
}: MosaicCalendarProps) {
  // 准备完整的30天数据
  const allDays = [
    {
      day: 1,
      theme: day1Detail.title,
      idea: day1Detail.caption.substring(0, 100) + '...',
      isDay1: true
    },
    ...monthPlan
  ]

  // 根据Content Mix比例分配内容主题
  const contentDistribution = distributeContentByMix(contentMix, 30)

  // 准备饼图数据
  const chartData = contentMix.map((item, i) => ({
    name: item.label,
    value: item.percentage,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))

  // 生成AI策略说明
  const topContent = contentMix[0]?.label || 'content'
  const aiSummary = `Based on your ${brandPersona?.archetype || 'brand positioning'}, focus ${contentMix[0]?.percentage || 0}% on ${topContent} to maximize local engagement and build authentic connections with your community.`

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      {/* 桌面端：左右分栏布局 */}
      <div className="grid md:grid-cols-[55%_45%] gap-8">
        {/* 左侧容器：纵向排列 Content Mix + Calendar */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Content Mix That Wins */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Content Mix That Wins</h2>

            {/* Donut Chart */}
            <div className="flex justify-center mb-4">
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(${chartData.map((item, i) => {
                    let currentPercent = chartData.slice(0, i).reduce((sum, d) => sum + d.value, 0);
                    return `${item.color} ${currentPercent}% ${currentPercent + item.value}%`;
                  }).join(', ')})`,
                  width: '140px',
                  height: '140px'
                }}
              >
                <div className="donut-inner" style={{ width: '95px', height: '95px' }}>
                  <span style={{ fontSize: '26px' }}>🎯</span>
                  <span style={{ fontSize: '10px', color: 'gray' }}>Optimal Mix</span>
                </div>
              </div>
            </div>

            {/* Progress Bar List */}
            <div className="space-y-3">
              {contentMix.map((item, i) => {
                const color = CHART_COLORS[i % CHART_COLORS.length];
                const descriptions = [
                  'High-quality content showcasing your best offerings.',
                  'Behind-the-scenes content to build authenticity.',
                  'Community engagement to strengthen connection.',
                  'Educational content to provide value.',
                  'Promotional content to drive conversions.'
                ];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ color, fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div style={{ width: `${item.percentage}%`, background: color, height: '100%' }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                      {descriptions[i] || 'Content that resonates with your audience.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: 30-Day Content Roadmap */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-2 text-center">30-Day Content Roadmap</h2>
            <p className="text-xs text-gray-600 mb-4 text-center">AI generated a full month of posts for you.</p>

            {/* Calendar Grid */}
            <div className="cal-grid">
              {allDays.map((dayData, index) => {
                const content = contentDistribution[index]
                const color = content.color
                const showEmoji = dayData.day === 1 || dayData.day === 5 || dayData.day === 9

                return (
                  <div key={dayData.day} className="cal-cell">
                    <span>{dayData.day}</span>

                    {showEmoji ? (
                      <div style={{
                        background: '#e0e7ff',
                        color: '#3b82f6',
                        borderRadius: '4px',
                        padding: '4px',
                        textAlign: 'center',
                        fontSize: '14px'
                      }}>
                        📷
                      </div>
                    ) : (
                      <div className="cal-indicator" style={{ background: color }}></div>
                    )}
                  </div>
                )
              })}

              {/* Lock Overlay */}
              <div className="lock-overlay">
                <button className="lock-btn">
                  🔒 Unlock Full Calendar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧容器：Instant Content Fix（撑满高度） */}
        <div className="flex flex-col h-full">
          <h2 className="font-bold text-xl mb-3">Instant Content Fix</h2>
          <p className="text-sm text-gray-600 mb-6">
            Don't just get data. Get ready-to-post images and captions generated by AI.
          </p>

          {/* 手机样机 - 自适应高度 */}
          <div className="flex justify-center items-start flex-1">
            <div style={{
              width: '340px',
              background: '#000',
              borderRadius: '40px',
              padding: '12px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              <div style={{ background: 'white', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Instagram Post Header */}
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {profileData?.handle?.replace('@', '') || 'yourbusiness'}
                  </span>
                  <span style={{ fontSize: '20px' }}>...</span>
                </div>

                {/* Image Placeholder */}
                <div style={{ height: '320px', background: '#f3f4f6', display: 'grid', placeItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '52px' }}>📸</span>
                    <div style={{
                      fontSize: '12px',
                      background: 'white',
                      padding: '7px 14px',
                      borderRadius: '14px',
                      color: '#ec4899',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                      marginTop: '14px',
                      fontWeight: 600
                    }}>
                      ✨ AI Generated
                    </div>
                  </div>
                </div>

                {/* Instagram Action Icons */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Heart Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    {/* Comment Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    {/* Share Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    <div style={{ marginLeft: 'auto' }}>
                      {/* Bookmark Icon */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Caption - 自适应高度，无滚动条 */}
                <div style={{ padding: '16px', fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>{profileData?.handle?.replace('@', '') || 'yourbusiness'}</strong>{' '}
                    {day1Detail.caption}
                  </div>
                  <div style={{ color: '#00376b', fontSize: '12px' }}>
                    {day1Detail.hashtags.join(' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
