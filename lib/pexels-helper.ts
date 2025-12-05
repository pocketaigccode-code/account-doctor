/**
 * Pexels 图片搜索辅助函数
 */

import { callGemini, parseJSON } from './ai/gemini-client'

/**
 * 根据用户的行业/类别生成英文搜索关键词
 * @param category - 用户的行业类别（中文或英文）
 * @param businessType - 业务类型补充信息
 * @returns 英文搜索关键词
 */
export function generatePexelsQuery(category?: string, businessType?: string): string {
  // 行业关键词映射（中文 -> 英文）
  const categoryMapping: Record<string, string> = {
    // 餐饮类
    '餐厅': 'restaurant food dining',
    '火锅': 'hotpot food dining',
    '越南餐厅': 'vietnamese food pho restaurant',
    'Pho Restaurant': 'vietnamese food pho restaurant',
    'Vietnamese': 'vietnamese food restaurant',
    '咖啡店': 'coffee shop cafe',
    '面包店': 'bakery bread pastries',
    '奶茶店': 'bubble tea drink',

    // 美容类
    '美甲': 'nail salon manicure',
    'Nail Salon': 'nail salon manicure',
    '美发': 'hair salon',
    '美容': 'beauty salon spa',
    'Spa': 'spa wellness massage',

    // 健身类
    '健身房': 'gym fitness workout',
    'Gym': 'gym fitness workout',
    '瑜伽': 'yoga studio wellness',

    // 其他
    '服装店': 'clothing boutique fashion',
    '花店': 'flower shop florist',
    '宠物店': 'pet store grooming',
    'Pet Store': 'pet store animals'
  }

  // 优先使用映射表
  if (category && categoryMapping[category]) {
    return categoryMapping[category]
  }

  // 如果有businessType，尝试从中提取关键词
  if (businessType) {
    const lowerType = businessType.toLowerCase()
    for (const [key, value] of Object.entries(categoryMapping)) {
      if (lowerType.includes(key.toLowerCase())) {
        return value
      }
    }
  }

  // 兜底：使用通用关键词
  return 'business professional modern'
}

/**
 * 调用 Pexels API 获取图片
 * @param query - 搜索关键词
 * @param count - 图片数量（默认30）
 * @returns 图片URL数组
 */
export async function fetchPexelsImages(
  query: string,
  count: number = 30
): Promise<string[]> {
  try {
    const response = await fetch(
      `/api/pexels/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Pexels images')
    }

    const data = await response.json()

    if (!data.success || !data.photos) {
      throw new Error('Invalid Pexels response')
    }

    // 显示请求统计信息
    if (data.rate_limit) {
      const { remaining, limit, reset_date } = data.rate_limit
      console.log(`[Pexels] 📊 API配额统计:`)
      console.log(`   ├─ 剩余请求: ${remaining.toLocaleString()}`)
      console.log(`   ├─ 总限额: ${limit.toLocaleString()}`)
      console.log(`   ├─ 使用率: ${((1 - remaining / limit) * 100).toFixed(2)}%`)
      console.log(`   └─ 重置时间: ${reset_date ? new Date(reset_date).toLocaleString('zh-CN') : 'Unknown'}`)
    }

    // 显示分页信息
    if (data.pagination) {
      console.log(`[Pexels] 📄 分页信息: 第 ${data.pagination.page} 页，共 ${data.total.toLocaleString()} 张图片`)
    }

    // 返回medium_url数组（适合社交媒体展示）
    return data.photos.map((photo: any) => photo.medium_url)
  } catch (error) {
    console.error('[Pexels Helper] 获取图片失败:', error)
    // 返回空数组，让UI显示占位符
    return []
  }
}

/**
 * 🤖 使用AI分析用户数据，智能生成Pexels搜索关键词
 * @param profileData - Instagram账号数据
 * @returns Pexels英文搜索关键词
 */
export async function generateIndustryKeywordsWithAI(profileData: {
  biography?: string
  latestPosts?: Array<{
    caption?: string
    hashtags?: string[]
  }>
}): Promise<string> {
  try {
    const { biography, latestPosts } = profileData

    // 提取数据
    const bio = biography || '无简介'
    const captions = latestPosts?.slice(0, 5).map((post, i) =>
      `${i + 1}. ${post.caption || '无文案'}`
    ).join('\n') || '无帖子数据'

    const allHashtags = latestPosts?.slice(0, 5)
      .flatMap(post => post.hashtags || [])
      .filter(tag => tag) // 去除空值
      .slice(0, 20) // 最多取20个
      .join(', ') || '无标签'

    console.log('[AI Industry] 📤 开始AI行业识别...')

    // AI提示词
    const systemPrompt = '你是一个专业的本地商家行业分类专家。分析Instagram账号数据，识别商家的主要行业类型，并生成Pexels图片搜索关键词。'

    const userPrompt = `分析以下Instagram账号数据，识别商家的行业类型，并生成Pexels图片搜索关键词。

【个人简介】
${bio}

【最近帖子的文案】
${captions}

【使用的标签】
${allHashtags}

---

请完成以下任务：

1. **行业识别**（详细）：这是什么类型的商家？（可以详细描述）

2. **细分领域**（详细）：具体做什么？有什么特色？

3. **Pexels关键词**（⭐ 重点）：生成2-3个核心英文关键词用于Pexels图片搜索。

**Pexels关键词的严格要求**：
✅ 必须遵守：
  - 总长度：20-35个字符
  - 包含2-3个核心词
  - 必须包含行业主词（salon/restaurant/cafe/gym/bakery/nail等）
  - 可以加1个修饰词（curly/vietnamese/nail/burger等）
  - 不要地名（liverpool/paris/new york等对视觉搜索无帮助）
  - 不要抽象词（professional/modern/business等）

✅ 优秀示例（请严格模仿格式）：
  - 卷发沙龙 → "curly hair salon"  (18字符)
  - 美甲店 → "nail salon manicure"  (20字符)
  - 越南餐厅 → "vietnamese pho restaurant"  (27字符)
  - 烘焙店 → "bakery pastries cafe"  (21字符)
  - 健身房 → "gym fitness workout"  (20字符)
  - 汉堡店 → "burger grill restaurant"  (23字符)

❌ 错误示例（避免）：
  - "hair salon barber liverpool, hair color extensions..." (太长，有地名)
  - "business professional modern" (太抽象)
  - "restaurant food dining delicious" (太泛化)

请以JSON格式返回（只返回JSON，不要其他文字）：
{
  "industry": "详细的行业类型（可以很详细）",
  "sub_category": "细分领域和特色（可以很详细）",
  "pexels_keywords": "2-3个核心英文词（20-35字符）"
}`

    // 调用AI
    const aiResponse = await callGemini(userPrompt, systemPrompt, 500)
    const result = parseJSON(aiResponse, 'IndustryKeywords')

    const keywords = result.pexels_keywords || 'business professional modern'

    console.log(`[AI Industry] ✅ 识别结果: ${result.industry} → ${keywords}`)

    return keywords

  } catch (error) {
    console.error('[AI Industry] ❌ AI识别失败:', error)
    // 返回通用关键词作为fallback
    return 'business professional modern'
  }
}
