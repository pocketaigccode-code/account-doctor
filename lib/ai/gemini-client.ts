/**
 * Gemini AI Client - DeerAPI封装
 * 提供AI调用和JSON解析的公共函数
 */

// DeerAPI客户端 - 支持动态max_tokens
export async function callGemini(
  prompt: string,
  systemPrompt: string,
  maxTokens: number = 1000
): Promise<string> {
  const DEERAPI_BASE_URL = process.env.DEER_API_BASE_URL || 'https://api.deerapi.com'
  const DEERAPI_KEY = process.env.DEER_API_KEY || ''

  console.log('[AI Call] 📤 发送请求到DeerAPI, max_tokens:', maxTokens)

  // 添加超时控制 - 根据max_tokens动态调整
  const controller = new AbortController()
  const timeoutDuration = maxTokens > 2000 ? 90000 : 45000 // 大量tokens需要90秒
  const timeout = setTimeout(() => controller.abort(), timeoutDuration)

  try {
    const response = await fetch(`${DEERAPI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEERAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Call] ❌ DeerAPI错误:', response.status, errorText)
      throw new Error(`DeerAPI failed: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    console.log('[AI Call] 📥 收到响应,长度:', aiResponse.length)

    // 🚨 检查空响应
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('[AI Call] ❌ 收到空响应!完整data:', JSON.stringify(data))
      throw new Error('AI返回空响应,可能超时或配额耗尽')
    }

    return aiResponse
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[AI Call] ❌ 请求超时 (${timeoutDuration / 1000}秒)`)
      throw new Error(`AI request timeout after ${timeoutDuration / 1000} seconds`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// 解析JSON响应 - 严格清洗
export function parseJSON(aiResponse: string, moduleName: string = ''): any {
  console.log(`[parseJSON ${moduleName}] 原始响应长度:`, aiResponse.length)

  // 尝试直接解析
  try {
    const trimmed = aiResponse.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return JSON.parse(trimmed)
    }
  } catch (e: any) {
    console.log(`[parseJSON ${moduleName}] 直接解析失败:`, e.message)
    console.log(`[parseJSON ${moduleName}] 尝试清洗和修复...`)
  }

  // 清洗JSON: 移除注释和多余换行
  let cleaned = aiResponse
    .replace(/\/\/.*$/gm, '')  // 移除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')  // 移除多行注释
    .trim()

  // 提取JSON
  // 首先尝试找到JSON的开始和结束位置
  const startIndex = cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : cleaned.indexOf('{')
  if (startIndex === -1) {
    console.error(`[parseJSON ${moduleName}] 找不到JSON起始符号`)
    throw new Error(`AI返回格式错误,无法解析JSON (模块: ${moduleName})`)
  }

  // 从起始位置提取到最后
  const jsonStr = cleaned.substring(startIndex)

  console.log(`[parseJSON ${moduleName}] JSON字符串长度:`, jsonStr.length)
  console.log(`[parseJSON ${moduleName}] JSON前100字符:`, jsonStr.substring(0, 100))
  console.log(`[parseJSON ${moduleName}] JSON后100字符:`, jsonStr.substring(jsonStr.length - 100))

  try {
    return JSON.parse(jsonStr)
  } catch (e: any) {
    console.error(`[parseJSON ${moduleName}] JSON解析失败:`, e.message)
    console.error(`[parseJSON ${moduleName}] 错误位置:`, e.message.match(/position (\d+)/)?.[1])

    // 显示错误位置附近的内容
    const errorPos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0')
    if (errorPos > 0) {
      console.error(`[parseJSON ${moduleName}] 错误位置前后:`, jsonStr.substring(Math.max(0, errorPos - 50), errorPos + 50))
    }

    // 尝试修复常见JSON错误
    console.log(`[parseJSON ${moduleName}] 尝试自动修复JSON格式错误...`)

    try {
      let fixedJson = jsonStr
        // 1. 修复尾随逗号（最常见的错误）
        .replace(/,(\s*[}\]])/g, '$1')
        // 2. 修复对象/数组末尾的多余逗号
        .replace(/,\s*,/g, ',')
        // 3. 修复单引号为双引号
        .replace(/'/g, '"')
        // 4. 修复未转义的换行符和回车符
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .replace(/\t/g, '\\t')
        // 5. 移除属性值中的控制字符
        .replace(/[\x00-\x1F\x7F]/g, '')
        // 6. 修复缺失的逗号（在}或]后面应该有逗号，如果下一个字符是"或{或[）
        .replace(/([}\]])\s*(?=["{\[])/g, '$1,')
        // 7. 修复未闭合的字符串
        .replace(/"([^"]*?)$/g, '"$1"')
        // 8. 移除多余的空白
        .replace(/\s+/g, ' ')

      const fixed = JSON.parse(fixedJson)
      console.log(`[parseJSON ${moduleName}] ✅ 自动修复成功!`)
      return fixed
    } catch (fixError: any) {
      console.error(`[parseJSON ${moduleName}] ❌ 自动修复也失败:`, fixError.message)
      throw new Error(`JSON解析失败: ${e.message}`)
    }
  }
}
