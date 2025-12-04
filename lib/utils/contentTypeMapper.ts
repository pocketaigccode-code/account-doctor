/**
 * Content Type Mapper
 * 根据主题文本智能推断内容类型并返回对应的配色和图标
 */

export interface ContentType {
  type: string
  color: {
    primary: string
    light: string
  }
  icon: string
}

export const CONTENT_TYPE_COLORS: Record<string, ContentType> = {
  'Product Showcase': {
    type: 'Product Showcase',
    color: {
      primary: '#9333EA',  // Purple
      light: '#F3E8FF'
    },
    icon: '📦'
  },
  'Behind the Scenes': {
    type: 'Behind the Scenes',
    color: {
      primary: '#EC4899',  // Pink
      light: '#FCE7F3'
    },
    icon: '🎬'
  },
  'Customer Story': {
    type: 'Customer Story',
    color: {
      primary: '#F97316',  // Orange
      light: '#FFEDD5'
    },
    icon: '💬'
  },
  'Vibe & Mood': {
    type: 'Vibe & Mood',
    color: {
      primary: '#3B82F6',  // Blue
      light: '#DBEAFE'
    },
    icon: '✨'
  },
  'Educational': {
    type: 'Educational',
    color: {
      primary: '#10B981',  // Green
      light: '#D1FAE5'
    },
    icon: '📚'
  }
}

/**
 * Infer content type from theme text
 * 三级匹配：精确匹配 → 关键词匹配 → 哈希降级
 */
export function inferContentType(theme: string, dayNumber: number): ContentType {
  const themeLower = theme.toLowerCase()

  // Level 1: 精确匹配
  for (const [typeName, typeData] of Object.entries(CONTENT_TYPE_COLORS)) {
    if (themeLower.includes(typeName.toLowerCase())) {
      return typeData
    }
  }

  // Level 2: 关键词匹配
  const keywords: Record<string, string[]> = {
    'Product Showcase': ['product', 'menu', 'dish', 'special', 'new item', 'showcase', 'feature'],
    'Behind the Scenes': ['behind', 'making', 'preparation', 'kitchen', 'process', 'team', 'staff'],
    'Customer Story': ['customer', 'review', 'testimonial', 'guest', 'visitor', 'story'],
    'Vibe & Mood': ['vibe', 'mood', 'atmosphere', 'ambiance', 'aesthetic', 'feeling'],
    'Educational': ['tip', 'how to', 'guide', 'learn', 'tutorial', 'education', 'fact']
  }

  for (const [typeName, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => themeLower.includes(keyword))) {
      return CONTENT_TYPE_COLORS[typeName]
    }
  }

  // Level 3: 哈希降级（基于day number循环分配）
  const types = Object.values(CONTENT_TYPE_COLORS)
  const index = dayNumber % types.length
  return types[index]
}

/**
 * Get content type by exact name
 */
export function getContentTypeByName(typeName: string): ContentType {
  return CONTENT_TYPE_COLORS[typeName] || CONTENT_TYPE_COLORS['Vibe & Mood']
}
