import { ApifyClient } from 'apify-client'
import type { InstagramProfile, InstagramPost, InstagramScanData } from './instagram'

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || '',
})

/**
 * 使用Apify爬取Instagram账号数据
 */
export async function scrapeInstagramWithApify(username: string): Promise<InstagramScanData> {
  console.log(`[Apify] 开始爬取账号: ${username}`)

  try {
    // 调用Apify的Instagram Profile Scraper
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
      resultsLimit: 12, // 获取最近12篇帖子
    })

    // 等待结果
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    if (!items || items.length === 0) {
      throw new Error('Apify未返回数据')
    }

    const profileData = items[0] as any

    console.log(`[Apify] 成功获取数据:`, {
      username: profileData.username,
      followers: profileData.followersCount,
      posts: profileData.postsCount,
    })

    // 转换为标准格式
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
    }

    // 转换帖子数据
    const recentPosts: InstagramPost[] = (profileData.latestPosts || []).map((post: any, index: number) => ({
      id: post.id || `post_${index}`,
      caption: post.caption || '',
      mediaUrls: [post.displayUrl].filter(Boolean),
      likeCount: post.likesCount || 0,
      commentCount: post.commentsCount || 0,
      publishedAt: post.timestamp ? new Date(post.timestamp) : new Date(),
      type: post.type === 'Video' ? 'video' : post.type === 'Sidecar' ? 'carousel' : 'image',
    }))

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
