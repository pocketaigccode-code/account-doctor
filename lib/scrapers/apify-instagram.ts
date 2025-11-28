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
    // 调用Apify的Instagram Scraper (完整版)
    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: 'details',        // 获取详细信息
      resultsLimit: 50,              // 获取最近50篇帖子
      onlyPostsNewerThan: '30 days', // 只获取最近30天
    })

    // 等待结果
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    if (!items || items.length === 0) {
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
    const recentPosts: InstagramPost[] = (profileData.latestPosts || []).map((post: any, index: number) => {
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
        publishedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
        type: post.type === 'Video' ? 'video' : post.type === 'Sidecar' ? 'carousel' : 'image',
        hashtags: hashtags,              // ⭐ 新增
        locationName: post.locationName,  // ⭐ 新增
      }
    })

    return {
      profile,
      recentPosts,
      scrapedAt: new Date(),
    }
  } catch (error) {
    console.error('[Apify] 爬取失败:', error)
    throw error
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
