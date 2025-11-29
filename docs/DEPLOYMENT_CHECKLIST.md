# 部署检查清单

> ✅ 确保Serverless架构正确部署的完整检查清单

---

## 📋 部署前检查

### 1. 代码文件验证

- [ ] **`app/api/audit/init/route.ts`**
  
  - [ ] 已删除 `processAIEnhancement` 函数
  - [ ] 已删除 `callGemini` 函数
  - [ ] 返回值包含 `status: 'pending_diagnosis'`
  - [ ] 不包含任何 `await` AI调用

- [ ] **`app/api/audit/[auditId]/diagnosis/route.ts`**
  
  - [ ] 文件已创建
  - [ ] 包含 `export const runtime = 'nodejs'`
  - [ ] 包含 `export const maxDuration = 60`
  - [ ] 实现完整的SSE流

- [ ] **`app/api/audit/[auditId]/strategy/route.ts`**
  
  - [ ] 包含 `export const runtime = 'nodejs'`
  - [ ] 包含 `export const maxDuration = 60`
  - [ ] 实现SSE心跳机制

- [ ] **`app/audit/[auditId]/page.tsx`**
  
  - [ ] 已删除轮询逻辑
  - [ ] 已添加SSE连接代码
  - [ ] 正确处理 `EventSource`

- [ ] **`vercel.json`**
  
  - [ ] 文件已创建
  - [ ] 配置了 `diagnosis` 和 `strategy` 路由的 `maxDuration: 60`
  - [ ] 配置了正确的响应头

---

## 🔧 环境配置

### Vercel Dashboard设置

```bash
# 必需的环境变量
DEER_API_KEY=sk-xxxxx                          # DeerAPI密钥
DEER_API_BASE_URL=https://api.deerapi.com      # DeerAPI基础URL
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
DATABASE_URL=postgresql://xxx
APIFY_API_TOKEN=apify_api_xxx                  # Apify令牌
```

### Vercel订阅级别

- [ ] **已升级到Vercel Pro** ($20/月)
  - ⚠️ 免费版10秒超时,SSE接口无法使用
  - ✅ Pro版60秒超时,完美兼容

---

## 🚀 部署步骤

### 1. 本地测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 测试Fast Lane (应在5秒内返回)
curl -X POST http://localhost:8173/api/audit/init \
  -H "Content-Type: application/json" \
  -d '{"username": "nike"}'

# 预期响应
{
  "audit_id": "xxx-xxx-xxx",
  "status": "pending_diagnosis",
  "instant_data": {...},
  "has_diagnosis": false
}
```

### 2. 测试SSE连接

```bash
# 测试诊断SSE (应在20秒内完成)
curl -N http://localhost:8173/api/audit/{audit_id}/diagnosis

# 预期输出 (SSE事件流)
event: status
data: {"phase":"loading","progress":0}

event: ping
data: {"timestamp":1706545000000}

event: status
data: {"phase":"analyzing","progress":10}

event: complete
data: {"diagnosis_card":{...},"cached":false}
```

### 3. 部署到Vercel

```bash
# 安装Vercel CLI (如果还没有)
npm install -g vercel

# 登录Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### 4. 设置环境变量

```bash
# 在Vercel Dashboard中设置
vercel env add DEER_API_KEY production
vercel env add DEER_API_BASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... 其他环境变量
```

---

## 🧪 生产环境验证

### 1. Fast Lane测试

```bash
# 测试生产环境的Fast Lane
curl -X POST https://your-domain.vercel.app/api/audit/init \
  -H "Content-Type: application/json" \
  -d '{"username": "nike"}' \
  | jq .

# 验证点
✅ 响应时间 < 10秒
✅ 返回 audit_id
✅ status = 'pending_diagnosis'
✅ instant_data 包含基础信息
```

### 2. SSE Diagnosis测试

在浏览器开发者工具中:

```javascript
// 打开控制台,执行:
const sse = new EventSource('https://your-domain.vercel.app/api/audit/{audit_id}/diagnosis')

sse.addEventListener('status', (e) => {
  console.log('Status:', JSON.parse(e.data))
})

sse.addEventListener('complete', (e) => {
  console.log('Complete:', JSON.parse(e.data))
  sse.close()
})

sse.addEventListener('error', (e) => {
  console.error('Error:', e)
})
```

**验证点**:

- ✅ 每15秒收到 `ping` 事件
- ✅ 收到 `status` 事件 (phase: analyzing)
- ✅ 20-30秒后收到 `complete` 事件
- ✅ `diagnosis_card` 数据完整

### 3. SSE Strategy测试

```javascript
const sse = new EventSource('https://your-domain.vercel.app/api/audit/{audit_id}/strategy')

sse.addEventListener('complete', (e) => {
  const data = JSON.parse(e.data)
  console.log('Strategy:', data.strategy_section)
  console.log('Calendar:', data.execution_calendar)
  sse.close()
})
```

**验证点**:

- ✅ 收到 `strategy_section`
- ✅ 收到 `execution_calendar`
- ✅ 30-40秒内完成

---

## 📊 性能监控

### Vercel日志查看

```bash
# 实时查看所有日志
vercel logs --follow

# 过滤SSE相关日志
vercel logs --follow | grep "SSE"

# 查看特定函数的执行时间
vercel logs --follow | grep "completed in"
```

### 关键指标

| 指标                | 目标值   | 检查方法                      |
| ----------------- | ----- | ------------------------- |
| Fast Lane响应时间     | < 10秒 | Vercel Analytics          |
| Diagnosis SSE完成时间 | < 30秒 | 日志中的 `generation_time_ms` |
| Strategy SSE完成时间  | < 40秒 | 日志中的 `generation_time_ms` |
| SSE成功率            | > 95% | 错误日志统计                    |
| 心跳正常率             | 100%  | 检查 `ping` 事件频率            |

---

## ⚠️ 常见问题排查

### 问题1: "Function execution timed out after 10 seconds"

**原因**: 使用了Vercel免费版

**解决**:

```bash
# 升级到Pro版
vercel upgrade
```

### 问题2: SSE连接立即断开

**检查**:

1. Nginx/CDN是否缓冲了SSE响应
2. `X-Accel-Buffering: no` 响应头是否存在

**解决** (`vercel.json`):

```json
{
  "headers": [
    {
      "source": "/api/audit/:auditId/diagnosis",
      "headers": [
        { "key": "X-Accel-Buffering", "value": "no" }
      ]
    }
  ]
}
```

### 问题3: AI生成超时

**现象**: SSE连接60秒后断开,`complete` 事件未收到

**原因**: AI调用超过60秒

**解决**:

```typescript
// app/api/audit/[auditId]/diagnosis/route.ts
// 添加AI超时保护
const AI_TIMEOUT = 45000  // 45秒

const aiResponse = await Promise.race([
  callGemini(prompt, systemPrompt),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT)
  )
])
```

### 问题4: 前端没有收到诊断数据

**检查**:

1. 前端是否建立了SSE连接
2. SSE URL是否正确
3. 浏览器控制台是否有错误

**调试**:

```javascript
// 添加详细日志
const sse = new EventSource(url)

sse.onopen = () => console.log('✅ SSE连接已建立')
sse.onerror = (e) => console.error('❌ SSE错误:', e)
sse.addEventListener('message', (e) => console.log('📨 消息:', e.data))
```

---

## ✅ 最终验证清单

部署完成后,完整测试一次完整流程:

1. [ ] **首页输入用户名** → 提交
2. [ ] **Fast Lane** → 5秒内跳转到结果页
3. [ ] **基础数据渲染** → 看到头像、粉丝数等
4. [ ] **诊断卡骨架屏** → 显示"分析中..."
5. [ ] **SSE连接建立** → 浏览器Network面板看到 `diagnosis` 请求
6. [ ] **诊断数据渲染** → 20秒内看到评分圆环
7. [ ] **策略部分加载** → 30秒内看到策略建议
8. [ ] **日历渲染** → 40秒内看到30天日历

**所有步骤都通过** = ✅ 部署成功!

---

## 📞 紧急回滚

如果生产环境出现严重问题:

```bash
# 查看部署历史
vercel ls

# 回滚到上一个版本
vercel rollback <deployment-url>
```

---

**文档版本**: v1.0
**最后更新**: 2025-01-29
