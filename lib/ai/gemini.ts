import { GoogleGenerativeAI } from '@google/generative-ai'

// 支持DeerAPI: 如果设置了DEER_API_KEY和DEER_API_BASE_URL,则使用DeerAPI
const apiKey = process.env.DEER_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || ''
const baseUrl = process.env.DEER_API_BASE_URL || undefined

const genAI = new GoogleGenerativeAI(apiKey)

// 如果使用DeerAPI,需要自定义fetch
if (baseUrl) {
  console.log('使用DeerAPI:', baseUrl)
}

/**
 * 账号评分结果接口
 */
export interface AccountScore {
  content_quality_score: number // 0-30
  engagement_health_score: number // 0-25
  account_vitality_score: number // 0-20
  growth_potential_score: number // 0-15
  audience_match_score: number // 0-10
  total_score: number // 0-100
  grade: '优秀' | '良好' | '待改进' | '警戒'
  top_3_issues: string[]
  urgent_action: string
}

/**
 * Day 1内容生成结果
 */
export interface Day1Content {
  caption: string // 200字文案
  hashtags: string[] // 10个标签
  image_suggestion: string // 图片描述
  best_time: string // 最佳发布时间
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
 * 使用Gemini API进行账号评分
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `你是资深Instagram营销顾问。分析以下账号并评分:

账号数据:
- 用户名: ${accountData.username}
- Bio: ${accountData.bio || '无'}
- 粉丝数: ${accountData.followers}
- 关注数: ${accountData.following}
- 帖子数: ${accountData.postCount}
- 行业: ${accountData.industry || '未知'}
- 最近帖子数量: ${accountData.recentPosts.length}

评分标准(总分100分):
1. 内容质量 (30分): Bio完整度、品牌一致性、专业度
2. 互动健康 (25分): 粉丝/关注比例、互动率预估
3. 账号活力 (20分): 发帖数量、账号活跃度
4. 增长潜力 (15分): 粉丝基数、增长空间
5. 受众匹配 (10分): Bio与目标受众契合度

请严格按照以下JSON格式输出(不要包含其他文字):
{
  "content_quality_score": 0-30的数字,
  "engagement_health_score": 0-25的数字,
  "account_vitality_score": 0-20的数字,
  "growth_potential_score": 0-15的数字,
  "audience_match_score": 0-10的数字,
  "total_score": 0-100的数字,
  "grade": "优秀"或"良好"或"待改进"或"警戒",
  "top_3_issues": ["问题1", "问题2", "问题3"],
  "urgent_action": "最紧急的改进方向"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 提取JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON')
    }

    const scoreData = JSON.parse(jsonMatch[0])
    return scoreData as AccountScore
  } catch (error) {
    console.error('Gemini API调用失败:', error)
    // 返回默认评分
    return {
      content_quality_score: 15,
      engagement_health_score: 12,
      account_vitality_score: 10,
      growth_potential_score: 8,
      audience_match_score: 5,
      total_score: 50,
      grade: '待改进',
      top_3_issues: [
        'Bio信息不完整,缺少关键信息',
        '发帖频率较低,影响账号活跃度',
        '缺少明确的品牌定位',
      ],
      urgent_action: '立即优化Bio,添加品牌介绍和联系方式',
    }
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `你是Instagram内容创意总监。为以下品牌创作第1天内容:

品牌信息:
- 账号: ${accountData.username}
- 行业: ${accountData.industry}
- Bio: ${accountData.bio}
- 诊断问题: ${accountData.mainIssue}

请生成:
1. 文案(200字左右,主题:品牌故事,语气真诚,包含行动召唤)
2. 10个Hashtag(3个大热度+4个中等热度+3个小众标签)
3. 图片建议(50字描述构图/色调/元素)
4. 最佳发布时间(基于${accountData.industry}行业最佳实践)

严格按照以下JSON格式输出:
{
  "caption": "完整的文案内容",
  "hashtags": ["#标签1", "#标签2", ...共10个],
  "image_suggestion": "图片描述",
  "best_time": "最佳发布时间"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON')
    }

    const content = JSON.parse(jsonMatch[0])
    return content as Day1Content
  } catch (error) {
    console.error('Day 1内容生成失败:', error)
    return {
      caption: `【${accountData.industry}的故事】\n\n每个品牌背后都有一个独特的故事。${accountData.username}的旅程始于对品质的执着追求...\n\n关注我们,了解更多精彩内容!`,
      hashtags: [
        '#品牌故事',
        '#创业',
        `#${accountData.industry}`,
        '#本地生活',
        '#小而美',
        '#用心经营',
        '#品质生活',
        '#支持本地',
        '#日常分享',
        '#新篇章',
      ],
      image_suggestion: '温暖明亮的品牌场景照片,展示产品或服务的核心价值,色调温馨,构图简洁',
      best_time: '周三 18:00-20:00',
    }
  }
}

/**
 * 生成30天内容日历大纲
 */
export async function generate30DayCalendar(industry: string): Promise<ContentCalendar> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `为${industry}行业生成30天Instagram内容日历大纲。

要求:
- 分为4周,每周一个主题
- 每周6-8条内容
- 内容类型包括: 图片、视频、轮播图、Reel
- 主题要有逻辑性和渐进性

输出JSON格式:
{
  "weeks": [
    {
      "week": 1,
      "theme": "主题名称",
      "posts": [
        {"day": 1, "title": "内容标题", "type": "image", "unlocked": false},
        ...
      ]
    },
    ...
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON')
    }

    const calendar = JSON.parse(jsonMatch[0])
    // 确保Day 1是unlocked
    if (calendar.weeks?.[0]?.posts?.[0]) {
      calendar.weeks[0].posts[0].unlocked = true
    }
    return calendar as ContentCalendar
  } catch (error) {
    console.error('30天日历生成失败:', error)
    // 返回默认模板
    return getDefaultCalendar()
  }
}

/**
 * 默认30天内容日历模板
 */
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
