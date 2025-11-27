import puppeteer, { Browser, Page } from 'puppeteer'
import { getRandomUserAgent, delay } from '../utils'

export interface InstagramProfile {
  username: string
  fullName: string
  biography: string
  profilePicUrl: string
  followerCount: number
  followingCount: number
  postCount: number
  isVerified: boolean
  isBusinessAccount: boolean
  externalUrl?: string
}

export interface InstagramPost {
  id: string
  caption: string
  mediaUrls: string[]
  likeCount: number
  commentCount: number
  publishedAt: Date
  type: 'image' | 'video' | 'carousel'
}

export interface InstagramScanData {
  profile: InstagramProfile
  recentPosts: InstagramPost[]
  scrapedAt: Date
}

/**
 * Instagram爬虫类
 */
export class InstagramScraper {
  private browser: Browser | null = null
  private page: Page | null = null

  /**
   * 初始化浏览器
   */
  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    })

    this.page = await this.browser.newPage()
    await this.page.setUserAgent(getRandomUserAgent())
    await this.page.setViewport({ width: 1920, height: 1080 })
  }

  /**
   * 爬取Instagram账号数据
   */
  async scrapeProfile(username: string): Promise<InstagramScanData> {
    if (!this.page) {
      await this.init()
    }

    const url = `https://www.instagram.com/${username}/`
    console.log(`正在爬取: ${url}`)

    try {
      // 访问页面
      await this.page!.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // 等待页面加载
      await delay(2000)

      // 尝试从页面中提取JSON数据
      const pageData = await this.page!.evaluate(() => {
        // Instagram在页面中嵌入了JSON数据
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))

        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent || '{}')
            if (data['@type'] === 'ProfilePage') {
              return data
            }
          } catch (e) {
            continue
          }
        }

        // 备选方案: 从meta标签提取
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || ''

        return {
          metaDescription,
          ogImage,
        }
      })

      // 解析数据
      const profile = await this.parseProfile(username, pageData)
      const recentPosts = await this.scrapePosts()

      return {
        profile,
        recentPosts,
        scrapedAt: new Date(),
      }
    } catch (error) {
      console.error('爬取失败:', error)
      throw new Error(`Failed to scrape Instagram profile: ${username}`)
    }
  }

  /**
   * 解析个人资料数据
   */
  private async parseProfile(username: string, data: any): Promise<InstagramProfile> {
    // 从LD+JSON数据中提取
    if (data.mainEntity) {
      const entity = data.mainEntity
      return {
        username,
        fullName: entity.name || username,
        biography: entity.description || '',
        profilePicUrl: entity.image || data.ogImage || '',
        followerCount: this.parseNumber(entity.interactionStatistic?.find((s: any) => s.interactionType === 'http://schema.org/FollowAction')?.userInteractionCount) || 0,
        followingCount: 0, // LD+JSON中通常不包含
        postCount: 0,
        isVerified: false,
        isBusinessAccount: false,
      }
    }

    // 备选方案: 从meta描述解析
    const metaDescription = data.metaDescription || ''
    const followerMatch = metaDescription.match(/(\d+(?:,\d+)*)\s*Followers/)
    const followingMatch = metaDescription.match(/(\d+(?:,\d+)*)\s*Following/)
    const postMatch = metaDescription.match(/(\d+(?:,\d+)*)\s*Posts/)

    return {
      username,
      fullName: username,
      biography: metaDescription.split(' - ')[0] || '',
      profilePicUrl: data.ogImage || '',
      followerCount: this.parseNumber(followerMatch?.[1]) || 0,
      followingCount: this.parseNumber(followingMatch?.[1]) || 0,
      postCount: this.parseNumber(postMatch?.[1]) || 0,
      isVerified: false,
      isBusinessAccount: false,
    }
  }

  /**
   * 爬取最近的帖子
   */
  private async scrapePosts(): Promise<InstagramPost[]> {
    if (!this.page) return []

    try {
      // 滚动页面以加载更多帖子
      await this.page.evaluate(() => {
        window.scrollBy(0, window.innerHeight)
      })
      await delay(1000)

      // 提取帖子数据
      const posts = await this.page.evaluate(() => {
        const postElements = document.querySelectorAll('article a[href*="/p/"]')
        const postsData: any[] = []

        postElements.forEach((elem, index) => {
          if (index >= 12) return // 只取前12篇

          const link = elem.getAttribute('href') || ''
          const postId = link.split('/p/')[1]?.split('/')[0] || ''

          // 尝试从图片元素提取
          const img = elem.querySelector('img')
          const mediaUrl = img?.getAttribute('src') || ''

          postsData.push({
            id: postId,
            mediaUrl,
            link,
          })
        })

        return postsData
      })

      // 转换为InstagramPost格式
      return posts.map((post, index) => ({
        id: post.id || `post_${index}`,
        caption: '',
        mediaUrls: post.mediaUrl ? [post.mediaUrl] : [],
        likeCount: 0,
        commentCount: 0,
        publishedAt: new Date(),
        type: 'image' as const,
      }))
    } catch (error) {
      console.error('爬取帖子失败:', error)
      return []
    }
  }

  /**
   * 解析数字(处理逗号分隔的数字)
   */
  private parseNumber(str: string | undefined): number {
    if (!str) return 0
    return parseInt(str.replace(/,/g, ''), 10) || 0
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }
}

/**
 * 便捷函数: 爬取Instagram账号
 */
export async function scrapeInstagramProfile(username: string): Promise<InstagramScanData> {
  const scraper = new InstagramScraper()
  try {
    const data = await scraper.scrapeProfile(username)
    return data
  } finally {
    await scraper.close()
  }
}
