/**
 * Instagram图片代理API
 * 用于绕过CORS限制,代理Instagram的图片请求
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // 安全检查:只允许Instagram CDN的图片
    const allowedDomains = [
      'scontent-sjc3-1.cdninstagram.com',
      'scontent-sjc6-1.cdninstagram.com',
      'scontent.cdninstagram.com',
      'cdninstagram.com',
      'fbcdn.net',              // Instagram新域名格式
      'fna.fbcdn.net',         // Facebook CDN
      'instagram.fbcdn.net'    // Instagram Facebook CDN
    ]

    const urlObj = new URL(imageUrl)
    const isAllowed = allowedDomains.some(domain =>
      urlObj.hostname.includes(domain)
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Invalid image source' },
        { status: 403 }
      )
    }

    // 获取图片 - 完整伪装成浏览器请求
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.instagram.com/',
        'Origin': 'https://www.instagram.com',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      signal: AbortSignal.timeout(15000), // 增加超时时间到15秒
    })

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      )
    }

    // 获取图片数据
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // 返回图片,添加CORS头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    console.error('[Image Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
