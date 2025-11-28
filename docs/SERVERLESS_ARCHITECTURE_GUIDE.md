# Serverless架构适配指南

> 🚨 本文档说明如何在Vercel/Netlify等Serverless平台上正确实现双速响应架构

---

## ⚠️ Serverless环境的核心限制

### 进程生命周期

```
┌──────────────────────────────────────────────────────────────┐
│              Serverless Function Lifecycle                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. 请求进入                                                  │
│     ↓                                                         │
│  2. 冷启动 (首次) 或 热启动 (复用容器)                        │
│     ↓                                                         │
│  3. 执行函数代码                                              │
│     ↓                                                         │
│  4. 返回HTTP响应                                              │
│     ↓                                                         │
│  5. 🔴 进程立即冻结/销毁                                      │
│     │                                                         │
│     └─→ 任何未完成的异步任务都会被中断!                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**关键问题**:
```typescript
// ❌ 这段代码在Serverless环境会失败
export async function POST(request: NextRequest) {
  const result = await fastOperation()

  // 触发后台任务
  slowOperation().then(() => {
    console.log('完成')  // 🔴 永远不会执行!
  })

  return NextResponse.json(result)  // 响应返回
  // ← 这里进程被销毁,slowOperation被中断
}
```

---

## ✅ 架构修正方案: 懒加载模式

### 方案对比

| 方案 | 优点 | 缺点 | Serverless兼容 |
|-----|------|------|---------------|
| **后台任务触发** | 代码简洁 | 进程会被冻结 | ❌ 不兼容 |
| **外部队列 (BullMQ/SQS)** | 可靠性高 | 增加复杂度+成本 | ✅ 兼容 (但复杂) |
| **懒加载 (SSE内执行)** | 简单+可靠 | 需要长连接支持 | ✅ 完美兼容 |

**最终选择**: 懒加载模式 (Lazy Loading via SSE)

---

## 🔄 修正后的架构流程

### Step 1: Fast Lane API (仅负责快速数据)

```typescript
// app/api/audit/init/route.ts

export async function POST(request: NextRequest) {
  const { username } = await request.json()

  // 1. 缓存检查
  const cached = await checkCache(username)
  if (cached) {
    return NextResponse.json(cached)
  }

  // 2. 调用Apify
  const apifyData = await scrapeInstagram(username)

  // 3. AI快速解析 (Prompt Set 1)
  const fastResult = await parseFastLane(apifyData)

  // 4. 保存到数据库
  const audit = await db.audits.create({
    username,
    apify_raw_data: apifyData,
    profile_snapshot: fastResult.profile_snapshot,
    diagnosis_card: fastResult.diagnosis_card,
    status: 'snapshot_ready'  // ⚠️ 不是 'analyzing'
  })

  // 5. 立即返回 (不等待Slow Lane)
  return NextResponse.json({
    audit_id: audit.id,
    ...fastResult
  })

  // 🔴 函数结束,进程销毁
  // ✅ 没问题! Fast Lane任务已完成
}
```

**时序图**:
```
Client          Server (Serverless)         Database
  │                   │                         │
  ├─ POST /init ─────→│                         │
  │                   ├─ 查询缓存 ──────────────→│
  │                   │←─ Cache Miss ───────────┤
  │                   ├─ 调用Apify              │
  │                   │   (等待3-5秒)            │
  │                   ├─ AI Prompt Set 1        │
  │                   │   (等待1-2秒)            │
  │                   ├─ 保存数据 ──────────────→│
  │←─ Response ──────┤                         │
  │   (Fast Lane)    │                         │
  │                  🔴 进程销毁                │
  │                                              │
  ↓                                              ↓
前端渲染Snapshot ✅                           数据已保存 ✅
```

---

### Step 2: Slow Lane SSE (懒加载执行AI)

```typescript
// app/api/audit/[auditId]/strategy/route.ts

export const runtime = 'nodejs'     // ⚠️ 必须用Node.js运行时
export const maxDuration = 60       // ⚠️ 需要Vercel Pro

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  const { auditId } = params

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          new TextEncoder().encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          )
        )
      }

      // 心跳机制 (防止超时)
      const heartbeat = setInterval(() => {
        sendEvent('ping', { ts: Date.now() })
      }, 15000)

      try {
        // 1. 获取Audit数据
        const audit = await db.audits.findUnique({ where: { id: auditId } })

        // 2. 检查缓存 (情况A)
        if (audit.strategy_section) {
          clearInterval(heartbeat)
          sendEvent('complete', {
            strategy_section: audit.strategy_section,
            execution_calendar: audit.execution_calendar,
            cached: true
          })
          controller.close()
          return
        }

        // 3. 情况B: 无缓存,开始AI生成 (懒加载核心!)
        sendEvent('status', { phase: 'analyzing', progress: 10 })

        // 🔥 关键: AI在SSE连接内执行,进程保持存活
        const strategy = await generateStrategy({
          category: audit.profile_snapshot.category_label,
          bio: audit.apify_raw_data.biography,
          diagnosis: audit.diagnosis_card
        })

        sendEvent('status', { phase: 'building_calendar', progress: 60 })

        // 4. 保存结果
        await db.audits.update({
          where: { id: auditId },
          data: {
            strategy_section: strategy.strategy_section,
            execution_calendar: strategy.execution_calendar,
            status: 'completed'
          }
        })

        // 5. 推送完成事件
        clearInterval(heartbeat)
        sendEvent('complete', strategy)
        controller.close()

      } catch (error) {
        clearInterval(heartbeat)
        sendEvent('error', { error: error.message })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

**时序图**:
```
Client          Server (Serverless)         Database
  │                   │                         │
  ├─ GET /strategy ──→│ (SSE连接建立)           │
  │   (EventSource)   ├─ 查询audit ────────────→│
  │                   │←─ 返回audit ────────────┤
  │                   │                         │
  │                   ├─ 检查strategy_section   │
  │                   │   └─→ 无缓存            │
  │                   │                         │
  │←─ SSE: status ───┤ (progress: 10)          │
  │   "analyzing"     │                         │
  │                   ├─ 🔥 AI生成策略          │
  │                   │   (SSE连接保持活跃)     │
  │                   │   ⏱️ 15-20秒            │
  │←─ SSE: status ───┤ (progress: 60)          │
  │   "building"      │                         │
  │                   ├─ 保存结果 ──────────────→│
  │←─ SSE: complete ─┤                         │
  │   {strategy}      │                         │
  │                   ├─ controller.close()    │
  │                  🔴 进程销毁 (任务已完成)   │
  ↓                                              ↓
前端渲染策略 ✅                               数据已保存 ✅
```

**核心要点**:
- ✅ AI任务在SSE连接内执行
- ✅ 连接保持到 `controller.close()`
- ✅ 进程在任务完成后才销毁

---

## 🎯 前端配合逻辑

### 懒加载触发

```typescript
// app/result/[auditId]/page.tsx

'use client'

export default function ResultPage({ params }: { params: { auditId: string } }) {
  const [snapshot, setSnapshot] = useState(null)
  const [strategy, setStrategy] = useState(null)

  useEffect(() => {
    // ═══════════════════════════════════
    // Step 1: 获取Fast Lane数据 (如果还没有)
    // ═══════════════════════════════════
    fetch(`/api/audit/${params.auditId}`)
      .then(res => res.json())
      .then(data => {
        setSnapshot(data.profile_snapshot)

        // ═══════════════════════════════════
        // Step 2: 立即建立SSE连接 (触发Slow Lane)
        // ═══════════════════════════════════
        const sse = new EventSource(`/api/audit/${params.auditId}/strategy`)

        sse.addEventListener('status', (e) => {
          const { phase, progress } = JSON.parse(e.data)
          console.log(`Progress: ${progress}%`)
        })

        sse.addEventListener('complete', (e) => {
          const strategyData = JSON.parse(e.data)
          setStrategy(strategyData)
          sse.close()
        })

        sse.addEventListener('error', () => {
          console.error('SSE failed, falling back to polling')
          sse.close()
        })
      })
  }, [params.auditId])

  return (
    <div>
      {/* Fast Lane数据 - 立即渲染 */}
      {snapshot && (
        <>
          <ProfileSnapshot data={snapshot} />
          <DiagnosisCard data={snapshot.diagnosis_card} />
        </>
      )}

      {/* Slow Lane数据 - 异步渲染 */}
      {strategy ? (
        <StrategySection data={strategy} />
      ) : (
        <AIThinkingAnimation />
      )}
    </div>
  )
}
```

---

## 🛡️ 边界情况处理

### 情况1: 用户提前关闭页面

**问题**: 用户在Fast Lane渲染后立即关闭页面,SSE连接未建立

**影响**: Slow Lane永远不会执行,数据库中strategy_section为空

**解决方案**:
```typescript
// 方案A: 客户端轮询兜底
useEffect(() => {
  const sse = new EventSource(url)

  // 如果10秒后SSE仍未连接成功,降级到轮询
  const fallbackTimer = setTimeout(() => {
    if (!strategy) {
      sse.close()
      startPolling(auditId)
    }
  }, 10000)

  sse.addEventListener('complete', () => {
    clearTimeout(fallbackTimer)
  })

  return () => {
    clearTimeout(fallbackTimer)
    sse.close()
  }
}, [])

// 方案B: 接受这种情况
// - 用户下次访问时再建立SSE连接
// - 策略会在那时生成并缓存
```

---

### 情况2: SSE超时 (Vercel 60秒限制)

**问题**: AI生成超过60秒

**解决方案**:
```typescript
// 1. 设置AI超时时间 < Serverless超时
const AI_TIMEOUT = 45000  // 45秒 (留15秒缓冲)

const aiResult = await Promise.race([
  callGemini(prompt),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT)
  )
])

// 2. 超时后使用智能降级
catch (error) {
  if (error.message === 'AI_TIMEOUT') {
    const fallbackStrategy = getSmartFallback(category)
    sendEvent('complete', {
      ...fallbackStrategy,
      is_fallback: true,
      reason: 'AI generation timeout, using template'
    })
  }
}
```

---

### 情况3: 并发SSE连接过多

**问题**: 1000个用户同时访问,1000个SSE连接

**影响**: Serverless并发限制 + 数据库连接池耗尽

**解决方案**:
```typescript
// lib/rate-limit/sse-limiter.ts

const activeSseConnections = new Map<string, number>()

export async function canEstablishSseConnection(clientId: string): Promise<boolean> {
  const current = activeSseConnections.get(clientId) || 0

  // 每个客户端最多1个SSE连接
  if (current >= 1) {
    return false
  }

  activeSseConnections.set(clientId, current + 1)

  // 自动清理 (60秒后)
  setTimeout(() => {
    activeSseConnections.delete(clientId)
  }, 60000)

  return true
}

// 使用示例
export async function GET(request: NextRequest) {
  const clientId = request.headers.get('x-client-id') || request.ip

  if (!await canEstablishSseConnection(clientId)) {
    return NextResponse.json({
      error: 'SSE_LIMIT_EXCEEDED',
      message: '已有一个正在进行的分析,请等待完成'
    }, { status: 429 })
  }

  // 继续建立SSE连接...
}
```

---

## 📊 不同平台对比

### Vercel

```yaml
平台: Vercel
运行时: Node.js + Edge Runtime

限制:
  Free Plan:
    - 函数超时: 10秒 ⚠️
    - 并发: 1000
    - 内存: 1024MB
    - 建议: 不适合 (AI需要20-30秒)

  Pro Plan ($20/月):
    - 函数超时: 60秒 ✅
    - 并发: 无限
    - 内存: 3008MB
    - 建议: 推荐

配置:
  vercel.json:
    functions:
      app/api/audit/[auditId]/strategy/route.ts:
        maxDuration: 60
        memory: 1024

  route.ts:
    export const runtime = 'nodejs'
    export const maxDuration = 60
```

---

### Netlify

```yaml
平台: Netlify
运行时: AWS Lambda

限制:
  Free Plan:
    - 函数超时: 10秒 ⚠️
    - 并发: 1000
    - 内存: 1024MB
    - 建议: 不适合

  Pro Plan ($19/月):
    - 函数超时: 26秒 ⚠️ (可能不够)
    - 并发: 无限
    - 内存: 3008MB
    - 建议: 需要优化AI调用

配置:
  netlify.toml:
    [functions]
      node_bundler = "esbuild"
      [functions."api/audit/*/strategy"]
        timeout = 26
```

**如果使用Netlify**:
```typescript
// 需要压缩AI生成时间
const strategy = await Promise.race([
  generateStrategyFast(),  // 优化版Prompt,20秒完成
  timeout(24000)           // 24秒超时
])
```

---

### Railway / 自建服务器

```yaml
平台: Railway / VPS
运行时: Docker Container

限制:
  - 函数超时: ✅ 无限制
  - 并发: 根据资源配置
  - 内存: 可配置
  - 建议: 最灵活,但成本较高

成本对比:
  Vercel Pro: $20/月 (包含Function执行时间)
  Railway: $5/月 (1GB RAM) + 按量计费
  VPS: $10-50/月 (固定成本)
```

---

## 🔧 Vercel部署完整配置

### 1. vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",

  "functions": {
    "app/api/audit/[auditId]/strategy/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },

  "regions": ["sfo1"],

  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],

  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

---

### 2. next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serverless优化
  output: 'standalone',

  // 图片优化
  images: {
    domains: [
      'scontent.cdninstagram.com',
      'instagram.com'
    ],
    unoptimized: false
  },

  // 实验性功能
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['apify-client']
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:8173'
  }
}

module.exports = nextConfig
```

---

### 3. 环境变量 (Vercel Dashboard)

```bash
# Production环境
APIFY_API_TOKEN=apify_api_xxxxx
DEER_API_KEY=sk-xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Preview环境 (使用测试密钥)
APIFY_API_TOKEN=apify_api_test_xxxxx
DEER_API_KEY=sk-test-xxxxx
```

---

## 🐛 调试技巧

### 本地模拟Serverless环境

```typescript
// 在本地测试进程销毁行为

export async function POST(request: NextRequest) {
  const result = await fastOperation()

  // 模拟后台任务
  const bgTask = slowOperation()

  // 立即返回
  const response = NextResponse.json(result)

  // 🧪 测试: 在本地环境下也立即终止进程
  if (process.env.SIMULATE_SERVERLESS === 'true') {
    response.headers.set('Connection', 'close')
    setTimeout(() => {
      console.log('🔴 Simulating process termination')
      // bgTask会被中断
    }, 100)
  }

  return response
}
```

### Vercel日志查看

```bash
# 实时查看SSE日志
vercel logs --follow | grep "SSE"

# 查看特定函数的执行时间
vercel logs --follow | grep "Strategy completed"

# 过滤错误
vercel logs --follow | grep "ERROR"
```

---

## 📈 性能监控

### 关键指标

```typescript
// lib/metrics/sse-metrics.ts

export const SSE_METRICS = {
  // 连接成功率
  connection_success_rate: {
    target: 0.98,  // 98%
    计算: 'successful_connections / total_attempts'
  },

  // 完成率
  completion_rate: {
    target: 0.95,  // 95%
    计算: 'completed_generations / started_generations'
  },

  // 平均执行时间
  avg_generation_time: {
    target: 25000,  // 25秒
    单位: 'ms'
  },

  // 超时率
  timeout_rate: {
    target: 0.02,  // < 2%
    计算: 'timeout_errors / total_requests'
  }
}
```

**Vercel Analytics集成**:
```typescript
import { track } from '@vercel/analytics'

// 在SSE完成时追踪
sendEvent('complete', strategyData)
track('strategy_generated', {
  audit_id: auditId,
  duration_ms: Date.now() - startTime,
  cached: false
})
```

---

## ✅ 验收清单

### Serverless兼容性验证

- [ ] **Fast Lane独立性**
  - [ ] 返回响应后不依赖任何后台任务
  - [ ] 进程销毁不影响已返回的数据

- [ ] **Slow Lane保活机制**
  - [ ] SSE连接建立成功
  - [ ] 心跳机制每15秒发送ping
  - [ ] AI执行时间 < 55秒 (留5秒缓冲)

- [ ] **错误恢复**
  - [ ] SSE断开后自动降级到轮询
  - [ ] 超时后返回智能降级结果
  - [ ] 错误状态正确保存到数据库

- [ ] **缓存有效性**
  - [ ] 第二次SSE连接立即返回缓存 (< 100ms)
  - [ ] 过期缓存自动重新生成

---

## 🎓 最佳实践总结

### DO's ✅

1. **在SSE连接内执行长时间任务**
   ```typescript
   const stream = new ReadableStream({
     async start(controller) {
       // ✅ 这里可以安全执行30秒的AI调用
       const result = await longRunningAITask()
       sendEvent('complete', result)
     }
   })
   ```

2. **设置合理的超时时间**
   ```typescript
   export const maxDuration = 60  // Vercel Pro
   // AI超时设为45秒 (留15秒缓冲)
   ```

3. **添加心跳机制**
   ```typescript
   const heartbeat = setInterval(() => {
     sendEvent('ping', {})
   }, 15000)
   ```

4. **主动关闭连接**
   ```typescript
   sendEvent('complete', data)
   controller.close()  // 释放资源
   ```

---

### DON'Ts ❌

1. **不要在Fast Lane返回后执行后台任务**
   ```typescript
   // ❌ 这会失败
   return NextResponse.json(data)
   // 下面的代码不会执行
   await slowTask()
   ```

2. **不要忘记清理定时器**
   ```typescript
   // ❌ 内存泄漏
   setInterval(() => sendEvent('ping', {}), 15000)

   // ✅ 正确清理
   const heartbeat = setInterval(...)
   controller.close()
   clearInterval(heartbeat)
   ```

3. **不要在Edge Runtime使用长连接**
   ```typescript
   // ❌ Edge不支持SSE
   export const runtime = 'edge'

   // ✅ 使用Node.js
   export const runtime = 'nodejs'
   ```

---

## 🚀 部署流程

### 首次部署

```bash
# 1. 安装Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 链接项目
cd account-doctor
vercel link

# 4. 设置环境变量
vercel env add APIFY_API_TOKEN production
vercel env add DEER_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 5. 部署到生产
vercel --prod
```

### 持续部署 (CI/CD)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📞 故障排查

### 问题: AI任务执行到一半就停止了

**诊断**:
```bash
# 查看Vercel日志
vercel logs --follow

# 查找进程销毁的证据
# 正常应该看到: "[SSE] Strategy completed"
# 如果看到: "Function terminated" → 进程被强制终止
```

**解决**:
1. 检查 `maxDuration` 配置
2. 检查AI调用是否在SSE连接内
3. 检查是否正确使用 `runtime: 'nodejs'`

---

### 问题: SSE连接总是断开

**诊断**:
```javascript
// 前端添加日志
sse.addEventListener('error', (e) => {
  console.error('SSE Error:', e)
  console.log('ReadyState:', sse.readyState)
  // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
})
```

**解决**:
1. 检查响应头是否正确
2. 添加心跳机制
3. 检查Nginx缓冲 (添加 `X-Accel-Buffering: no`)

---

**文档版本**: v1.0
**最后更新**: 2025-01-28
**重要性**: 🔥 关键架构文档
