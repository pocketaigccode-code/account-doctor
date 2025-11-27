import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { scrapeInstagramProfile } from '@/lib/scrapers/instagram'
import { cleanInstagramUsername } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, userId } = body

    if (!username) {
      return NextResponse.json({ error: '请提供Instagram用户名' }, { status: 400 })
    }

    const cleanedUsername = cleanInstagramUsername(username)

    // 创建扫描记录 (使用Supabase Client)
    const { data: scan, error: scanError } = await supabaseAdmin
      .from('Scan')
      .insert({
        id: randomUUID(),
        username: cleanedUsername,
        platform: 'instagram',
        userId: userId || null,
        status: 'PENDING',
      })
      .select()
      .single()

    if (scanError || !scan) {
      console.error('创建扫描记录失败:', scanError)
      return NextResponse.json({ error: '创建扫描记录失败' }, { status: 500 })
    }

    // 异步执行爬取和分析 (实际生产环境应该使用队列)
    performScan(scan.id, cleanedUsername).catch(console.error)

    return NextResponse.json({
      scanId: scan.id,
      status: 'PENDING',
      message: '扫描已启动,请稍候...',
    })
  } catch (error) {
    console.error('扫描请求失败:', error)
    return NextResponse.json({ error: '扫描请求失败' }, { status: 500 })
  }
}

/**
 * 执行扫描任务
 */
async function performScan(scanId: string, username: string) {
  try {
    console.log(`开始扫描账号: ${username}`)

    // 1. 爬取Instagram数据
    const scanData = await scrapeInstagramProfile(username)

    // 2. 更新扫描记录 (使用Supabase Client)
    const { error: updateError } = await supabaseAdmin
      .from('Scan')
      .update({
        scanData: scanData as any,
        status: 'COMPLETED',
      })
      .eq('id', scanId)

    if (updateError) {
      console.error('更新扫描记录失败:', updateError)
    }

    console.log(`账号 ${username} 扫描完成`)
  } catch (error) {
    console.error(`扫描失败:`, error)

    // 更新为失败状态
    await supabaseAdmin
      .from('Scan')
      .update({ status: 'FAILED' })
      .eq('id', scanId)
  }
}

/**
 * 获取扫描状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('id')

    if (!scanId) {
      return NextResponse.json({ error: '请提供扫描ID' }, { status: 400 })
    }

    // 使用Supabase Client查询
    const { data: scan, error } = await supabaseAdmin
      .from('Scan')
      .select('*')
      .eq('id', scanId)
      .single()

    if (error || !scan) {
      return NextResponse.json({ error: '扫描记录不存在' }, { status: 404 })
    }

    return NextResponse.json({
      id: scan.id,
      username: scan.username,
      status: scan.status,
      scanData: scan.scanData,
      score: scan.score,
      createdAt: scan.createdAt,
    })
  } catch (error) {
    console.error('获取扫描状态失败:', error)
    return NextResponse.json({ error: '获取扫描状态失败' }, { status: 500 })
  }
}
