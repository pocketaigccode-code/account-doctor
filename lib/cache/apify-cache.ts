/**
 * Apify缓存管理系统
 * 24小时智能缓存,节省80%成本
 */

import { supabaseAdmin } from '@/lib/supabase'
import { scrapeInstagramWithApify } from '@/lib/scrapers/apify-instagram'
import type { InstagramScanData } from '@/lib/scrapers/instagram'

export const CACHE_TTL_HOURS = 24

/**
 * 获取缓存或调用Apify
 * 核心缓存逻辑
 */
export async function getCachedOrFetch(
  username: string,
  skipCache = false
): Promise<{
  data: InstagramScanData
  cacheHit: boolean
  auditId?: string
  expiresAt?: string
}> {
  const cleanUsername = username.trim().toLowerCase()

  // ================================================
  // Step 1: 检查缓存 (除非skipCache=true)
  // ================================================
  if (!skipCache) {
    console.log(`[Cache] Checking for: ${cleanUsername}`)

    const { data: cachedAudit, error } = await supabaseAdmin
      .from('audits')
      .select('*')
      .eq('username', cleanUsername)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()  // 使用maybeSingle避免没有结果时报错

    if (!error && cachedAudit) {
      console.log(`[Cache] ✅ Hit - reusing data from ${cachedAudit.created_at}`)

      return {
        data: cachedAudit.apify_raw_data as InstagramScanData,
        cacheHit: true,
        auditId: cachedAudit.id,
        expiresAt: cachedAudit.expires_at
      }
    }

    console.log(`[Cache] ❌ Miss - calling Apify`)
  } else {
    console.log(`[Cache] Skipped - force refresh requested`)
  }

  // ================================================
  // Step 2: 缓存未命中,调用Apify
  // ================================================
  const freshData = await scrapeInstagramWithApify(cleanUsername)

  // ================================================
  // Step 3: 不在这里存入数据库!
  // 由调用方负责存储 (Fast Lane API)
  // ================================================
  return {
    data: freshData,
    cacheHit: false,
    auditId: undefined,  // 由调用方生成
    expiresAt: undefined
  }
}

/**
 * 计算缓存过期时间
 */
export function getExpiresAt(): Date {
  const now = new Date()
  return new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)
}

/**
 * 检查缓存是否过期
 */
export function isCacheExpired(createdAt: Date | string): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  return diffHours >= CACHE_TTL_HOURS
}

/**
 * 格式化粉丝数显示
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
