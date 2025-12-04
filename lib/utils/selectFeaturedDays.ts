/**
 * Select Featured Days - 确定性选择展示图片的特色日期
 * 使用auditId作为种子，确保用户刷新后特色日期保持一致
 */

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

/**
 * Select 3-5 featured days that will show images
 * Day 1 is always featured
 * Others are distributed across 3 time periods
 */
export function selectFeaturedDays(
  auditId: string,
  totalDays: number = 30
): number[] {
  const featured: number[] = [1] // Day 1 always featured

  // Use auditId as seed
  const seed = hashString(auditId)

  // Select 3 more days from different time periods
  const periods = [
    { range: [5, 10], label: '第一周后期' },   // Early week
    { range: [12, 20], label: '第二周' },     // Mid period
    { range: [22, 28], label: '第三周' }      // Late period
  ]

  periods.forEach((period, periodIndex) => {
    const [min, max] = period.range
    const randomSeed = seed + periodIndex * 100
    const randomValue = seededRandom(randomSeed)
    const selectedDay = min + Math.floor(randomValue * (max - min + 1))

    if (selectedDay <= totalDays) {
      featured.push(selectedDay)
    }
  })

  return featured.sort((a, b) => a - b)
}

/**
 * Check if a day is featured
 */
export function isFeaturedDay(day: number, featuredDays: number[]): boolean {
  return featuredDays.includes(day)
}
