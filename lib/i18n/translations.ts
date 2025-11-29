/**
 * 简化国际化翻译
 * 支持中文和英文
 */

export const translations = {
  zh: {
    // 导航
    home: '返回首页',

    // 诊断结果
    diagnosisResult: '诊断结果',
    excellent: '优秀',
    good: '良好',
    needsImprovement: '待改进',
    warning: '警戒',

    // 品牌人设
    brandPersona: '品牌人设',
    optimizedBio: '优化后的简介:',

    // 内容配比
    contentMixStrategy: '内容配比策略',

    // 目标受众
    targetAudience: '目标受众',
    painPoint: '痛点:',

    // Day1
    contentPreview: '内容预览与分析',
    generatedCaption: '生成文案',
    recommendedHashtags: '推荐标签',
    aiAnalysis: 'AI 分析',
    imagePrompt: '生图提示词',

    // 日历
    smartCalendar: '智能内容日历',
    day: '第',
    dayUnit: '天',
    readyToPost: '准备发布',
    planned: '已规划',
    unlockFullPlan: '解锁完整 30 天计划',
    unlockDesc: '获取完整的内容日历,包括每日发布建议、最佳时间和专业文案',
    freeSignup: '免费注册解锁',

    // 用户资料
    posts: '帖子',
    followers: '粉丝',
    following: '关注',
    avgLikes: '平均点赞',
    active: '活跃',
    dormant: '休眠',
    inactive: '不活跃',
    lastPost: '最后发布:',
    conversionChecklist: '转化优化建议',
    missing: '缺少',
    recentContent: '最近内容 (视觉足迹)',

    // 加载状态
    analyzing: '正在分析...',
    generatingPersona: '正在生成品牌人设...',
    planningContentMix: '正在规划内容配比...',
    analyzingAudience: '正在分析目标受众...',
    creatingDay1: '正在创作Day 1爆款内容...',
    buildingCalendar: '正在生成30天内容日历...',
    aiCrafting: 'AI is crafting your strategy...',
  },
  en: {
    // Navigation
    home: 'Home',

    // Diagnosis
    diagnosisResult: 'Diagnosis Result',
    excellent: 'Excellent',
    good: 'Good',
    needsImprovement: 'Needs Improvement',
    warning: 'Warning',

    // Brand Persona
    brandPersona: 'Brand Persona',
    optimizedBio: 'Optimized Bio:',

    // Content Mix
    contentMixStrategy: 'Content Mix Strategy',

    // Target Audience
    targetAudience: 'Target Audience',
    painPoint: 'Pain Point:',

    // Day1
    contentPreview: 'Content Preview & Analysis',
    generatedCaption: 'Generated Caption',
    recommendedHashtags: 'Recommended Hashtags',
    aiAnalysis: 'AI Analysis',
    imagePrompt: 'Image Prompt',

    // Calendar
    smartCalendar: 'Smart Content Calendar',
    day: 'Day ',
    dayUnit: '',
    readyToPost: 'Ready to Post',
    planned: 'Planned',
    unlockFullPlan: 'Unlock Full 30-Day Plan',
    unlockDesc: 'Get the complete content calendar with daily posting recommendations, optimal timing, and professional copy',
    freeSignup: 'Free Sign Up',

    // Profile
    posts: 'Posts',
    followers: 'Followers',
    following: 'Following',
    avgLikes: 'Avg. Likes',
    active: 'Active',
    dormant: 'Dormant',
    inactive: 'Inactive',
    lastPost: 'Last post:',
    conversionChecklist: 'Conversion Checklist',
    missing: 'Missing',
    recentContent: 'Recent Content (Visual Footprint)',

    // Loading
    analyzing: 'Analyzing...',
    generatingPersona: 'Generating brand persona...',
    planningContentMix: 'Planning content mix...',
    analyzingAudience: 'Analyzing target audience...',
    creatingDay1: 'Creating Day 1 viral content...',
    buildingCalendar: 'Building 30-day calendar...',
    aiCrafting: 'AI is crafting your strategy...',
  }
}

export function t(key: string, lang: 'zh' | 'en' = 'zh'): string {
  const keys = key.split('.')
  let value: any = translations[lang]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}
