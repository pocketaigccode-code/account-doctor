import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreAccount, generateDay1Content, generate30DayCalendar } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scanId, industry = '餐饮' } = body

    if (!scanId) {
      return NextResponse.json({ error: '请提供扫描ID' }, { status: 400 })
    }

    // 获取扫描数据
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })

    if (!scan) {
      return NextResponse.json({ error: '扫描记录不存在' }, { status: 404 })
    }

    if (scan.status !== 'COMPLETED') {
      return NextResponse.json({ error: '扫描尚未完成' }, { status: 400 })
    }

    const scanData = scan.scanData as any

    if (!scanData?.profile) {
      return NextResponse.json({ error: '扫描数据无效' }, { status: 400 })
    }

    // 1. 使用AI进行评分
    const scoreResult = await scoreAccount({
      username: scanData.profile.username,
      bio: scanData.profile.biography || '',
      followers: scanData.profile.followerCount || 0,
      following: scanData.profile.followingCount || 0,
      postCount: scanData.profile.postCount || 0,
      recentPosts: scanData.recentPosts || [],
      industry,
    })

    // 2. 生成Day 1内容
    const day1Content = await generateDay1Content({
      username: scanData.profile.username,
      bio: scanData.profile.biography || '',
      industry,
      mainIssue: scoreResult.urgent_action,
    })

    // 3. 生成30天内容日历
    const calendar = await generate30DayCalendar(industry)

    // 4. 创建诊断报告
    const report = await prisma.report.create({
      data: {
        scanId: scan.id,
        userId: scan.userId,
        scoreBreakdown: {
          content_quality: scoreResult.content_quality_score,
          engagement_health: scoreResult.engagement_health_score,
          account_vitality: scoreResult.account_vitality_score,
          growth_potential: scoreResult.growth_potential_score,
          audience_match: scoreResult.audience_match_score,
          total: scoreResult.total_score,
          grade: scoreResult.grade,
        },
        improvements: {
          issues: scoreResult.top_3_issues,
          urgent_action: scoreResult.urgent_action,
        },
        day1Content: {
          caption: day1Content.caption,
          hashtags: day1Content.hashtags,
          image_suggestion: day1Content.image_suggestion,
          best_time: day1Content.best_time,
        },
        calendarOutline: calendar as any,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      },
    })

    // 5. 更新扫描记录的评分
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        score: scoreResult.total_score,
      },
    })

    return NextResponse.json({
      reportId: report.id,
      score: scoreResult.total_score,
      grade: scoreResult.grade,
      message: '分析完成',
    })
  } catch (error) {
    console.error('分析失败:', error)
    return NextResponse.json(
      { error: '分析失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * 获取报告详情
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')
    const scanId = searchParams.get('scanId')

    let report

    if (reportId) {
      report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          scan: true,
        },
      })
    } else if (scanId) {
      report = await prisma.report.findUnique({
        where: { scanId: scanId },
        include: {
          scan: true,
        },
      })
    } else {
      return NextResponse.json({ error: '请提供报告ID或扫描ID' }, { status: 400 })
    }

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 })
    }

    return NextResponse.json({
      id: report.id,
      scanId: report.scanId,
      username: report.scan.username,
      scoreBreakdown: report.scoreBreakdown,
      improvements: report.improvements,
      day1Content: report.day1Content,
      calendarOutline: report.calendarOutline,
      generatedAt: report.generatedAt,
      expiresAt: report.expiresAt,
    })
  } catch (error) {
    console.error('获取报告失败:', error)
    return NextResponse.json({ error: '获取报告失败' }, { status: 500 })
  }
}
