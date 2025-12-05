import { ApifyClient } from 'apify-client'
import type { InstagramProfile, InstagramPost, InstagramScanData } from './instagram'

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
})

/**
 * 使用Apify爬取Instagram账号数据 (完整版Scraper)
 */
export async function scrapeInstagramWithApify(username: string): Promise<InstagramScanData> {
  console.log(`[Apify] 开始爬取账号: ${username} (使用完整版Scraper)`)

  try {
    // 验证API Token
    if (!process.env.APIFY_API_TOKEN) {
      console.error('[Apify] ❌ APIFY_API_TOKEN 未配置')
      throw new Error('APIFY_TOKEN_MISSING')
    }

    console.log(`[Apify] 调用Instagram Scraper - URL: https://www.instagram.com/${username}/`)

    // 调用Apify的Instagram Scraper (完整版)
    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: 'details',        // 获取详细信息
      resultsLimit: 50,              // 获取最近50篇帖子
      onlyPostsNewerThan: '30 days', // 只获取最近30天
    })

    console.log(`[Apify] Actor运行成功 - Run ID: ${run.id}, Dataset ID: ${run.defaultDatasetId}`)

    // 等待结果
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    console.log(`[Apify] 数据集返回 ${items?.length || 0} 条记录`)

    if (!items || items.length === 0) {
      console.error(`[Apify] ❌ 账号 ${username} 未找到或返回空数据`)
      throw new Error('PROFILE_NOT_FOUND')
    }

    const profileData = items[0] as any

    console.log(`[Apify] 成功获取数据:`, {
      username: profileData.username,
      followers: profileData.followersCount,
      posts: profileData.postsCount,
      category: profileData.businessCategoryName || '未知',
      hasWebsite: !!profileData.externalUrl,
    })

    // 转换为标准格式 (新增字段)
    const profile: InstagramProfile = {
      username: profileData.username || username,
      fullName: profileData.fullName || username,
      biography: profileData.biography || '',
      profilePicUrl: profileData.profilePicUrl || '',
      followerCount: profileData.followersCount || 0,
      followingCount: profileData.followsCount || 0,
      postCount: profileData.postsCount || 0,
      isVerified: profileData.verified || false,
      isBusinessAccount: profileData.businessCategoryName ? true : false,
      externalUrl: profileData.externalUrl,
      businessCategoryName: profileData.businessCategoryName || null,  // ⭐ 新增
    }

    // 转换帖子数据 (提取更多字段)
    // ⭐ 修复：过滤置顶帖 + 按时间排序，避免Last Post Date错误
    const recentPosts: InstagramPost[] = (profileData.latestPosts || [])
      // 步骤1：过滤掉置顶帖子（避免置顶帖影响Last Post Date判定）
      .filter((post: any) => !post.isPinned)
      // 步骤2：按时间戳降序排序（确保最新帖子在前）
      .sort((a: any, b: any) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeB - timeA  // 降序：最新的在前
      })
      // 步骤3：转换为标准格式
      .map((post: any, index: number) => {
        // 提取标签
        const hashtags = extractHashtags(post.caption || '')

        // 调试: 打印原始帖子数据
        if (index === 0) {
          console.log('[Apify] 第一篇帖子原始数据:', JSON.stringify(post, null, 2).substring(0, 500))
        }

        return {
          id: post.id || `post_${index}`,
          caption: post.caption || '',
          mediaUrls: [post.displayUrl || post.url || post.imageUrl].filter(Boolean),
          likeCount: post.likesCount || 0,
          commentCount: post.commentsCount || 0,
          publishedAt: post.timestamp ? new Date(post.timestamp) : null,  // ⭐ 使用null而非new Date()
          type: post.type === 'Video' ? 'video' : post.type === 'Sidecar' ? 'carousel' : 'image',
          hashtags: hashtags,
          locationName: post.locationName,
        }
      })

    return {
      profile,
      recentPosts,
      scrapedAt: new Date(),
    }
  } catch (error: any) {
    console.error('[Apify] 爬取失败:', error)

    // 详细的错误分类和用户友好的消息
    if (error.message === 'PROFILE_NOT_FOUND') {
      console.error(`[Apify] 账号 ${username} 不存在或已设为私密`)
      throw error // 直接抛出，保持原始错误类型
    }

    if (error.message === 'APIFY_TOKEN_MISSING') {
      console.error('[Apify] API Token未配置，请检查环境变量')
      throw new Error('服务配置错误，请联系管理员')
    }

    // Apify API相关错误
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.error('[Apify] API Token无效或已过期')
      throw new Error('服务认证失败，请联系管理员')
    }

    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.error('[Apify] API调用次数超限')
      throw new Error('服务繁忙，请稍后再试')
    }

    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      console.error('[Apify] 请求超时')
      throw new Error('网络请求超时，请重试')
    }

    // 通用网络错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('[Apify] 网络连接失败')
      throw new Error('无法连接到服务器，请检查网络')
    }

    // 其他未知错误
    console.error('[Apify] 未知错误:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.substring(0, 200)
    })

    throw new Error('Instagram数据获取失败，请稍后重试')
  }
}

/**
 * 从文案中提取标签
 */
function extractHashtags(caption: string): string[] {
  if (!caption) return []

  // 匹配 # 开头的标签 (支持中英文)
  const matches = caption.match(/#[\w\u4e00-\u9fa5]+/g)

  if (!matches) return []

  // 去重并转小写
  return [...new Set(matches.map(tag => tag.toLowerCase()))]
}
