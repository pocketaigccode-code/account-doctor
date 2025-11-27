import OpenAI from 'openai'

// 使用DeerAPI (OpenAI兼容格式)
const client = new OpenAI({
  apiKey: process.env.DEER_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '',
  baseURL: process.env.DEER_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

/**
 * 账号评分结果接口
 */
export interface AccountScore {
  content_quality_score: number
  engagement_health_score: number
  account_vitality_score: number
  growth_potential_score: number
  audience_match_score: number
  total_score: number
  grade: '优秀' | '良好' | '待改进' | '警戒'
  top_3_issues: string[]
  urgent_action: string
}

/**
 * Day 1内容生成结果
 */
export interface Day1Content {
  caption: string
  hashtags: string[]
  image_suggestion: string
  best_time: string
}

/**
 * 30天内容日历
 */
export interface ContentCalendar {
  weeks: {
    week: number
    theme: string
    posts: {
      day: number
      title: string
      type: 'image' | 'video' | 'carousel' | 'reel'
      unlocked: boolean
    }[]
  }[]
}

/**
 * 使用AI进行账号评分
 */
export async function scoreAccount(accountData: {
  username: string
  bio: string
  followers: number
  following: number
  postCount: number
  recentPosts: any[]
  industry?: string
}): Promise<AccountScore> {
  const prompt = `你是资深Instagram营销顾问。分析以下账号并评分:

账号数据:
- 用户名: ${accountData.username}
- Bio: ${accountData.bio || '无'}
- 粉丝数: ${accountData.followers}
- 关注数: ${accountData.following}
- 帖子数: ${accountData.postCount}
- 行业: ${accountData.industry || '未知'}

评分标准(总分100分):
1. 内容质量 (30分): Bio完整度、品牌一致性、专业度
2. 互动健康 (25分): 粉丝/关注比例、互动率预估
3. 账号活力 (20分): 发帖数量、账号活跃度
4. 增长潜力 (15分): 粉丝基数、增长空间
5. 受众匹配 (10分): Bio与目标受众契合度

请严格按照以下JSON格式输出(不要包含任何markdown标记或其他文字,只输出纯JSON):
{
  "content_quality_score": 数字(0-30),
  "engagement_health_score": 数字(0-25),
  "account_vitality_score": 数字(0-20),
  "growth_potential_score": 数字(0-15),
  "audience_match_score": 数字(0-10),
  "total_score": 数字(0-100),
  "grade": "优秀"或"良好"或"待改进"或"警戒",
  "top_3_issues": ["具体问题1", "具体问题2", "具体问题3"],
  "urgent_action": "最紧急的具体行动"
}`

  try {
    const response = await client.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        { role: 'system', content: '你是专业的Instagram营销顾问,擅长数据分析和账号诊断。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const text = response.choices[0]?.message?.content || ''
    console.log('AI评分响应:', text)

    // 提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('无法解析JSON,使用默认数据')
      return getDefaultScore(accountData)
    }

    const scoreData = JSON.parse(jsonMatch[0])
    return scoreData as AccountScore
  } catch (error) {
    console.error('AI评分失败:', error)
    return getDefaultScore(accountData)
  }
}

/**
 * 生成Day 1内容
 */
export async function generateDay1Content(accountData: {
  username: string
  bio: string
  industry: string
  mainIssue: string
}): Promise<Day1Content> {
  const prompt = `你是Instagram内容创意总监。为以下品牌创作第1天内容:

品牌信息:
- 账号: ${accountData.username}
- 行业: ${accountData.industry}
- Bio: ${accountData.bio}
- 需要改进: ${accountData.mainIssue}

请生成第一天的Instagram内容(只输出纯JSON,不要markdown):
{
  "caption": "200字品牌故事文案,真诚有温度,包含行动召唤",
  "hashtags": ["#标签1", "#标签2", ...共10个,包含大中小热度],
  "image_suggestion": "50字图片构图和色调建议",
  "best_time": "基于行业的最佳发布时间"
}`

  try {
    const response = await client.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        { role: 'system', content: '你是专业的Instagram内容创作专家。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    })

    const text = response.choices[0]?.message?.content || ''
    console.log('Day 1内容响应:', text)

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getDefaultDay1Content(accountData)
    }

    const content = JSON.parse(jsonMatch[0])
    return content as Day1Content
  } catch (error) {
    console.error('Day 1内容生成失败:', error)
    return getDefaultDay1Content(accountData)
  }
}

/**
 * 生成30天内容日历
 */
export async function generate30DayCalendar(industry: string): Promise<ContentCalendar> {
  const prompt = `为${industry}行业生成30天Instagram内容日历大纲。

要求:
- 分为4周,每周一个主题
- 每周6-8条内容
- 内容类型: 图片、视频、轮播图、Reel
- 主题要有逻辑性

只输出纯JSON(不要markdown):
{
  "weeks": [
    {
      "week": 1,
      "theme": "主题名称",
      "posts": [
        {"day": 1, "title": "内容标题", "type": "image", "unlocked": false}
      ]
    }
  ]
}`

  try {
    const response = await client.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const text = response.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getDefaultCalendar()
    }

    const calendar = JSON.parse(jsonMatch[0])
    if (calendar.weeks?.[0]?.posts?.[0]) {
      calendar.weeks[0].posts[0].unlocked = true
    }
    return calendar as ContentCalendar
  } catch (error) {
    console.error('30天日历生成失败:', error)
    return getDefaultCalendar()
  }
}

/**
 * 默认评分(基于实际数据计算)
 */
function getDefaultScore(accountData: any): AccountScore {
  // 基于实际数据计算分数
  const followerRatio = accountData.followers / Math.max(accountData.following, 1)
  const contentScore = Math.min(30, (accountData.bio?.length || 0) / 5 + (accountData.postCount > 0 ? 15 : 0))
  const engagementScore = Math.min(25, followerRatio > 2 ? 20 : followerRatio * 10)
  const vitalityScore = Math.min(20, Math.floor(accountData.postCount / 10))
  const growthScore = Math.min(15, Math.floor(accountData.followers / 1000))
  const audienceScore = 5

  const total = Math.floor(contentScore + engagementScore + vitalityScore + growthScore + audienceScore)

  return {
    content_quality_score: Math.floor(contentScore),
    engagement_health_score: Math.floor(engagementScore),
    account_vitality_score: Math.floor(vitalityScore),
    growth_potential_score: Math.floor(growthScore),
    audience_match_score: audienceScore,
    total_score: total,
    grade: total >= 80 ? '优秀' : total >= 60 ? '良好' : total >= 40 ? '待改进' : '警戒',
    top_3_issues: [
      accountData.bio?.length < 50 ? 'Bio信息过于简短,建议添加更多品牌介绍' : 'Bio可以更突出核心卖点',
      accountData.postCount < 100 ? '发帖数量较少,建议保持规律更新' : '内容数量充足,重点优化质量',
      followerRatio < 1 ? '关注数高于粉丝数,建议提升账号吸引力' : '粉丝互动可以进一步优化',
    ],
    urgent_action: accountData.bio?.length < 20 ? '立即优化Bio,添加完整的品牌介绍和联系方式' : '优化内容策略,提升用户互动',
  }
}

function getDefaultDay1Content(accountData: any): Day1Content {
  return {
    caption: `【${accountData.industry || '品牌'}故事】\n\n每个成功的品牌背后都有一个独特的故事。@${accountData.username} 的旅程始于对品质的执着追求...\n\n我们相信,真诚的内容能够打动人心。关注我们,一起见证更多精彩时刻!\n\n👉 今天就开始你的品牌之旅!`,
    hashtags: ['#品牌故事', '#创业', `#${accountData.industry || '生活'}`, '#本地生活', '#小而美', '#用心经营', '#品质生活', '#支持本地', '#日常分享', '#新篇章'],
    image_suggestion: '温暖明亮的品牌场景照片,展示产品或服务的核心价值,色调温馨,构图简洁,突出品牌特色',
    best_time: '周三 18:00-20:00',
  }
}

function getDefaultCalendar(): ContentCalendar {
  return {
    weeks: [
      {
        week: 1,
        theme: '品牌故事周',
        posts: [
          { day: 1, title: '创始故事', type: 'image', unlocked: true },
          { day: 2, title: '产品理念', type: 'carousel', unlocked: false },
          { day: 3, title: '团队介绍', type: 'reel', unlocked: false },
          { day: 4, title: '品牌使命', type: 'image', unlocked: false },
          { day: 5, title: '幕后花絮', type: 'video', unlocked: false },
          { day: 6, title: '核心价值', type: 'image', unlocked: false },
          { day: 7, title: '周回顾', type: 'carousel', unlocked: false },
        ],
      },
      {
        week: 2,
        theme: '产品展示周',
        posts: [
          { day: 8, title: '明星产品', type: 'image', unlocked: false },
          { day: 9, title: '产品细节', type: 'carousel', unlocked: false },
          { day: 10, title: '使用教程', type: 'reel', unlocked: false },
          { day: 11, title: '产品对比', type: 'carousel', unlocked: false },
          { day: 12, title: '新品预告', type: 'video', unlocked: false },
          { day: 13, title: '限时优惠', type: 'image', unlocked: false },
          { day: 14, title: '周回顾', type: 'carousel', unlocked: false },
        ],
      },
      {
        week: 3,
        theme: '用户见证周',
        posts: [
          { day: 15, title: '客户评价', type: 'image', unlocked: false },
          { day: 16, title: '使用案例', type: 'reel', unlocked: false },
          { day: 17, title: '转型故事', type: 'carousel', unlocked: false },
          { day: 18, title: 'UGC内容', type: 'image', unlocked: false },
          { day: 19, title: '社区互动', type: 'reel', unlocked: false },
          { day: 20, title: '粉丝问答', type: 'carousel', unlocked: false },
          { day: 21, title: '周回顾', type: 'image', unlocked: false },
        ],
      },
      {
        week: 4,
        theme: '增长活动周',
        posts: [
          { day: 22, title: '活动预热', type: 'reel', unlocked: false },
          { day: 23, title: '特别福利', type: 'carousel', unlocked: false },
          { day: 24, title: '限时抢购', type: 'image', unlocked: false },
          { day: 25, title: '互动游戏', type: 'reel', unlocked: false },
          { day: 26, title: '感恩回馈', type: 'image', unlocked: false },
          { day: 27, title: '活动总结', type: 'carousel', unlocked: false },
          { day: 28, title: '下月预告', type: 'reel', unlocked: false },
        ],
      },
    ],
  }
}
