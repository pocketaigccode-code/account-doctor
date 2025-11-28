# AccountDoctor 技术文档中心

> Instagram账号诊断工具 - 完整技术实现方案

---

## 📚 文档导航

### 1. 核心架构文档

#### 📘 [技术实现与开发计划](./TECHNICAL_IMPLEMENTATION_PLAN.md)
**适用**: 技术负责人、架构师

**内容**:
- 双速响应架构设计
- 数据流规范
- 数据库Schema完整设计
- 缓存策略
- 开发排期

**关键要点**:
- ⚡ Fast Lane: Profile Snapshot (< 500ms)
- 🐌 Slow Lane: AI Strategy (10-30s)
- 💰 成本优化: 24小时缓存

---

#### 📗 [API接口规范](./API_SPECIFICATION.yaml)
**适用**: 前后端开发者

**内容**:
- OpenAPI 3.0 完整规范
- 请求/响应格式
- 错误码定义
- SSE事件定义

**测试工具**:
```bash
# 使用Swagger UI查看
npx swagger-ui-watcher ./docs/API_SPECIFICATION.yaml
```

---

#### 📙 [前端实现指南](./FRONTEND_IMPLEMENTATION_GUIDE.md)
**适用**: 前端工程师

**内容**:
- 组件结构详解
- SSE订阅实现
- 骨架屏设计
- 动画与微交互
- 响应式布局

**核心组件**:
1. `ProfileSnapshot` - 顶部概览
2. `DiagnosisCard` - 诊断卡片
3. `StrategySection` - 策略分析
4. `ExecutionCalendar` - 30天日历

---

#### 📕 [后端实现指南](./BACKEND_IMPLEMENTATION_GUIDE.md)
**适用**: 后端工程师

**内容**:
- API Route Handlers
- AI提示词完整代码
- SSE流式响应
- 错误处理
- 性能优化

**关键API**:
- `POST /api/audit/init` - Fast Lane入口
- `GET /api/audit/{id}/strategy` - SSE流式
- `GET /api/audit/{id}/status` - 轮询备用

---

#### 📓 [快速开始指南](./QUICK_START_GUIDE.md)
**适用**: 新加入的开发者

**内容**:
- 实施检查清单
- 测试用例
- 调试工具
- 常见问题排查
- 迁移步骤

---

#### 🚨 [Serverless架构指南](./SERVERLESS_ARCHITECTURE_GUIDE.md)
**适用**: 部署到Vercel/Netlify的团队

**内容**:
- Serverless环境限制说明
- 懒加载模式详解
- 平台对比 (Vercel/Netlify/Railway)
- 配置文件示例
- 故障排查

**⚠️ 必读**: 部署前务必阅读,避免AI任务失败!

---

#### 📋 [架构修正总结](./ARCHITECTURE_REVISION_SUMMARY.md)
**适用**: 所有开发者

**内容**:
- 修正前后对比
- 关键代码变更
- 验证方法
- 迁移清单

**核心变更**: 后台任务 → 懒加载模式

---

## 🎯 核心概念速查

### 双速响应架构

```
用户输入 @username
     ↓
═══════════════════════════════════════
Fast Lane (< 500ms)
═══════════════════════════════════════
1. 检查缓存 (DB)
2. 调用Apify (如果缓存未命中)
3. 解析JSON (AI Prompt Set 1)
4. 返回 Profile Snapshot + Diagnosis
     ↓
前端立即渲染顶部2个区块 ✅
═══════════════════════════════════════

═══════════════════════════════════════
Slow Lane (10-30s, 异步)
═══════════════════════════════════════
1. 调用AI生成策略 (AI Prompt Set 2)
2. 生成30天日历
3. 通过SSE推送进度
4. 返回完整策略
     ↓
前端渐进式渲染下方区块 ✅
═══════════════════════════════════════
```

---

## 🔧 环境配置

### 必需的环境变量

```bash
# .env.local

# === Apify (必需) ===
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx

# === DeerAPI - Gemini (必需) ===
DEER_API_BASE_URL=https://api.deerapi.com
DEER_API_KEY=sk-xxxxxxxxxxxxx

# === Supabase (必需) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# === Sidewalk AI (可选) ===
SIDEWALK_API_KEY=sk-xxxxxxxxxxxxx

# === Feature Flags (可选) ===
FEATURE_NEW_ARCH=true
FEATURE_IMAGE_GEN=false
FEATURE_CACHE=true

# === 性能配置 ===
APIFY_TIMEOUT_MS=10000
AI_GENERATION_TIMEOUT_MS=30000
CACHE_TTL_HOURS=24
```

---

## 🚀 快速启动

### 本地开发

```bash
# 1. 安装依赖
cd account-doctor
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入密钥

# 3. 数据库迁移
npx supabase migration up

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:8173

# 5. 测试API
curl -X POST http://localhost:8173/api/audit/init \
  -H "Content-Type: application/json" \
  -d '{"username": "nike"}'
```

---

## 📊 数据字段映射表

### Apify → 前端展示

| Apify字段 | 用途 | 前端展示位置 | 必需? |
|----------|------|-------------|-------|
| `username` | 用户名 | ProfileSnapshot.handle | ✅ |
| `fullName` | 全名 | ProfileSnapshot.full_name | ✅ |
| `profilePicUrl` | 头像 | ProfileSnapshot.avatar | ✅ |
| `followersCount` | 粉丝数 | ProfileSnapshot.followers_display | ✅ |
| `businessCategoryName` | 行业 | ProfileSnapshot.category_label | ⭐ |
| `externalUrl` | 网站链接 | MissingElements检查 | ⭐ |
| `biography` | Bio | AI Prompt输入 | ✅ |
| `latestPosts[].timestamp` | 发布时间 | Activity Status计算 | ✅ |
| `latestPosts[].likesCount` | 点赞数 | Avg Likes计算 | ✅ |
| `latestPosts[].caption` | 文案 | 标签提取 | ✅ |
| `latestPosts[].displayUrl` | 封面图 | Recent Posts Preview | ✅ |
| `latestPosts[].type` | 帖子类型 | 格式分析 | ⭐ |
| `latestPosts[].locationName` | 地点 | Location检查 | ⭐ |

---

## 🎨 设计系统

### Anthropic风格配色

```typescript
// tailwind.config.js - 已配置

colors: {
  sand: {
    50: '#fdfcf8',   // 纸质背景
    100: '#f4f1ea',  // 卡片背景
    200: '#e6e2d6',  // 边框
  },
  charcoal: {
    900: '#191919',  // 主文字
    800: '#333333',  // 副文字
    600: '#666666',  // 辅助文字
  },
  terracotta: {
    DEFAULT: '#d97757',  // 警告/问题
    light: '#fdf3f0',    // 警告背景
  },
  sage: {
    DEFAULT: '#8DA399',  // 成功/进度
  }
}

fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  serif: ['Merriweather', 'serif']
}
```

### 字体使用规则

```css
/* 标题 (H1-H3) */
.font-serif

/* 正文、按钮、标签 */
.font-sans

/* ❌ 禁止使用 */
.italic  /* 不使用斜体 */
```

---

## 🧪 测试策略

### 测试金字塔

```
           /\
          /E2E\         5% - Playwright端到端测试
         /------\
        /Integ  \       15% - API集成测试
       /----------\
      /   Unit     \    80% - 单元测试
     /--------------\
```

### 关键测试用例

```typescript
// 1. Fast Lane性能测试
test('Fast Lane should respond within 500ms (cache hit)', async () => {
  const start = Date.now()
  const res = await POST('/api/audit/init', { username: 'cached_account' })
  expect(Date.now() - start).toBeLessThan(500)
})

// 2. 缓存逻辑测试
test('Should reuse cache within 24 hours', async () => {
  const res1 = await POST('/api/audit/init', { username: 'test' })
  const res2 = await POST('/api/audit/init', { username: 'test' })
  expect(res2.cache_hit).toBe(true)
})

// 3. 错误处理测试
test('Should return 404 for non-existent account', async () => {
  const res = await POST('/api/audit/init', { username: 'xxx_nonexistent_xxx' })
  expect(res.status).toBe(404)
  expect(res.error).toBe('PROFILE_NOT_FOUND')
})

// 4. SSE测试
test('Should receive strategy via SSE', async () => {
  const events: any[] = []
  const sse = new EventSource('/api/audit/xxx/strategy')

  sse.addEventListener('status', (e) => events.push(JSON.parse(e.data)))
  sse.addEventListener('complete', (e) => {
    events.push(JSON.parse(e.data))
    expect(events.length).toBeGreaterThan(3)
  })
})
```

---

## 🔗 外部资源

### Apify文档
- [Instagram Scraper完整文档](https://apify.com/apify/instagram-scraper)
- [Apify API参考](https://docs.apify.com/api/v2)

### AI提示词资源
- [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Library](https://docs.anthropic.com/claude/prompt-library)

### Next.js
- [Server-Sent Events in Next.js](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [React Suspense](https://react.dev/reference/react/Suspense)

---

## 👥 团队协作

### 分工建议

| 角色 | 负责模块 | 优先级 |
|-----|---------|-------|
| **后端工程师** | Apify接入、缓存、SSE | P0 |
| **前端工程师** | 组件开发、SSE订阅 | P0 |
| **AI工程师** | 提示词优化、降级策略 | P1 |
| **UI设计师** | 骨架屏、动画效果 | P1 |

### 协作工具

- **代码仓库**: GitHub
- **API文档**: Postman Collection
- **设计稿**: Figma
- **项目管理**: Linear/Notion

---

## 🎓 学习路径

### 对于前端工程师

1. **必读**: [前端实现指南](./FRONTEND_IMPLEMENTATION_GUIDE.md)
2. **练习**: 实现ProfileSnapshot组件
3. **进阶**: SSE订阅与状态管理

### 对于后端工程师

1. **必读**: [后端实现指南](./BACKEND_IMPLEMENTATION_GUIDE.md)
2. **练习**: 实现Fast Lane API
3. **进阶**: SSE流式响应优化

---

## 📞 支持与反馈

- **技术问题**: 查看 [常见问题](./QUICK_START_GUIDE.md#常见问题排查)
- **Bug报告**: GitHub Issues
- **功能建议**: 产品路线图讨论区

---

## 📈 版本历史

### v1.0 (2025-01-28)
- ✅ 双速响应架构设计
- ✅ 完整API文档
- ✅ 前后端实现指南
- ✅ 缓存策略设计

### v1.1 (计划中)
- [ ] Sidewalk AI生图集成
- [ ] WebSocket实时协作
- [ ] 多账号对比分析

---

**文档维护者**: AccountDoctor Team
**最后更新**: 2025-01-28
