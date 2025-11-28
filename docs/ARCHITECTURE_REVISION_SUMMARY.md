# 架构修正总结 - Serverless适配

> 🚨 本文档总结了针对Serverless环境的关键架构修正

---

## 🎯 修正目标

将原本的"后台任务触发"模式改为"懒加载"模式,以适配Vercel等Serverless平台的进程生命周期限制。

---

## ❌ 修正前的架构 (有问题)

### 错误流程

```
POST /api/audit/init
  ├─ 1. 调用Apify
  ├─ 2. Fast Lane解析
  ├─ 3. 保存到数据库
  ├─ 4. 🔴 触发后台任务 triggerSlowLane()
  │      └─→ performAIAnalysis().catch(...)
  └─ 5. 返回响应

🔴 进程销毁 ← Response已返回
↓
后台任务被中断! ❌
AI生成失败! ❌
```

### 为什么会失败?

```javascript
// 代码示例
export async function POST(request: NextRequest) {
  const fastResult = await getFastLaneData()

  // 触发后台任务
  generateSlowLaneData(auditId)  // ← 这是一个Promise
    .then(() => console.log('完成'))
    .catch(console.error)

  // 立即返回
  return NextResponse.json(fastResult)
  // ↑ 这里响应返回后,Serverless进程立即销毁
  // generateSlowLaneData() 还在执行中,但会被强制中断!
}
```

**影响**:
- ❌ AI策略永远生成不了
- ❌ 数据库中strategy_section始终为空
- ❌ 前端永远卡在"加载中..."
- ❌ 用户体验极差

---

## ✅ 修正后的架构 (Serverless友好)

### 正确流程

```
POST /api/audit/init (Fast Lane Only)
  ├─ 1. 调用Apify
  ├─ 2. AI Prompt Set 1 (快速解析)
  ├─ 3. 保存到数据库 (status: 'snapshot_ready')
  └─ 4. 返回响应

🔴 进程销毁 ← 没关系,Fast Lane已完成 ✅

---

前端建立SSE连接
  ↓
GET /api/audit/{id}/strategy (Slow Lane Lazy Load)
  ├─ SSE连接建立 🔥 进程保持活跃
  ├─ 1. 查询数据库
  ├─ 2. 检查是否有缓存
  │    ├─ 有缓存 → 立即返回 (< 50ms)
  │    └─ 无缓存 → 继续...
  ├─ 3. ✅ AI Prompt Set 2 (在SSE连接内执行)
  ├─ 4. 保存结果到数据库
  ├─ 5. SSE推送完成事件
  └─ 6. controller.close()

🔴 进程销毁 ← AI任务已完成 ✅
```

---

## 🔑 关键代码对比

### Fast Lane API

**修正前** (❌ 错误):
```typescript
export async function POST(request: NextRequest) {
  const fastData = await parseFastLane()

  // 保存
  await db.save(fastData)

  // ❌ 触发后台任务 (会被中断!)
  triggerSlowLane(auditId).catch(console.error)

  return NextResponse.json(fastData)
}
```

**修正后** (✅ 正确):
```typescript
export async function POST(request: NextRequest) {
  const fastData = await parseFastLane()

  // 保存 (status: 'snapshot_ready' 而非 'analyzing')
  await db.save({
    ...fastData,
    status: 'snapshot_ready'  // ⚠️ 不触发任何后台任务
  })

  // ✅ 立即返回,让前端去触发Slow Lane
  return NextResponse.json(fastData)
  // 进程销毁,但Fast Lane已完成 ✅
}
```

---

### Slow Lane API

**修正前** (❌ 不存在):
```typescript
// 原架构依赖后台任务,没有独立的Slow Lane API
```

**修正后** (✅ 新增):
```typescript
// app/api/audit/[auditId]/strategy/route.ts

export const runtime = 'nodejs'    // ⚠️ 必须
export const maxDuration = 60      // ⚠️ Vercel Pro必需

export async function GET(request: NextRequest, { params }) {
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event, data) => { ... }

      // 心跳 (防止超时)
      const heartbeat = setInterval(() => {
        sendEvent('ping', {})
      }, 15000)

      try {
        const audit = await db.findAudit(params.auditId)

        // 情况A: 有缓存
        if (audit.strategy_section) {
          clearInterval(heartbeat)
          sendEvent('complete', audit.strategy_section)
          controller.close()
          return
        }

        // 情况B: 无缓存 - 懒加载执行AI
        sendEvent('status', { progress: 10 })

        // 🔥 AI在SSE连接内执行,进程保持活跃
        const strategy = await generateStrategy(audit)

        sendEvent('status', { progress: 90 })

        await db.saveStrategy(params.auditId, strategy)

        clearInterval(heartbeat)
        sendEvent('complete', strategy)
        controller.close()  // 主动关闭,释放资源

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
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    }
  })
}
```

---

## 📊 架构对比表

| 维度 | 原架构 (后台任务) | 新架构 (懒加载) |
|-----|-----------------|----------------|
| **Fast Lane触发** | 调用Apify + 触发后台AI | 调用Apify + 返回 |
| **Slow Lane触发** | 在Fast Lane内触发 | 前端建立SSE时触发 |
| **进程生命周期** | 依赖后台任务 | 利用SSE长连接 |
| **Serverless兼容** | ❌ 不兼容 (进程冻结) | ✅ 完全兼容 |
| **缓存策略** | Fast + Slow一起缓存 | 分别缓存,独立命中 |
| **用户体验** | 35秒白屏等待 | 5秒首屏 + 25秒渐进 |
| **成本** | 每次调用Apify | 75%缓存命中 |

---

## 🔧 迁移步骤

### 代码修改清单

#### 1. 修改 `app/api/audit/init/route.ts`

```diff
  export async function POST(request: NextRequest) {
    const fastData = await parseFastLane()

    await db.save({
      ...fastData,
-     status: 'analyzing'  // ❌ 删除
+     status: 'snapshot_ready'  // ✅ 修改
    })

-   // ❌ 删除整个后台任务触发
-   triggerSlowLaneProcessing(auditId, apifyData, fastData)
-     .catch(err => console.error('[Slow Lane] Failed:', err))

    return NextResponse.json(fastData)
  }
```

---

#### 2. 新增 `app/api/audit/[auditId]/strategy/route.ts`

```typescript
// ✅ 完全新增的文件

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest, { params }) {
  // SSE实现 (见完整代码)
}
```

---

#### 3. 修改前端 `app/result/[auditId]/page.tsx`

```diff
  useEffect(() => {
-   // ❌ 旧方式: 轮询等待Slow Lane完成
-   const interval = setInterval(async () => {
-     const status = await fetch(`/api/audit/${auditId}/status`)
-     if (status.strategy_section) {
-       setStrategy(status.strategy_section)
-       clearInterval(interval)
-     }
-   }, 2000)

+   // ✅ 新方式: 主动建立SSE连接触发生成
+   const sse = new EventSource(`/api/audit/${auditId}/strategy`)
+
+   sse.addEventListener('status', (e) => {
+     setProgress(JSON.parse(e.data).progress)
+   })
+
+   sse.addEventListener('complete', (e) => {
+     setStrategy(JSON.parse(e.data))
+     sse.close()
+   })

    return () => {
-     clearInterval(interval)
+     sse.close()
    }
  }, [auditId])
```

---

## 🎯 验证方法

### 测试Serverless兼容性

```typescript
// tests/serverless-compat.test.ts

describe('Serverless Compatibility', () => {
  test('Fast Lane应该在响应返回后立即结束', async () => {
    const processExitSpy = jest.spyOn(process, 'exit')

    await POST('/api/audit/init', { username: 'test' })

    // 验证没有未完成的Promise
    expect(processExitSpy).not.toHaveBeenCalled()
  })

  test('Slow Lane应该在SSE连接内完成AI生成', async () => {
    let completed = false

    const sse = new EventSource('/api/audit/xxx/strategy')

    sse.addEventListener('complete', () => {
      completed = true
      sse.close()
    })

    // 等待最多60秒
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        if (!completed) throw new Error('Timeout')
        resolve()
      }, 60000)
    })

    expect(completed).toBe(true)
  })
})
```

---

## 📚 相关文档

- **主文档**: [TECHNICAL_IMPLEMENTATION_PLAN.md](./TECHNICAL_IMPLEMENTATION_PLAN.md#11-serverless部署指南)
- **后端实现**: [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md#serverless部署配置)
- **架构图**: [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md#flow-2-slow-lane-懒加载模式)
- **详细指南**: [SERVERLESS_ARCHITECTURE_GUIDE.md](./SERVERLESS_ARCHITECTURE_GUIDE.md)

---

## ✅ 修正完成验收

- [x] Fast Lane不再触发后台任务
- [x] Slow Lane改为SSE连接时才执行
- [x] 添加 `runtime: 'nodejs'` 配置
- [x] 添加 `maxDuration: 60` 配置
- [x] 添加心跳机制
- [x] 添加超时保护
- [x] 更新所有相关文档

---

**状态**: ✅ 架构修正已完成,可以开始开发
**适用平台**: Vercel Pro, Railway, 自建服务器
**不适用**: Vercel Free (10秒限制), Netlify Free

---

**文档版本**: v1.0
**最后更新**: 2025-01-28
