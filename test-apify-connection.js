/**
 * Apify连接测试脚本
 * 用途: 验证Apify API配置是否正常，并测试错误处理
 */

const { ApifyClient } = require('apify-client')
require('dotenv').config()

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

console.log('=== Apify连接测试 ===\n')

// 测试1: 检查环境变量
console.log('1. 检查环境变量配置...')
if (!APIFY_API_TOKEN) {
  console.error('❌ APIFY_API_TOKEN 未设置')
  console.log('请在.env文件中配置: APIFY_API_TOKEN=your_token')
  process.exit(1)
}

console.log(`✅ APIFY_API_TOKEN 已配置 (${APIFY_API_TOKEN.substring(0, 15)}...)\n`)

// 测试2: 初始化客户端
console.log('2. 初始化Apify客户端...')
const client = new ApifyClient({ token: APIFY_API_TOKEN })
console.log('✅ 客户端初始化成功\n')

// 测试3: 测试真实账号抓取
async function testRealAccount() {
  console.log('3. 测试真实账号抓取...')
  const testUsername = 'bmkparisbamako'  // 使用文档中的测试账号

  try {
    console.log(`📤 发起请求: https://www.instagram.com/${testUsername}/`)
    console.log(`⏳ 等待Apify抓取... (可能需要10-30秒)`)

    const startTime = Date.now()

    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${testUsername}/`],
      resultsType: 'details',
      resultsLimit: 10,
      onlyPostsNewerThan: '30 days',
    }, {
      timeout: 120  // 2分钟超时
    })

    const elapsed = Date.now() - startTime
    console.log(`✅ Actor运行成功 (耗时: ${elapsed}ms)`)
    console.log(`   Run ID: ${run.id}`)
    console.log(`   Dataset ID: ${run.defaultDatasetId}`)

    // 获取数据
    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    if (!items || items.length === 0) {
      console.error('❌ 返回数据为空')
      return false
    }

    const profile = items[0]
    console.log(`✅ 数据获取成功!`)
    console.log(`   用户名: ${profile.username}`)
    console.log(`   全名: ${profile.fullName}`)
    console.log(`   粉丝数: ${profile.followersCount}`)
    console.log(`   帖子数: ${profile.postsCount}`)
    console.log(`   行业类别: ${profile.businessCategoryName || '未知'}`)
    console.log(`   最近帖子数: ${profile.latestPosts?.length || 0}`)

    return true

  } catch (error) {
    console.error('❌ 测试失败:', error.message)

    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.log('💡 建议: API Token可能无效，请检查:')
      console.log('   1. Token是否正确复制')
      console.log('   2. Token是否已过期')
      console.log('   3. 前往 https://console.apify.com/account/integrations 重新生成')
    } else if (error.message?.includes('429')) {
      console.log('💡 建议: API调用次数超限，请稍后再试或升级套餐')
    } else if (error.message?.includes('timeout')) {
      console.log('💡 建议: 请求超时，可能是网络问题或账号数据量太大')
    }

    return false
  }
}

// 测试4: 测试不存在的账号
async function testNonExistentAccount() {
  console.log('\n4. 测试不存在的账号 (错误处理验证)...')
  const fakeUsername = 'thisaccountdoesnotexist12345678'

  try {
    console.log(`📤 测试账号: ${fakeUsername}`)

    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${fakeUsername}/`],
      resultsType: 'details',
      resultsLimit: 10,
    }, {
      timeout: 60
    })

    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    if (!items || items.length === 0) {
      console.log('✅ 正确识别: 账号不存在')
      return true
    }

  } catch (error) {
    console.log('✅ 正确捕获错误:', error.message)
    return true
  }
}

// 执行测试
async function runTests() {
  try {
    const test3Pass = await testRealAccount()
    const test4Pass = await testNonExistentAccount()

    console.log('\n=== 测试总结 ===')
    console.log(`环境变量配置: ✅`)
    console.log(`客户端初始化: ✅`)
    console.log(`真实账号抓取: ${test3Pass ? '✅' : '❌'}`)
    console.log(`错误处理验证: ${test4Pass ? '✅' : '❌'}`)

    if (test3Pass && test4Pass) {
      console.log('\n🎉 所有测试通过! Apify连接正常')
      process.exit(0)
    } else {
      console.log('\n⚠️ 部分测试失败，请检查上述错误信息')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n💥 测试脚本异常:', error)
    process.exit(1)
  }
}

runTests()
