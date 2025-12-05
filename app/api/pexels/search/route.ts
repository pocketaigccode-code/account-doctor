import { NextRequest, NextResponse } from 'next/server'

/**
 * Pexels 图片搜索 API
 * 根据行业关键词搜索适合的竖屏图片
 */
export async function GET(request: NextRequest) {
  try {
    // 从环境变量读取 API Key
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY

    if (!PEXELS_API_KEY) {
      console.error('[Pexels API] ❌ PEXELS_API_KEY not configured in .env')
      return NextResponse.json(
        { error: 'Pexels API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const perPage = parseInt(searchParams.get('per_page') || '30')
    const orientation = searchParams.get('orientation') || 'portrait'

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    console.log(`[Pexels API] 搜索图片: query="${query}", per_page=${perPage}, orientation=${orientation}`)

    // 调用 Pexels API
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`

    const response = await fetch(pexelsUrl, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // 提取请求统计信息（Rate Limit Headers）
    const rateLimit = {
      limit: parseInt(response.headers.get('X-Ratelimit-Limit') || '0'),
      remaining: parseInt(response.headers.get('X-Ratelimit-Remaining') || '0'),
      reset: parseInt(response.headers.get('X-Ratelimit-Reset') || '0')
    }

    console.log(`[Pexels API] ✅ 成功获取 ${data.photos?.length || 0} 张图片`)
    console.log(`[Pexels API] 📊 请求统计: ${rateLimit.remaining}/${rateLimit.limit} 剩余`)

    // 提取需要的图片信息
    const photos = data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.src.large,        // 大图URL
      medium_url: photo.src.medium, // 中图URL
      small_url: photo.src.small,   // 小图URL
      photographer: photo.photographer,
      alt: photo.alt || query
    }))

    return NextResponse.json({
      success: true,
      total: data.total_results,
      photos: photos,
      query: query,
      // 请求统计数据
      rate_limit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset_timestamp: rateLimit.reset,
        reset_date: rateLimit.reset ? new Date(rateLimit.reset * 1000).toISOString() : null
      },
      // 分页信息
      pagination: {
        page: data.page || 1,
        per_page: data.per_page || perPage,
        next_page: data.next_page || null,
        prev_page: data.prev_page || null
      }
    })

  } catch (error) {
    console.error('[Pexels API] ❌ 错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch images from Pexels'
      },
      { status: 500 }
    )
  }
}
