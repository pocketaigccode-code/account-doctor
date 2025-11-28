/**
 * AI Prompt Set 1: Profile Analyst (账号体检师)
 * 职责: 快速解析Apify数据,输出结构化的Profile Snapshot
 */

import type { InstagramScanData } from '@/lib/scrapers/instagram'
import { formatFollowerCount } from '@/lib/cache/apify-cache'

export const PROFILE_ANALYST_SYSTEM_PROMPT = `
# Role
你是一个 Instagram 账号数据分析专家。你的任务是接收原始的 JSON 数据(由 Apify 抓取),提取关键业务字段,并对账号的健康度进行客观诊断。

# Analysis Logic (诊断逻辑)
1. **活跃度判定 (Activity Status)**:
   - Active: 最新贴在 7 天内
   - Dormant: 最新贴在 7-30 天内
   - Inactive: 最新贴 > 30 天

2. **完整性检查 (Profile Completeness)**:
   - 检查是否有 Website Link (externalUrl)
   - 检查 Bio 中是否包含 Location 信息(地址、城市名等)

3. **行业推断 (Category Inference)**:
   - 优先使用 businessCategoryName
   - 如果为空,根据 biography 和 username 推断最可能的本地商业类型

4. **健康度打分 (Health Score)**:
   - 满分 100 分,基础分 60
   - 扣分项:
     * 不活跃(-20): Inactive状态
     * 不活跃(-10): Dormant状态
     * 无链接(-10): 缺少externalUrl
     * 无地址(-10): Bio中无location信息
     * 标签混乱(-10): hashtags使用不当或过于通用

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
`
}

/**
 * 智能降级方案 (不依赖AI,直接计算)
 */
export function getFastLaneFallback(scanData: InstagramScanData) {
  const { profile, recentPosts } = scanData

  // 计算活跃度
  const lastPostTimestamp = recentPosts[0]?.publishedAt
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
 * 生成关键问题列表
 */
function generateKeyIssues(
  profile: any,
  recentPosts: any[],
  missingElements: string[],
  activityStatus: string
): string[] {
  const issues: string[] = []

  // 问题1: 活跃度
  if (activityStatus === 'Inactive') {
    issues.push(
      `账号已超过30天未更新,Instagram算法会大幅降低你的内容曝光率,建议立即恢复规律发布`
    )
  } else if (activityStatus === 'Dormant') {
    issues.push(
      `发帖频率偏低(${Math.floor((Date.now() - new Date(recentPosts[0].publishedAt).getTime()) / (1000 * 60 * 60 * 24))}天前),建议保持每周2-3次的规律更新`
    )
  } else {
    issues.push(
      `账号保持活跃状态 ✅,继续保持当前的发布频率`
    )
  }

  // 问题2: 转化设置
  if (missingElements.includes('Website')) {
    issues.push(
      `Bio缺少网站链接,白白流失了引流到官网、预订页面或WhatsApp的机会,建议添加Linktree或官网链接`
    )
  }

  if (missingElements.includes('Location')) {
    issues.push(
      `Bio缺少地址信息,本地客户难以找到门店位置,建议添加完整地址或至少城市名称`
    )
  }

  // 问题3: 标签策略
  const allHashtags = recentPosts.flatMap(p => p.hashtags || [])

  if (allHashtags.length === 0) {
    issues.push(
      `最近帖子完全没有使用Hashtag标签,严重影响内容的可发现性,建议每篇帖子使用8-15个相关标签`
    )
  } else {
    // 检查是否有本地标签
    const hasLocalTag = allHashtags.some((tag: string) =>
      /nyc|seattle|la|sf|chicago|miami|boston|austin|portland|denver/i.test(tag)
    )

    if (!hasLocalTag && profile.businessCategoryName) {
      issues.push(
        `未使用本地标签(如#城市名+行业),错失本地客户搜索流量,建议使用#${profile.businessCategoryName}Seattle类似的标签`
      )
    }

    // 检查通用无效标签
    const genericTags = allHashtags.filter((tag: string) =>
      /#(love|like|follow|instagood|photooftheday|beautiful|happy|cute|fashion|style)/i.test(tag)
    )

    if (genericTags.length > allHashtags.length * 0.5) {
      issues.push(
        `超过50%的标签过于通用(#love, #instagood等),建议使用更精准的行业标签和长尾标签`
      )
    }
  }

  // 问题4: 视觉一致性
  if (recentPosts.length >= 5) {
    const typeDistribution = recentPosts.reduce((acc: any, post) => {
      acc[post.type] = (acc[post.type] || 0) + 1
      return acc
    }, {})

    const uniqueTypes = Object.keys(typeDistribution).length

    if (uniqueTypes > 2 && recentPosts.length > 8) {
      issues.push(
        `帖子格式过于分散(图文/视频/轮播混杂),建议形成固定的视觉风格,如统一使用轮播图或Reels`
      )
    }
  }

  // 问题5: 互动率
  const engagementRate = profile.followerCount > 0
    ? (recentPosts.reduce((sum, p) => sum + p.likeCount + p.commentCount, 0) / recentPosts.length) / profile.followerCount
    : 0

  if (engagementRate < 0.01 && profile.followerCount > 1000) {
    issues.push(
      `互动率偏低(<1%),内容可能与受众兴趣不匹配,建议增加提问、投票等互动型内容`
    )
  }

  return issues.slice(0, 3)
}
