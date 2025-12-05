# 线上错误排查指南

## 🔍 问题诊断清单

### 1. 环境变量检查（线上环境）

确保以下环境变量在线上环境（Vercel/部署平台）正确配置：

```bash
# 必需的环境变量
APIFY_API_TOKEN=apify_api_xxxxx
DEER_API_KEY=sk-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
PEXELS_API_KEY=xxxxx
```

**Vercel环境变量设置路径:**
1. 登录Vercel Dashboard
2. 选择项目 → Settings → Environment Variables
3. 确认所有变量都已添加
4. **重要**: 修改环境变量后需要重新部署

### 2. 本地测试验证

运行以下命令测试Apify连接：

```bash
# 测试Apify API连接
node test-apify-connection.js
```

预期输出应该是：
```
✅ 环境变量配置
✅ 客户端初始化
✅ 真实账号抓取
🎉 所有测试通过! Apify连接正常
```

### 3. 常见错误及解决方案

#### 错误 A: "服务配置错误"
**原因**: APIFY_API_TOKEN未配置或为空
**解决**:
1. 检查.env文件中的APIFY_API_TOKEN
2. 前往 https://console.apify.com/account/integrations 获取Token
3. 线上环境需要在Vercel设置中添加

#### 错误 B: "该Instagram账号不存在或已设为私密"
**原因**: 用户输入的账号不存在、已删除或设为私密
**解决**:
- 这是正常的用户错误，提示用户检查账号名称
- 私密账号无法抓取数据

#### 错误 C: "服务认证失败"
**原因**: Apify API Token无效或已过期
**解决**:
1. 检查Token是否正确复制（包含`apify_api_`前缀）
2. 检查Token是否在Apify控制台被删除
3. 重新生成Token并更新环境变量

#### 错误 D: "当前访问量过大"
**原因**: Apify API调用达到速率限制
**解决**:
1. 等待一段时间后重试
2. 升级Apify套餐提高限额
3. 实现更好的缓存策略（已在代码中实现24小时缓存）

#### 错误 E: "请求超时"
**原因**: 网络延迟或Apify任务执行时间过长
**解决**:
1. 检查网络连接
2. 增大API超时时间（已设置为60秒）
3. 对于大账号（帖子数>1000），抓取可能需要更长时间

#### 错误 F: "Instagram数据获取失败"
**原因**: 未分类的通用错误
**解决**:
1. 查看服务器日志获取详细错误信息
2. 检查Apify服务状态: https://status.apify.com/
3. 尝试用不同的Instagram账号测试

### 4. 查看线上日志

#### Vercel日志查看:
1. Vercel Dashboard → 项目 → Deployments
2. 点击最新部署 → Functions → 查看实时日志
3. 搜索关键词: `[Apify]`, `[Audit Init]`, `ERROR`

#### 关键日志标识:
```
✅ 正常: [Apify] 成功获取数据
❌ 错误: [Apify] 爬取失败
⚠️ 警告: [Apify] API调用次数超限
```

### 5. 测试特定账号

创建测试脚本验证特定账号：

```javascript
// test-specific-account.js
const { ApifyClient } = require('apify-client')
require('dotenv').config()

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

async function test(username) {
  console.log(`测试账号: ${username}`)

  try {
    const run = await client.actor('apify/instagram-scraper').call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: 'details',
      resultsLimit: 10,
    })

    const { items } = await client.dataset(run.defaultDatasetId).listItems()

    if (items && items.length > 0) {
      console.log('✅ 成功:', items[0].username)
      console.log('   行业:', items[0].businessCategoryName || '未知')
    } else {
      console.log('❌ 账号不存在或私密')
    }
  } catch (error) {
    console.error('❌ 错误:', error.message)
  }
}

// 替换为线上出错的账号
test('YOUR_FAILING_ACCOUNT_HERE')
```

### 6. 数据库检查

检查Supabase数据库中的错误记录：

```sql
-- 查看最近的失败审计
SELECT
  id,
  username,
  status,
  error_code,
  error_message,
  created_at
FROM audits
WHERE status = 'ai_failed' OR error_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### 7. 紧急降级方案

如果Apify持续失败，可以临时使用备用爬虫：

```typescript
// 在 lib/cache/apify-cache.ts 中
try {
  const data = await scrapeInstagramWithApify(username)
  return data
} catch (apifyError) {
  console.warn('[Fallback] Apify失败，尝试使用Puppeteer...')
  return await scrapeInstagramProfile(username) // 备用方案
}
```

### 8. 性能优化建议

1. **启用缓存**: 确保24小时缓存正常工作（已实现）
2. **监控API配额**: 定期检查Apify使用量
3. **设置告警**: 配置错误率告警（推荐使用Sentry）
4. **优化重试逻辑**: 对临时错误自动重试

### 9. 联系支持

如果以上方法都无法解决：

1. **Apify支持**: support@apify.com
2. **查看Apify状态页**: https://status.apify.com/
3. **GitHub Issues**: 在项目中创建Issue并附上：
   - 错误截图
   - 服务器日志
   - 测试账号名称
   - 复现步骤

---

## ✅ 已实施的改进

### 代码改进（2025-12-05）:

1. ✅ **增强错误处理**:
   - 详细的错误分类（Token错误、账号不存在、超时等）
   - 用户友好的中文错误消息
   - 完整的错误日志输出

2. ✅ **改进日志系统**:
   - 每个步骤都有详细日志
   - 包含时间戳和运行ID
   - 便于追踪问题

3. ✅ **API错误映射**:
   - 401 → "服务认证失败"
   - 429 → "当前访问量过大"
   - 超时 → "请求超时"
   - 等等...

4. ✅ **环境变量验证**:
   - 启动时检查APIFY_API_TOKEN是否存在
   - 提供明确的配置错误提示

---

## 🚀 下一步行动

1. 运行本地测试: `node test-apify-connection.js`
2. 检查线上环境变量配置
3. 重新部署应用
4. 用测试账号验证修复效果
5. 监控错误日志是否还有问题

如有问题，请查看服务器日志并参考上述排查清单。
