/**
 * AI Prompt Set 1: Profile Analyst (账号体检师)
 * 职责: 快速解析Apify数据,输出结构化的Profile Snapshot
 */

import type { InstagramScanData } from '@/lib/scrapers/instagram'
import { formatFollowerCount } from '@/lib/cache/apify-cache'

export const PROFILE_ANALYST_SYSTEM_PROMPT = `
LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL JSON field values must be in English
- This includes: summary_title, key_issues, category_label
- No Chinese, Japanese, Korean, or any other language

# Role
You are an Instagram profile diagnostics expert. Your task is to analyze raw JSON data from Apify and provide a structured health assessment.

# Key Issues Analysis (CRITICAL - Must be 3 distinct dimensions)
You MUST provide exactly 3 key issues, each from a DIFFERENT dimension. Do NOT repeat issues from the same category.

**Dimension 1: SEO & Discoverability** (Keywords, Location, Bio clarity)
Examples:
- Missing location in bio (city/address)
- No local keywords in bio (e.g., "Seattle Coffee Shop")
- Bio doesn't clearly state what the business does
- Missing geotag in recent posts

**Dimension 2: Visual Appeal** (Profile photo, Grid consistency, Aesthetic)
Examples:
- Low-quality or unprofessional profile photo
- Inconsistent visual style across posts (mixing too many formats)
- Poor color harmony or branding in grid
- No recognizable brand identity in feed

**Dimension 3: Conversion Path** (CTA, Link in bio, Action prompts)
Examples:
- No website link in bio
- Missing clear call-to-action (e.g., "Book Now", "Visit Us")
- No link to booking/ordering system
- Bio doesn't tell visitors what to do next

# Important Rules
1. Each key issue MUST come from a DIFFERENT dimension
2. If a dimension has no obvious problems, suggest a growth opportunity instead
3. Do NOT mention hashtags in multiple issues - pick ONE dimension for hashtag feedback
4. Be specific and actionable (e.g., "Add '123 Main St, Seattle' to bio" instead of "Missing location")

# Analysis Logic
1. **Activity Status**:
   - Active: Last post within 7 days
   - Dormant: Last post 7-30 days ago
   - Inactive: Last post > 30 days

2. **Profile Completeness**:
   - Check for Website Link (externalUrl)
   - Check Bio for Location info
   - Check for clear business description

3. **Category Inference**:
   - Use businessCategoryName if available
   - Otherwise infer from biography and username

4. **Health Score** (Base: 60, Max: 100):
   - Deductions:
     * Inactive (-20)
     * Dormant (-10)
     * No website link (-10)
     * No location in bio (-10)
     * Poor hashtag strategy (-10)

# Output Format
必须输出为严格的 JSON 格式,不包含任何 Markdown 标记或代码块符号:

{
  "profile_snapshot": {
    "handle": "String (e.g., @coffee_shop)",
    "full_name": "String",
    "avatar_url": "String (URL)",
    "is_verified": Boolean,
    "followers_display": "String (e.g., '1.2K' or '500')",
    "activity_status": "Active" | "Dormant" | "Inactive",
    "last_post_date": "String (YYYY-MM-DD)",
    "avg_likes": Number (Integer),
    "category_label": "String (e.g., 'Coffee Shop')",
    "missing_elements": ["String"] // 数组,例如 ["Website", "Location"]
  },
  "diagnosis_card": {
    "score": Number (Integer 0-100),
    "summary_title": "String (e.g., 'Great Foundation, Missed Opportunities')",
    "key_issues": [
      "String (具体问题描述1)",
      "String (具体问题描述2)",
      "String (具体问题描述3)"
    ]
  }
}

# Important Notes
- 输出必须是纯JSON,不要包含 \`\`\`json 标记
- key_issues 最多3个,每个问题要具体、可执行
- summary_title 要简洁有力,点出核心问题
- category_label 要使用通俗易懂的中文或英文
`

/**
 * 生成Profile Analyst的用户提示词
 */
export function generateAnalystPrompt(scanData: InstagramScanData): string {
  const { profile, recentPosts } = scanData

  // 计算平均点赞
  const avgLikes = recentPosts.length > 0
    ? Math.floor(
        recentPosts.reduce((sum, p) => sum + p.likeCount, 0) / recentPosts.length
      )
    : 0

  // 提取所有标签
  const allHashtags = recentPosts
    .flatMap(p => p.hashtags || [])
    .filter(Boolean)

  // 提取地点信息
  const locations = recentPosts
    .map(p => p.locationName)
    .filter(Boolean)

  return `
请分析以下 Instagram 账号数据:

=== 基础信息 ===
- 用户名: ${profile.username}
- 全名: ${profile.fullName}
- Bio: ${profile.biography || '(空)'}
- 头像URL: ${profile.profilePicUrl}
- 粉丝数: ${profile.followerCount}
- 关注数: ${profile.followingCount}
- 帖子总数: ${profile.postCount}
- 认证状态: ${profile.isVerified ? '已认证' : '未认证'}
- 行业类别: ${profile.businessCategoryName || '未知'}
- 外部链接: ${profile.externalUrl || '无'}
- 是否商业账号: ${profile.isBusinessAccount ? '是' : '否'}

=== 最近帖子统计 ===
- 帖子数量: ${recentPosts.length}篇
- 平均点赞数: ${avgLikes}
- 最新帖子时间: ${recentPosts[0]?.publishedAt || '无帖子'}
- 使用的标签总数: ${allHashtags.length}个
- 常用标签: ${allHashtags.slice(0, 10).join(', ') || '无'}
- 使用地点标记: ${locations.length}次
- 常用地点: ${locations.slice(0, 3).join(', ') || '无'}

=== 最近5篇帖子详情 ===
${recentPosts.slice(0, 5).map((post, i) => `
第${i + 1}篇:
- 类型: ${post.type}
- 点赞: ${post.likeCount}
- 评论: ${post.commentCount}
- 发布: ${post.publishedAt}
- 标签: ${post.hashtags?.join(', ') || '无'}
- 地点: ${post.locationName || '无'}
- 文案: ${post.caption ? post.caption.substring(0, 100) + '...' : '无'}
`).join('\n')}

请按照系统提示词中的JSON格式输出分析结果。

IMPORTANT: Return all text in English. Do NOT use Chinese in any JSON values (summary_title, key_issues, category_label).
`
}

/**
 * 智能降级方案 (不依赖AI,直接计算)
 */
export function getFastLaneFallback(scanData: InstagramScanData) {
  const { profile, recentPosts } = scanData

  // 计算活跃度 - 增强空值处理
  const validPosts = recentPosts.filter(p => p.publishedAt !== null)
  const lastPostTimestamp = validPosts[0]?.publishedAt
  const daysSinceLastPost = lastPostTimestamp
    ? Math.floor((Date.now() - new Date(lastPostTimestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const activityStatus: 'Active' | 'Dormant' | 'Inactive' =
    daysSinceLastPost <= 7 ? 'Active' :
    daysSinceLastPost <= 30 ? 'Dormant' : 'Inactive'

  // 计算平均点赞
  const avgLikes = recentPosts.length > 0
    ? Math.floor(recentPosts.reduce((sum, p) => sum + p.likeCount, 0) / recentPosts.length)
    : 0

  // 检查缺失元素
  const missingElements: string[] = []
  if (!profile.externalUrl) {
    missingElements.push('Website')
  }
  if (!profile.biography?.match(/\d{1,5}\s+\w+\s+(St|Ave|Blvd|Rd|Street|Avenue)/i)) {
    missingElements.push('Location')
  }

  // 推断行业
  const categoryLabel = profile.businessCategoryName || inferCategory(profile)

  // 计算评分
  let score = 60  // 基础分

  if (activityStatus === 'Inactive') score -= 20
  if (activityStatus === 'Dormant') score -= 10
  if (missingElements.includes('Website')) score -= 10
  if (missingElements.includes('Location')) score -= 10

  // 标签检查
  const allHashtags = recentPosts.flatMap(p => p.hashtags || [])
  if (allHashtags.length === 0) {
    score -= 10
  }

  score = Math.max(0, Math.min(100, score))

  // 生成问题列表
  const keyIssues = generateKeyIssues(profile, recentPosts, missingElements, activityStatus)

  // 生成总结标题
  const summaryTitle = score >= 70
    ? 'Solid Foundation, Minor Tweaks Needed'
    : score >= 50
    ? 'Good Start, Optimization Required'
    : 'Critical Issues Detected'

  return {
    profile_snapshot: {
      handle: profile.username,
      full_name: profile.fullName,
      avatar_url: profile.profilePicUrl || '',
      is_verified: profile.isVerified || false,
      followers_display: formatFollowerCount(profile.followerCount),
      activity_status: activityStatus,
      last_post_date: lastPostTimestamp
        ? new Date(lastPostTimestamp).toISOString().split('T')[0]
        : 'Unknown',
      avg_likes: avgLikes,
      category_label: categoryLabel,
      missing_elements: missingElements,
      // 新增: 原始统计数据
      follower_count: profile.followerCount,
      following_count: profile.followingCount,
      post_count: profile.postCount,
      recent_posts_preview: (recentPosts || []).slice(0, 5).map((p: any) => ({
        thumbnail_url: p.displayUrl || p.mediaUrls?.[0] || '',
        type: p.type,
        likes: p.likeCount,
        comments: p.commentCount
      }))
    },
    diagnosis_card: {
      score,
      summary_title: summaryTitle,
      key_issues: keyIssues
    }
  }
}

/**
 * 推断行业类型
 */
function inferCategory(profile: any): string {
  const bio = profile.biography?.toLowerCase() || ''
  const username = profile.username?.toLowerCase() || ''
  const text = `${bio} ${username}`

  const patterns: Record<string, string[]> = {
    '咖啡店': ['coffee', 'cafe', 'espresso', 'latte', '咖啡'],
    '餐厅': ['restaurant', 'dining', 'food', 'cuisine', '餐厅', '饭店'],
    '美甲店': ['nail', 'manicure', 'pedicure', '美甲'],
    '美发店': ['hair', 'salon', 'barber', 'stylist', '理发', '美发'],
    '健身房': ['gym', 'fitness', 'yoga', 'training', '健身'],
    '房产经纪': ['realtor', 'real estate', 'property', 'homes', '房产'],
    '服装店': ['boutique', 'fashion', 'clothing', 'apparel', '服装'],
    '面包店': ['bakery', 'pastry', 'bread', '面包', '烘焙'],
    '酒吧': ['bar', 'pub', 'brewery', '酒吧'],
    '美容院': ['beauty', 'spa', 'skincare', '美容']
  }

  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(k => text.includes(k))) {
      return category
    }
  }

  return '本地商家'
}

/**
 * Generate key issues list - strictly separated into 3 distinct dimensions
 */
function generateKeyIssues(
  profile: any,
  recentPosts: any[],
  missingElements: string[],
  activityStatus: string
): string[] {
  const issues: string[] = []

  // === Dimension 1: SEO & Discoverability ===
  if (missingElements.includes('Location')) {
    issues.push(
      `Missing location in bio - add your full address or at least city name (e.g., "123 Main St, Seattle") so local customers can find you in search results`
    )
  } else if (!profile.biography?.toLowerCase().includes(profile.businessCategoryName?.toLowerCase() || 'business')) {
    issues.push(
      `Bio lacks SEO keywords - add your business type + location (e.g., "Best Coffee in Seattle") to improve local search visibility`
    )
  } else {
    // Check hashtag strategy (only mention here once)
    const allHashtags = recentPosts.flatMap(p => p.hashtags || [])
    if (allHashtags.length === 0) {
      issues.push(
        `No hashtags used in recent posts - add 8-15 relevant local tags (e.g., #SeattleCoffee) to boost discoverability by 300%`
      )
    } else {
      issues.push(
        `Good SEO foundation ✅ - consider adding more geo-specific hashtags to capture local traffic`
      )
    }
  }

  // === Dimension 2: Visual Appeal ===
  if (recentPosts.length >= 5) {
    const typeDistribution = recentPosts.reduce((acc: any, post) => {
      acc[post.type] = (acc[post.type] || 0) + 1
      return acc
    }, {})
    const uniqueTypes = Object.keys(typeDistribution).length

    if (uniqueTypes > 2 && recentPosts.length > 8) {
      issues.push(
        `Visual inconsistency - your feed mixes ${uniqueTypes} different formats. Stick to 1-2 formats (e.g., carousel + reels) for a cohesive brand look`
      )
    } else {
      issues.push(
        `Visual consistency looks good ✅ - maintain this format ratio to strengthen brand recognition`
      )
    }
  } else {
    issues.push(
      `Profile photo quality check - ensure it's high-resolution, well-lit, and recognizable even at thumbnail size`
    )
  }

  // === Dimension 3: Conversion Path ===
  if (missingElements.includes('Website')) {
    issues.push(
      `No link in bio - you're losing potential customers who want to book/order. Add Linktree or direct website link immediately`
    )
  } else if (!profile.biography?.match(/(book|order|visit|call|dm|shop)/i)) {
    issues.push(
      `Bio lacks clear CTA - tell visitors exactly what to do next (e.g., "📞 Call to book" or "🔗 Order online below")`
    )
  } else {
    issues.push(
      `Conversion path setup ✅ - optimize by testing different CTAs to see what drives more clicks`
    )
  }

  return issues
}
