# 快速开始指南 - AccountDoctor 优化实施

> 本文档提供分步实施指南,帮助开发团队快速完成优化

---

## 🎯 优化目标回顾

### 当前问题

- ❌ 使用 `instagram-profile-scraper` (功能受限)
- ❌ 单速响应架构 (用户等待时间长)
- ❌ 无缓存机制 (重复调用Apify浪费成本)
- ❌ 页面一次性渲染 (白屏时间长)

### 优化后效果

- ✅ 使用 `instagram-scraper` (功能完整)
- ✅ 双速响应架构 (Fast Lane < 500ms)
- ✅ 24小时智能缓存 (节省80%成本)
- ✅ 分步渲染 (用户感知速度提升5倍)

---

## 📋 实施检查清单

### Phase 1: 基础架构升级 (第1周)

#### Day 1-2: Apify完整版接入

- [ ] **1.1** 修改 `lib/scrapers/apify-instagram.ts`:
  
  ```diff
  - const run = await client.actor('apify/instagram-profile-scraper').call({
  + const run = await client.actor('apify/instagram-scraper').call({
  -   usernames: [username],
  +   directUrls: [`https://www.instagram.com/${username}/`],
  +   resultsType: 'details',
      resultsLimit: 12,
  +   onlyPostsNewerThan: '30 days'
    })
  ```

- [ ] **1.2** 更新数据转换逻辑,提取新字段:
  
  - `businessCategoryName` (行业类型)
  - `externalUrl` (网站链接)
  - `latestPosts[].hashtags` (标签数组)
  - `latestPosts[].locationName` (地理位置)

- [ ] **1.3** 测试验证:
  
  ```bash
  # 运行测试脚本
  npm run test:apify
  ```

#### Day 3-4: 数据库Schema迁移

- [ ] **2.1** 创建新的 `audits` 表:
  
  ```bash
  cd account-doctor
  npx supabase migration new add_audits_table
  ```

- [ ] **2.2** 复制 Schema SQL (见主文档 Section 5.1)

- [ ] **2.3** 运行迁移:
  
  ```bash
  npx supabase db push
  ```

- [ ] **2.4** 验证表结构:
  
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'audits';
  ```

#### Day 5-7: 缓存系统实现

- [ ] **3.1** 创建 `lib/cache/apify-cache.ts` (见主文档 Section 7.2)

- [ ] **3.2** 实现缓存查询逻辑:
  
  ```typescript
  // 检查是否存在未过期的缓存
  const cached = await supabaseAdmin
    .from('audits')
    .select('*')
    .eq('username', username)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  ```

- [ ] **3.3** 添加缓存监控:
  
  ```typescript
  // 记录缓存命中率
  const metrics = {
    total_requests: 100,
    cache_hits: 75,
    hit_rate: 0.75
  }
  ```

- [ ] **3.4** 测试场景:
  
  - [ ] 首次查询 → Cache Miss → 调用Apify
  - [ ] 2小时后再次查询 → Cache Hit → 不调用Apify
  - [ ] 25小时后查询 → Cache Expired → 重新调用

---

### Phase 2: Fast Lane API (第2周前半)

#### Day 8-9: AI Prompt Set 1

- [ ] **4.1** 创建 `lib/ai/prompts/profile-analyst.ts`

- [ ] **4.2** 实现 `parseFastLaneData()` 函数

- [ ] **4.3** 实现降级逻辑 `getFastLaneFallback()`

- [ ] **4.4** 单元测试:
  
  ```typescript
  // 测试用例
  test('应该正确识别Inactive状态', async () => {
    const mockData = {
      latestPosts: [{ timestamp: '2024-12-01T00:00:00Z' }]
    }
    const result = await parseFastLaneData(mockData)
    expect(result.profile_snapshot.activity_status).toBe('Inactive')
  })
  ```

#### Day 10-11: Fast Lane API Route

- [ ] **5.1** 创建 `app/api/audit/init/route.ts`

- [ ] **5.2** 实现完整的错误处理 (见后端文档)

- [ ] **5.3** 添加请求日志:
  
  ```typescript
  console.log(`[Audit Init] ${username} - Cache:${cacheHit} - ${totalTime}ms`)
  ```

- [ ] **5.4** Postman测试:
  
  ```bash
  POST http://localhost:8173/api/audit/init
  Content-Type: application/json
  
  {
    "username": "nike",
    "skip_cache": false
  }
  ```

---

### Phase 3: Slow Lane API (第2周后半)

#### Day 12-13: AI Prompt Set 2

- [ ] **6.1** 创建 `lib/ai/prompts/strategic-director.ts`

- [ ] **6.2** 实现 `generateStrategyPrompt()` 函数

- [ ] **6.3** 测试AI响应格式:
  
  ```typescript
  // 验证JSON结构
  const response = await callGemini(prompt, STRATEGIC_DIRECTOR_SYSTEM_PROMPT)
  const json = JSON.parse(response.match(/\{[\s\S]*\}/)[0])
  expect(json.strategy_section.brand_persona).toBeDefined()
  ```

#### Day 14: SSE实现

- [ ] **7.1** 创建 `app/api/audit/[auditId]/strategy/route.ts`

- [ ] **7.2** 实现SSE流式响应

- [ ] **7.3** 前端测试:
  
  ```javascript
  const sse = new EventSource('/api/audit/xxx/strategy')
  sse.addEventListener('status', (e) => {
    console.log('Progress:', JSON.parse(e.data).progress)
  })
  ```

---

### Phase 4: 前端组件 (第3周)

#### Day 15-16: ProfileSnapshot组件

- [ ] **8.1** 创建 `components/result/ProfileSnapshot.tsx`

- [ ] **8.2** 实现三栏布局 (见前端文档)

- [ ] **8.3** 添加响应式样式:
  
  ```css
  @media (max-width: 768px) {
    /* 移动端垂直堆叠 */
  }
  ```

#### Day 17-18: DiagnosisCard + StrategySection

- [ ] **9.1** 实现DiagnosisCard组件

- [ ] **9.2** 实现StrategySection组件 (含SSE订阅)

- [ ] **9.3** 实现AIThinkingAnimation加载动画

#### Day 19-20: ExecutionCalendar

- [ ] **10.1** 实现日历网格布局

- [ ] **10.2** 实现Day 1完整展示 + Day 2-30锁定

- [ ] **10.3** 添加Hover交互效果

#### Day 21: 集成与测试

- [ ] **11.1** 整合所有组件到结果页

- [ ] **11.2** 端到端测试:
  
  - [ ] 输入账号 → 查看ProfileSnapshot (< 5秒)
  - [ ] 等待AI → 查看Strategy渐进渲染 (15-30秒)
  - [ ] 查看日历 → 验证Day 1可见,其他锁定

---

## 🧪 测试用例

### 测试账号库

```typescript
// 准备多种类型的测试账号

const TEST_ACCOUNTS = {
  // 1. 完美账号 (高分)
  perfect: {
    username: 'nike',
    expected_score: 85-95,
    expected_category: 'Sports Brand'
  },

  // 2. 新账号 (低分)
  new_account: {
    username: 'hao.wu.dev',
    expected_score: 40-50,
    expected_issues: ['Bio缺失', '粉丝数为0', '内容过少']
  },

  // 3. 私密账号 (错误处理)
  private: {
    username: 'private_test_account',
    expected_error: 'PROFILE_PRIVATE'
  },

  // 4. 不存在账号 (错误处理)
  not_found: {
    username: 'asdfghjkl12345nonexistent',
    expected_error: 'PROFILE_NOT_FOUND'
  }
}
```

### 性能基准测试

```typescript
// tests/performance.test.ts

describe('Performance Benchmarks', () => {
  test('Fast Lane应在500ms内返回', async () => {
    const start = Date.now()
    const res = await fetch('/api/audit/init', {
      method: 'POST',
      body: JSON.stringify({ username: 'nike' })
    })
    const duration = Date.now() - start

    expect(res.status).toBe(200)
    expect(duration).toBeLessThan(500)
  })

  test('缓存命中应在100ms内返回', async () => {
    // 第一次请求
    await fetch('/api/audit/init', {
      method: 'POST',
      body: JSON.stringify({ username: 'test_cache' })
    })

    // 第二次请求 (应该命中缓存)
    const start = Date.now()
    const res = await fetch('/api/audit/init', {
      method: 'POST',
      body: JSON.stringify({ username: 'test_cache' })
    })
    const duration = Date.now() - start

    const data = await res.json()
    expect(data.cache_hit).toBe(true)
    expect(duration).toBeLessThan(100)
  })
})
```

---

## 🚦 部署检查清单

### 上线前验证

- [ ] **环境变量**: 所有必需的API密钥已配置
- [ ] **数据库**: Schema迁移已执行
- [ ] **Apify**: 账户余额充足 (建议 > $10)
- [ ] **DeerAPI**: 配额检查
- [ ] **错误监控**: Sentry/LogRocket已集成
- [ ] **性能测试**: Lighthouse Score > 90
- [ ] **负载测试**: 100并发请求无错误
- [ ] **缓存验证**: Redis/Supabase缓存正常工作

### 发布后监控

```typescript
// 关键指标监控

const METRICS_TO_TRACK = {
  // 性能指标
  fast_lane_p50: 300,      // 中位数 < 300ms
  fast_lane_p95: 500,      // 95分位 < 500ms
  slow_lane_p50: 20000,    // 中位数 < 20s
  slow_lane_p95: 30000,    // 95分位 < 30s

  // 成本指标
  cache_hit_rate: 0.75,    // 缓存命中率 > 75%
  apify_calls_per_day: 50, // 每日Apify调用 < 50次

  // 质量指标
  ai_parse_success_rate: 0.95,  // AI解析成功率 > 95%
  error_rate: 0.02,             // 错误率 < 2%

  // 转化指标
  snapshot_to_strategy_conversion: 0.80,  // 80%用户会等待Slow Lane
  strategy_to_signup: 0.15                // 15%转化率
}
```

---

## 🔄 迁移步骤 (从旧架构到新架构)

### Step 1: 备份现有数据

```bash
# 导出当前Scan和Report表
npx supabase db dump --data-only > backup_$(date +%Y%m%d).sql
```

### Step 2: 并行部署 (Blue-Green)

```typescript
// 使用Feature Flag渐进式迁移

const USE_NEW_ARCHITECTURE = process.env.FEATURE_NEW_ARCH === 'true'

export async function POST(request: NextRequest) {
  if (USE_NEW_ARCHITECTURE) {
    // 新架构: Fast Lane + Slow Lane
    return handleNewArchitecture(request)
  } else {
    // 旧架构: 单次调用
    return handleLegacyArchitecture(request)
  }
}
```

### Step 3: A/B测试

- [ ] **50%流量** 使用新架构

- [ ] **监控指标**: 响应时间、错误率、转化率

- [ ] **对比数据**:
  
  ```
  旧架构平均响应: 35s
  新架构Fast Lane: 0.4s
  新架构Slow Lane: 22s
  用户感知速度: ↑ 87.5倍
  ```

---

## 🐛 常见问题排查

### Q1: SSE连接总是断开

**原因**: Vercel/Netlify等平台有超时限制

**解决方案**:

```typescript
// 1. 添加心跳机制
setInterval(() => {
  sendEvent('ping', { timestamp: Date.now() })
}, 15000) // 每15秒发送心跳

// 2. 前端自动重连
sse.addEventListener('error', () => {
  console.log('SSE断开,3秒后重连...')
  setTimeout(() => {
    sse = new EventSource(url)
  }, 3000)
})
```

### Q2: AI返回格式不稳定

**原因**: Gemini有时会添加Markdown标记

**解决方案**:

```typescript
// 更鲁棒的JSON提取
function extractJSON(text: string): any {
  // 方法1: 移除markdown代码块
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')

  // 方法2: 使用正则提取
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found')

  // 方法3: 修复常见错误
  let jsonStr = match[0]
  jsonStr = jsonStr.replace(/,\s*}/g, '}')  // 移除尾随逗号
  jsonStr = jsonStr.replace(/,\s*]/g, ']')

  return JSON.parse(jsonStr)
}
```

### Q3: Apify成本过高

**问题**: 每次查询都调用Apify

**解决方案**:

```typescript
// 缓存策略
const CACHE_STRATEGIES = {
  // 策略1: 时间缓存 (当前实现)
  time_based: {
    ttl: 24 * 60 * 60, // 24小时
    适用: '大多数场景'
  },

  // 策略2: 需求缓存
  on_demand: {
    逻辑: '用户点击"强制刷新"才调用Apify',
    适用: '高频用户'
  },

  // 策略3: 智能缓存
  intelligent: {
    逻辑: `
      if (粉丝数 < 1000) TTL = 7天  // 小账号变化慢
      else if (粉丝数 < 10000) TTL = 3天
      else TTL = 1天  // 大账号变化快
    `,
    适用: '成本敏感场景'
  }
}
```

---

## 📊 数据模型详解

### Apify返回的完整数据结构

```typescript
// 基于实际返回的数据结构

interface ApifyInstagramScraperResult {
  // === 基础信息 ===
  id: string                          // Instagram内部ID
  username: string                    // 用户名
  fullName: string                    // 全名
  biography: string                   // Bio文案
  profilePicUrl: string               // 头像URL
  profilePicUrlHD: string            // 高清头像URL

  // === 统计数据 ===
  followersCount: number              // 粉丝数
  followsCount: number                // 关注数
  postsCount: number                  // 帖子总数
  igtvVideoCount?: number             // IGTV视频数
  highlightReelCount?: number         // 高光故事数

  // === 商业信息 ===
  verified: boolean                   // 是否认证
  isBusinessAccount: boolean          // 是否商业账号
  businessCategoryName?: string       // ⭐ 行业类型
  externalUrl?: string                // ⭐ 外部链接
  fbid?: string                       // Facebook ID

  // === 隐私设置 ===
  isPrivate: boolean                  // 是否私密
  hasChannel: boolean                 // 是否有频道

  // === 最近帖子 (数组) ===
  latestPosts: Array<{
    id: string
    shortCode: string                 // 短代码 (用于URL)
    type: 'Image' | 'Video' | 'Sidecar' | 'Reel'
    caption: string                   // ⭐ 完整文案
    timestamp: string                 // ISO时间戳
    displayUrl: string                // ⭐ 封面图URL

    // 互动数据
    likesCount: number                // ⭐ 点赞数
    commentsCount: number             // ⭐ 评论数
    videoViewCount?: number           // 视频播放量 (如果是视频)

    // 地理位置
    locationName?: string             // ⭐ 地点名称
    locationId?: string

    // 媒体内容
    images?: string[]                 // ⭐ 多图帖子的所有图片
    videos?: Array<{
      url: string
      width: number
      height: number
    }>

    // 标签与提及
    hashtags?: string[]               // ⭐ 标签数组 (需解析caption)
    mentions?: string[]               // @ 提及的用户

    // 其他
    isSponsored: boolean              // 是否广告
    isPinned?: boolean                // 是否置顶
  }>

  // === 增强数据 (需付费开启) ===
  facebookPage?: string               // Facebook主页
  businessEmail?: string              // 商业邮箱
}
```

---

## 🎨 前端状态管理

### 使用React Context管理Audit状态

```typescript
// contexts/AuditContext.tsx

interface AuditContextValue {
  auditId: string | null
  status: AuditStatus
  snapshot: ProfileSnapshot | null
  strategy: StrategyBlueprint | null
  error: ErrorInfo | null
  refetch: () => void
}

export const AuditProvider = ({ children, initialAuditId }: {
  children: React.ReactNode
  initialAuditId: string
}) => {
  const [state, setState] = useState<AuditContextValue>({
    auditId: initialAuditId,
    status: 'loading',
    snapshot: null,
    strategy: null,
    error: null,
    refetch: () => {}
  })

  useEffect(() => {
    // Fast Lane请求
    fetch(`/api/audit/init`, {
      method: 'POST',
      body: JSON.stringify({ audit_id: initialAuditId })
    })
      .then(res => res.json())
      .then(data => {
        setState(prev => ({
          ...prev,
          status: 'snapshot_ready',
          snapshot: data.profile_snapshot
        }))

        // 建立SSE连接
        const sse = new EventSource(`/api/audit/${initialAuditId}/strategy`)

        sse.addEventListener('status', (e) => {
          const { phase, progress } = JSON.parse(e.data)
          setState(prev => ({ ...prev, status: phase, progress }))
        })

        sse.addEventListener('complete', (e) => {
          const strategy = JSON.parse(e.data)
          setState(prev => ({ ...prev, status: 'completed', strategy }))
          sse.close()
        })

        sse.addEventListener('error', () => {
          // 降级到轮询
          fallbackToPolling(initialAuditId, setState)
        })
      })
      .catch(err => {
        setState(prev => ({ ...prev, status: 'error', error: err }))
      })
  }, [initialAuditId])

  return (
    <AuditContext.Provider value={state}>
      {children}
    </AuditContext.Provider>
  )
}

// 使用示例
export default function ResultPage({ params }: { params: { auditId: string } }) {
  return (
    <AuditProvider initialAuditId={params.auditId}>
      <ResultPageContent />
    </AuditProvider>
  )
}
```

---

## 🔍 调试工具

### 开发模式下的调试面板

```typescript
// components/dev/DebugPanel.tsx (仅开发环境)

export function DebugPanel({ auditId }: { auditId: string }) {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // 实时监听数据库变化
    const subscription = supabaseAdmin
      .from('audits')
      .on('UPDATE', payload => {
        if (payload.new.id === auditId) {
          setDebugInfo(payload.new)
        }
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [auditId])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-md">
      <h3 className="font-bold mb-2">Debug Panel</h3>
      <div className="space-y-1">
        <div>Audit ID: {auditId}</div>
        <div>Status: {debugInfo?.status}</div>
        <div>Progress: {debugInfo?.progress}%</div>
        <div>Cache Hit: {debugInfo?.cache_hit ? 'Yes' : 'No'}</div>
        <div>AI Model: {debugInfo?.ai_model_used}</div>
        <div>Gen Time: {debugInfo?.generation_time_ms}ms</div>
      </div>
      <button
        onClick={() => console.log('Full Data:', debugInfo)}
        className="mt-2 bg-white text-black px-2 py-1 text-xs"
      >
        Log Full Data
      </button>
    </div>
  )
}
```

---

## 📚 相关文档

- **主文档**: [TECHNICAL_IMPLEMENTATION_PLAN.md](./TECHNICAL_IMPLEMENTATION_PLAN.md)
- **API规范**: [API_SPECIFICATION.yaml](./API_SPECIFICATION.yaml)
- **前端指南**: [FRONTEND_IMPLEMENTATION_GUIDE.md](./FRONTEND_IMPLEMENTATION_GUIDE.md)
- **后端指南**: [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md)

---

## ✅ 验收标准

### MVP完成标准

1. **功能完整性**
   
   - [ ] 用户输入账号,5秒内看到ProfileSnapshot
   - [ ] 30秒内完成完整策略生成
   - [ ] 缓存命中时,1秒内返回结果
   - [ ] 错误场景有友好提示

2. **性能指标**
   
   - [ ] Fast Lane P95 < 500ms
   - [ ] Slow Lane P95 < 30s
   - [ ] 缓存命中率 > 70%
   - [ ] Lighthouse Performance > 90

3. **用户体验**
   
   - [ ] 无白屏等待
   - [ ] 加载状态清晰
   - [ ] 动画流畅 (60fps)
   - [ ] 移动端适配

4. **成本控制**
   
   - [ ] 每日Apify调用 < 100次
   - [ ] 每次诊断成本 < $0.05
   - [ ] 缓存有效性验证

---

**文档版本**: v1.0
**最后更新**: 2025-01-28
**下一步**: 开始Phase 1 - Day 1任务
