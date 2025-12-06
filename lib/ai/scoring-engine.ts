/**
 * 全新评分引擎 - 从100分开始扣分
 * 核心逻辑: Current Score = 100 - Sum(Deductions)
 */

import type { InstagramScanData } from '../scrapers/instagram'

/**
 * 扣分项类型定义
 */
export type DeductionSeverity = 'high' | 'medium' | 'low'

export interface Deduction {
  item: string              // 扣分项名称
  score: number             // 扣分值（负数）
  severity: DeductionSeverity  // 严重程度
  fixTip: string            // 修复建议
  dimension: string         // 所属维度
}

export interface AuditResult {
  score: number             // 最终分数 (0-100)
  grade: string             // 等级 (EXCELLENT/GOOD/NEEDS WORK/WARNING)
  summary_title: string     // 总结标题
  deductions: Deduction[]   // 扣分明细
  key_issues: string[]      // 三大关键问题（每个维度一个）
}

/**
 * 计算账号健康分数
 */
export function calculateHealthScore(scanData: InstagramScanData): AuditResult {
  const { profile, recentPosts } = scanData
  let score = 100
  const deductions: Deduction[] = []

  // ============================================================
  // 第一维度：活跃度与生存状态 (Activity) - 权重最高
  // ============================================================

  // 计算最后发帖天数
  const validPosts = recentPosts.filter(p => p.publishedAt !== null)
  const lastPostTimestamp = validPosts[0]?.publishedAt
  const daysSinceLastPost = lastPostTimestamp
    ? Math.floor((Date.now() - new Date(lastPostTimestamp).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  // 计算30天内发帖数
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const postsInLast30Days = validPosts.filter(p =>
    p.publishedAt && new Date(p.publishedAt).getTime() > thirtyDaysAgo
  ).length

  // 1.1 完全沉寂 (Inactive) -30分 - 强化商业损失钩子
  if (daysSinceLastPost > 30) {
    const penalty = 30
    score -= penalty
    deductions.push({
      item: '⚠️ Ghost Account Alert',
      score: -penalty,
      severity: 'high',
      fixTip: `Your account has been inactive for ${daysSinceLastPost} days. Instagram's algorithm has likely buried you—meaning you're invisible to 90% of your followers. Post TODAY to signal you're alive, or risk losing all organic reach permanently.`,
      dimension: 'Activity'
    })
  }
  // 1.2 休眠状态 (Dormant) -15分 - 添加竞争对手对比
  else if (daysSinceLastPost > 7) {
    const penalty = 15
    score -= penalty
    deductions.push({
      item: '📉 Fading Visibility',
      score: -penalty,
      severity: 'medium',
      fixTip: `Last post was ${daysSinceLastPost} days ago. While you stayed quiet, competitors posted ${Math.floor(daysSinceLastPost / 3)}+ times and stole your audience. Post at least 3x/week or fall behind permanently.`,
      dimension: 'Activity'
    })
  }
  // 1.3 发帖频率过低 -10分 - 量化商业影响
  else if (postsInLast30Days < 3 && profile.postCount > 5) {
    const penalty = 10
    score -= penalty
    deductions.push({
      item: '🐌 Slow Content Pace',
      score: -penalty,
      severity: 'medium',
      fixTip: `Only ${postsInLast30Days} posts in 30 days = missed opportunities. Local businesses posting 3-5x/week get 2.5x more walk-ins. Increase frequency to capture more customers.`,
      dimension: 'Activity'
    })
  }

  // ============================================================
  // 第二维度：基础建设完整度 (Profile Integrity) - 转化关键
  // ============================================================

  // 2.1 缺少头像 (Default Avatar) -20分 - 强化信任损失
  if (!profile.profilePicUrl || profile.profilePicUrl.includes('default')) {
    const penalty = 20
    score -= penalty
    deductions.push({
      item: '🚫 No Face, No Trust',
      score: -penalty,
      severity: 'high',
      fixTip: `Accounts without a professional profile photo get skipped by 93% of visitors—they look like spam or abandoned accounts. Upload a high-res logo or storefront photo within 24 hours to stop losing customers.`,
      dimension: 'Profile Integrity'
    })
  }

  // 2.2 缺少外部链接 (No Link) -15分 - 强调订单流失
  if (!profile.externalUrl) {
    const penalty = 15
    score -= penalty
    deductions.push({
      item: '💸 Lost Revenue Pipeline',
      score: -penalty,
      severity: 'high',
      fixTip: `No link in bio = no way to book/order/buy. You're bleeding potential customers who want to pay you but can't find how. Add your booking link, menu, or website NOW—this alone can boost conversions by 40%.`,
      dimension: 'Profile Integrity'
    })
  }

  // 2.3 Bio简介缺失/过短 -10分 - 强调搜索可见性损失
  if (!profile.biography || profile.biography.length < 10) {
    const penalty = 10
    score -= penalty
    deductions.push({
      item: '🔍 Invisible to Search',
      score: -penalty,
      severity: 'medium',
      fixTip: `Your bio is too short to rank in Instagram search. People searching for businesses like yours will find competitors instead. Write a 50-150 character bio with your location + service + unique selling point.`,
      dimension: 'Profile Integrity'
    })
  }

  // 2.4 缺少行业关键词 -5分 - 强调算法推荐损失
  const bio = (profile.biography || '').toLowerCase()
  const industryKeywords = ['shop', 'store', 'studio', 'official', 'design', 'cafe', 'restaurant', 'bar', 'salon', 'gym', 'fitness']
  const hasIndustryKeyword = industryKeywords.some(keyword => bio.includes(keyword))

  if (!hasIndustryKeyword && bio.length > 0) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: `🤖 Algorithm Can't Categorize You`,
      score: -penalty,
      severity: 'low',
      fixTip: `Instagram's algorithm doesn't know what you sell, so it won't recommend you to interested users. Add industry keywords like "Coffee Shop" or "Nail Salon" to your bio to unlock 3x more discovery reach.`,
      dimension: 'Profile Integrity'
    })
  }

  // ============================================================
  // 第三维度：深度运营与技巧 (Operations & Strategy) - 涨粉关键
  // ============================================================

  // 3.1 Hashtag使用不当 -5分 - 强调免费流量损失
  const allHashtags = recentPosts.flatMap(p => p.hashtags || [])
  const avgHashtags = recentPosts.length > 0 ? allHashtags.length / recentPosts.length : 0

  if (avgHashtags < 3) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: '🏷️ Missing Free Traffic',
      score: -penalty,
      severity: 'low',
      fixTip: `You're using ${avgHashtags.toFixed(1)} hashtags per post. That's like opening a store without a sign. Add 8-15 local + niche hashtags (e.g., #YourCityCoffee #SpecialtyLatte) to 3x your reach—it's FREE advertising.`,
      dimension: 'Operations'
    })
  }

  // 3.2 缺少地理位置标签 -5分 - 强调本地客户流失
  const postsWithLocation = recentPosts.filter(p => p.locationName).length
  const locationTagRate = recentPosts.length > 0 ? postsWithLocation / recentPosts.length : 0

  if (locationTagRate < 0.3 && recentPosts.length >= 3) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: '📍 Hidden from Local Customers',
      score: -penalty,
      severity: 'low',
      fixTip: `Only ${Math.round(locationTagRate * 100)}% of posts are geo-tagged. Nearby customers searching "coffee near me" won't find you. Add your exact business location to EVERY post to capture walk-in traffic—competitors are doing this.`,
      dimension: 'Operations'
    })
  }

  // ============================================================
  // 第四维度：账号健康度 (Health Check) - 避坑指南
  // ============================================================

  // 4.1 关注比失衡 (Mass Follower) -10分 - 强调信任度损失
  if (profile.followingCount > 1000 && profile.followingCount > profile.followerCount) {
    const penalty = 10
    score -= penalty
    const ratio = (profile.followingCount / Math.max(profile.followerCount, 1)).toFixed(1)
    deductions.push({
      item: '⚖️ Looks Like Spam Account',
      score: -penalty,
      severity: 'medium',
      fixTip: `Following ${profile.followingCount} with only ${profile.followerCount} followers (${ratio}:1 ratio) screams "desperate bot account." Real customers avoid profiles like this. Unfollow 500+ accounts TODAY to restore legitimacy—or watch engagement plummet.`,
      dimension: 'Health'
    })
  }

  // ============================================================
  // 计算最终分数和等级
  // ============================================================

  score = Math.max(0, Math.min(100, score)) // 确保在 0-100 范围内

  const grade = getGrade(score)
  const summaryTitle = generateSummaryTitle(score, deductions)
  const keyIssues = generateKeyIssues(deductions)

  return {
    score,
    grade,
    summary_title: summaryTitle,
    deductions,
    key_issues: keyIssues
  }
}

/**
 * 根据分数获取等级
 */
function getGrade(score: number): string {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 75) return 'GOOD'
  if (score >= 60) return 'NEEDS WORK'
  return 'WARNING'
}

/**
 * 生成总结标题 - 强化商业损失钩子
 */
function generateSummaryTitle(score: number, deductions: Deduction[]): string {
  if (score >= 90) {
    return '🏆 Top 5% Account - Minor Tweaks to Dominate Locally'
  } else if (score >= 75) {
    return '💪 Strong Setup, But Leaving Money on the Table'
  } else if (score >= 60) {
    const mainIssue = deductions.find(d => d.severity === 'high')
    if (mainIssue) {
      // 提取问题关键词（去掉emoji）
      const issueKey = mainIssue.item.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()
      return `⚠️ ${issueKey} Is Costing You Customers Daily`
    }
    return '📉 Decent Start, But Competitors Are Winning'
  } else if (score >= 40) {
    return '🚨 Critical Gaps - Hemorrhaging Potential Revenue'
  } else {
    return '💀 Account on Life Support - Fix These or Close Shop'
  }
}

/**
 * 生成三大关键问题（每个维度选一个最严重的）
 */
function generateKeyIssues(deductions: Deduction[]): string[] {
  const dimensions = ['Activity', 'Profile Integrity', 'Operations', 'Health']
  const issues: string[] = []

  for (const dimension of dimensions) {
    const dimensionDeductions = deductions
      .filter(d => d.dimension === dimension)
      .sort((a, b) => a.score - b.score) // 按扣分从多到少排序

    if (dimensionDeductions.length > 0) {
      const topIssue = dimensionDeductions[0]
      issues.push(`${dimension}: ${topIssue.fixTip}`)
    }

    if (issues.length >= 3) break // 只取前3个
  }

  // 如果不足3个，补充带商业钩子的正向建议
  while (issues.length < 3) {
    const positives = [
      '💡 Quick Win: Respond to DMs within 1 hour—67% of users expect instant replies, and fast responses convert 3x better than delays.',
      '🎯 Untapped Goldmine: Post Reels featuring your location—they get 22% more local reach than static posts and drive foot traffic.',
      '🔥 Competitor Intel: Check what your top 3 local rivals post weekly—then create better versions to steal their audience legally.'
    ]
    issues.push(positives[issues.length] || '📊 Monitor Insights weekly—accounts that track analytics grow 4x faster than those flying blind.')
  }

  return issues
}
