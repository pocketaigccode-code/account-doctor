/**
 * Generate Placeholder - 生成占位图
 * 阶段1: Unsplash Source API
 * 阶段2: 渐变背景 + Emoji
 * 阶段3: AI图片生成（未来）
 */

import type { ContentType } from './contentTypeMapper'

/**
 * Generate Unsplash placeholder URL based on content type
 */
export function generateUnsplashPlaceholder(
  contentType: ContentType,
  seed: string
): string {
  const keywords: Record<string, string[]> = {
    'Product Showcase': ['food', 'product', 'dish'],
    'Behind the Scenes': ['kitchen', 'cooking', 'preparation'],
    'Customer Story': ['people', 'customer', 'happy'],
    'Vibe & Mood': ['aesthetic', 'atmosphere', 'interior'],
    'Educational': ['learning', 'tutorial', 'guide']
  }

  const typeKeywords = keywords[contentType.type] || ['business']
  const query = typeKeywords.join(',')

  // Unsplash Source API with size and seed for consistency
  return `https://source.unsplash.com/400x400/?${query}&sig=${seed}`
}

/**
 * Generate gradient background as fallback
 */
export function generateGradientPlaceholder(contentType: ContentType): {
  gradient: string
  icon: string
} {
  return {
    gradient: `linear-gradient(135deg, ${contentType.color.light} 0%, white 100%)`,
    icon: contentType.icon
  }
}

/**
 * Get placeholder for a specific day
 * Returns either Unsplash URL or gradient config
 */
export function getPlaceholderForDay(
  day: number,
  contentType: ContentType,
  auditId: string,
  useUnsplash: boolean = true
): string | { gradient: string; icon: string } {
  if (useUnsplash) {
    const seed = `${auditId}-day${day}`
    return generateUnsplashPlaceholder(contentType, seed)
  } else {
    return generateGradientPlaceholder(contentType)
  }
}
