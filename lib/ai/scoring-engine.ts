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

  // 1.1 完全沉寂 (Inactive) -30分
  if (daysSinceLastPost > 30) {
    const penalty = 30
    score -= penalty
    deductions.push({
      item: 'Account Inactive',
      score: -penalty,
      severity: 'high',
      fixTip: 'Your account has been inactive for over 30 days. Post fresh content immediately to re-engage your audience and restore visibility.',
      dimension: 'Activity'
    })
  }
  // 1.2 休眠状态 (Dormant) -15分
  else if (daysSinceLastPost > 7) {
    const penalty = 15
    score -= penalty
    deductions.push({
      item: 'Low Activity (Dormant)',
      score: -penalty,
      severity: 'medium',
      fixTip: `Last post was ${daysSinceLastPost} days ago. Maintain at least 1 post per week to stay visible in followers' feeds.`,
      dimension: 'Activity'
    })
  }
  // 1.3 发帖频率过低 -10分
  else if (postsInLast30Days < 3 && profile.postCount > 5) {
    const penalty = 10
    score -= penalty
    deductions.push({
      item: 'Inconsistent Posting',
      score: -penalty,
      severity: 'medium',
      fixTip: `Only ${postsInLast30Days} posts in the last 30 days. Aim for 3-5 posts per week for optimal engagement.`,
      dimension: 'Activity'
    })
  }

  // ============================================================
  // 第二维度：基础建设完整度 (Profile Integrity) - 转化关键
  // ============================================================

  // 2.1 缺少头像 (Default Avatar) -20分
  if (!profile.profilePicUrl || profile.profilePicUrl.includes('default')) {
    const penalty = 20
    score -= penalty
    deductions.push({
      item: 'Missing Profile Photo',
      score: -penalty,
      severity: 'high',
      fixTip: 'Upload a high-quality, recognizable profile photo. Accounts without photos lose 90% of potential followers.',
      dimension: 'Profile Integrity'
    })
  }

  // 2.2 缺少外部链接 (No Link) -15分
  if (!profile.externalUrl) {
    const penalty = 15
    score -= penalty
    deductions.push({
      item: 'No Website Link',
      score: -penalty,
      severity: 'high',
      fixTip: 'Add a link to your website, booking page, or Linktree. This is crucial for converting followers into customers.',
      dimension: 'Profile Integrity'
    })
  }

  // 2.3 Bio简介缺失/过短 -10分
  if (!profile.biography || profile.biography.length < 10) {
    const penalty = 10
    score -= penalty
    deductions.push({
      item: 'Incomplete Bio',
      score: -penalty,
      severity: 'medium',
      fixTip: 'Write a clear, compelling bio (50-150 characters) that tells visitors who you are and what you offer.',
      dimension: 'Profile Integrity'
    })
  }

  // 2.4 缺少行业关键词 -5分
  const bio = (profile.biography || '').toLowerCase()
  const industryKeywords = ['shop', 'store', 'studio', 'official', 'design', 'cafe', 'restaurant', 'bar', 'salon', 'gym', 'fitness']
  const hasIndustryKeyword = industryKeywords.some(keyword => bio.includes(keyword))

  if (!hasIndustryKeyword && bio.length > 0) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: 'Missing Industry Keywords',
      score: -penalty,
      severity: 'low',
      fixTip: 'Add industry-specific keywords to your bio (e.g., "Coffee Shop", "Design Studio") to improve SEO and discoverability.',
      dimension: 'Profile Integrity'
    })
  }

  // ============================================================
  // 第三维度：深度运营与技巧 (Operations & Strategy) - 涨粉关键
  // ============================================================

  // 3.1 Hashtag使用不当 -5分
  const allHashtags = recentPosts.flatMap(p => p.hashtags || [])
  const avgHashtags = recentPosts.length > 0 ? allHashtags.length / recentPosts.length : 0

  if (avgHashtags < 3) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: 'Insufficient Hashtags',
      score: -penalty,
      severity: 'low',
      fixTip: `Average ${avgHashtags.toFixed(1)} hashtags per post. Use 8-15 relevant hashtags to increase discoverability by 300%.`,
      dimension: 'Operations'
    })
  }

  // 3.2 缺少地理位置标签 -5分
  const postsWithLocation = recentPosts.filter(p => p.locationName).length
  const locationTagRate = recentPosts.length > 0 ? postsWithLocation / recentPosts.length : 0

  if (locationTagRate < 0.3 && recentPosts.length >= 3) {
    const penalty = 5
    score -= penalty
    deductions.push({
      item: 'No Location Tags',
      score: -penalty,
      severity: 'low',
      fixTip: `Only ${Math.round(locationTagRate * 100)}% of posts have location tags. Tag your business location to attract local customers.`,
      dimension: 'Operations'
    })
  }

  // ============================================================
  // 第四维度：账号健康度 (Health Check) - 避坑指南
  // ============================================================

  // 4.1 关注比失衡 (Mass Follower) -10分
  if (profile.followingCount > 1000 && profile.followingCount > profile.followerCount) {
    const penalty = 10
    score -= penalty
    const ratio = (profile.followingCount / Math.max(profile.followerCount, 1)).toFixed(1)
    deductions.push({
      item: 'Follower/Following Imbalance',
      score: -penalty,
      severity: 'medium',
      fixTip: `You follow ${profile.followingCount} but have ${profile.followerCount} followers (ratio ${ratio}:1). Unfollow inactive accounts to improve credibility.`,
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
 * 生成总结标题
 */
function generateSummaryTitle(score: number, deductions: Deduction[]): string {
  if (score >= 90) {
    return 'Outstanding Profile - Optimized For Growth'
  } else if (score >= 75) {
    return 'Solid Foundation With Room For Improvement'
  } else if (score >= 60) {
    const mainIssue = deductions.find(d => d.severity === 'high')
    if (mainIssue) {
      return `Good Potential, But ${mainIssue.item} Holding You Back`
    }
    return 'Decent Setup, Missing Key Optimization'
  } else {
    return 'Critical Issues Detected - Immediate Action Needed'
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

  // 如果不足3个，补充正向建议
  while (issues.length < 3) {
    const positives = [
      'Keep posting consistently to maintain your current engagement rate',
      'Experiment with different content formats (Reels, Carousels) to find what resonates',
      'Engage with your audience by responding to comments within 1 hour of posting'
    ]
    issues.push(positives[issues.length] || 'Continue monitoring your analytics for optimization opportunities')
  }

  return issues
}
