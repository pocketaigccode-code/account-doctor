/**
 * CalendarDay - 单个日历格子组件
 * Featured变体: 展示图片 + 微光效果
 * Tag变体: 展示彩色标签
 */

'use client'

import { useState } from 'react'
import type { ContentType } from '@/lib/utils/contentTypeMapper'

interface CalendarDayProps {
  day: number
  theme: string
  idea: string
  contentType: ContentType
  variant: 'featured' | 'tag'
  imageUrl?: string
  isDay1?: boolean
}

export function CalendarDay({
  day,
  theme,
  idea,
  contentType,
  variant,
  imageUrl,
  isDay1 = false
}: CalendarDayProps) {
  const [showDetail, setShowDetail] = useState(false)

  if (variant === 'featured') {
    // Featured变体：展示图片
    return (
      <div
        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        {/* Background Image or Gradient */}
        {imageUrl ? (
          <img src={imageUrl} alt={`Day ${day}`} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${contentType.color.light} 0%, white 100%)` }}
          >
            {contentType.icon}
          </div>
        )}

        {/* Overlay with shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/50" />

        {/* Day Number Badge */}
        <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
          <span className="font-sans text-xs font-bold text-charcoal-900">{day}</span>
        </div>

        {/* Day 1 Special: READY badge with pulse */}
        {isDay1 && (
          <div className="absolute top-2 right-2 bg-sage text-white px-3 py-1 rounded-full shadow-lg animate-pulse">
            <span className="font-sans text-xs font-bold">READY</span>
          </div>
        )}

        {/* Hover: Show full content */}
        {showDetail && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-center animate-fade-in">
            <h4 className="font-sans text-sm font-bold text-white mb-2">{theme}</h4>
            <p className="font-sans text-xs text-white/90 leading-relaxed">{idea}</p>
          </div>
        )}
      </div>
    )
  } else {
    // Tag变体：展示彩色标签
    return (
      <div
        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${contentType.color.light} 0%, white 100%)`,
          border: `2px solid ${contentType.color.primary}20`
        }}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        {/* Day Number */}
        <div
          className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
          style={{ backgroundColor: contentType.color.primary }}
        >
          <span className="font-sans text-xs font-bold text-white">{day}</span>
        </div>

        {/* Content Type Tag */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div
            className="px-3 py-1.5 rounded-full text-white shadow-md"
            style={{ backgroundColor: contentType.color.primary }}
          >
            <span className="font-sans text-xs font-semibold whitespace-nowrap flex items-center gap-1">
              <span>{contentType.icon}</span>
              <span>{theme.length > 15 ? theme.substring(0, 15) + '...' : theme}</span>
            </span>
          </div>
        </div>

        {/* Hover: Show full content */}
        {showDetail && (
          <div
            className="absolute inset-0 p-4 flex flex-col justify-center animate-fade-in"
            style={{ backgroundColor: contentType.color.primary }}
          >
            <h4 className="font-sans text-sm font-bold text-white mb-2">{theme}</h4>
            <p className="font-sans text-xs text-white/95 leading-relaxed line-clamp-4">{idea}</p>
          </div>
        )}
      </div>
    )
  }
}
