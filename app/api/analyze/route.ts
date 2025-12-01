import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { scoreAccount, generateDay1Content, generate30DayCalendar } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scanId, industry = 'Food & Beverage' } = body

    if (!scanId) {
      return NextResponse.json({ error: 'Please provide scan ID' }, { status: 400 })
    }

    // Fetch scan data (using Supabase Client)
    const { data: scan, error: scanError } = await supabaseAdmin
      .from('Scan')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan record not found' }, { status: 404 })
    }

    if (scan.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Scan not yet completed' }, { status: 400 })
    }

    const scanData = scan.scanData as any

    if (!scanData?.profile) {
      return NextResponse.json({ error: 'Invalid scan data' }, { status: 400 })
    }

    // 1. Score using AI
    const scoreResult = await scoreAccount({
      username: scanData.profile.username,
      bio: scanData.profile.biography || '',
      followers: scanData.profile.followerCount || 0,
      following: scanData.profile.followingCount || 0,
      postCount: scanData.profile.postCount || 0,
      recentPosts: scanData.recentPosts || [],
      industry,
    })

    // 2. Generate Day 1 content
    const day1Content = await generateDay1Content({
      username: scanData.profile.username,
      bio: scanData.profile.biography || '',
      industry,
      mainIssue: scoreResult.urgent_action,
    })

    // 3. Generate 30-day content calendar
    const calendar = await generate30DayCalendar(industry)

    // 4. Create diagnosis report (using Supabase Client)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('Report')
      .insert({
        id: randomUUID(),
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
        calendarOutline: calendar,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (reportError || !report) {
      console.error('Failed to create report:', reportError)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    // 5. Update scan record score (using Supabase Client)
    await supabaseAdmin
      .from('Scan')
      .update({ score: scoreResult.total_score })
      .eq('id', scanId)

    return NextResponse.json({
      reportId: report.id,
      score: scoreResult.total_score,
      grade: scoreResult.grade,
      message: 'Analysis completed',
      debug: {
        aiUsed: scoreResult.total_score > 50 ? 'DeerAPI' : 'Intelligent fallback',
        scoreBreakdown: scoreResult,
        day1Preview: day1Content.caption.substring(0, 50) + '...',
      },
    })
  } catch (error) {
    console.error('Analysis failed:', error)
    return NextResponse.json(
      { error: 'Analysis failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Get report details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')
    const scanId = searchParams.get('scanId')

    let report
    let scan

    if (reportId) {
      // Query using Supabase Client
      const { data, error } = await supabaseAdmin
        .from('Report')
        .select('*, scan:Scan(*)')
        .eq('id', reportId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      report = data
      scan = data.scan
    } else if (scanId) {
      const { data, error } = await supabaseAdmin
        .from('Report')
        .select('*, scan:Scan(*)')
        .eq('scanId', scanId)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      report = data
      scan = data.scan
    } else {
      return NextResponse.json({ error: 'Please provide report ID or scan ID' }, { status: 400 })
    }

    return NextResponse.json({
      id: report.id,
      scanId: report.scanId,
      username: scan?.username || '',
      scoreBreakdown: report.scoreBreakdown,
      improvements: report.improvements,
      day1Content: report.day1Content,
      calendarOutline: report.calendarOutline,
      generatedAt: report.generatedAt,
      expiresAt: report.expiresAt,
    })
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
