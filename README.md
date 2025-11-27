# AccountDoctor - AI驱动的社交媒体账号诊断工具

面向中小企业主的Instagram账号诊断与内容策划一体化SaaS工具

## 🎯 核心功能

- ✅ **无需登录诊断**: 仅需Instagram用户名,60秒获得专业诊断
- ✅ **AI驱动评分**: 基于5大维度(内容质量、互动健康、账号活力、增长潜力、受众匹配)的0-100分评分
- ✅ **智能内容生成**: AI生成Day 1完整内容(文案+标签+图片建议)
- ✅ **30天内容日历**: 自动生成4周主题化内容规划
- ✅ **可执行建议**: 3个核心改进方向+最紧急行动项

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写以下配置:

```env
# Supabase配置 (前往 https://supabase.com 创建项目)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database URL (从Supabase获取)
DATABASE_URL=postgresql://...

# Google Gemini API (前往 https://makersuite.google.com/app/apikey)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# 可选: OpenAI API (用于高级功能)
OPENAI_API_KEY=your_openai_api_key
```

### 3. 初始化数据库

```bash
# 生成Prisma Client
npx prisma generate

# 推送Schema到数据库
npx prisma db push

# (可选)打开Prisma Studio查看数据
npx prisma studio
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用!

## 📁 项目结构

```
account-doctor/
├── app/                      # Next.js App Router
│   ├── api/                  # API路由
│   │   ├── scan/            # 扫描接口
│   │   └── analyze/         # 分析接口
│   ├── result/              # 结果页面 (待开发)
│   └── page.tsx             # 首页
├── lib/                      # 核心逻辑
│   ├── ai/                  # AI引擎
│   │   └── gemini.ts        # Gemini API封装
│   ├── scrapers/            # 爬虫
│   │   └── instagram.ts     # Instagram爬虫
│   ├── prisma.ts            # Prisma客户端
│   ├── supabase.ts          # Supabase客户端
│   └── utils.ts             # 工具函数
├── prisma/                   # 数据库Schema
│   └── schema.prisma        # Prisma Schema定义
├── components/              # React组件 (待扩展)
└── public/                  # 静态资源
```

## 🗄️ 数据库Schema

### User (用户表)
- `id`: 用户唯一标识
- `email`: 邮箱
- `subscriptionTier`: 订阅等级 (FREE/BASIC/PRO/ENTERPRISE)
- `scansRemaining`: 剩余扫描次数

### Scan (扫描记录表)
- `id`: 扫描唯一标识
- `username`: Instagram用户名
- `scanData`: 爬取的原始数据 (JSON)
- `score`: 账号评分 (0-100)
- `status`: 扫描状态 (PENDING/COMPLETED/FAILED)

### Report (诊断报告表)
- `id`: 报告唯一标识
- `scanId`: 关联的扫描ID
- `scoreBreakdown`: 各维度得分
- `improvements`: 改进建议
- `day1Content`: Day 1完整内容
- `calendarOutline`: 30天日历大纲

## 🔌 API接口

### POST /api/scan
创建新的扫描任务

**请求体:**
```json
{
  "username": "nike",
  "userId": "可选"
}
```

**响应:**
```json
{
  "scanId": "clxxxx",
  "status": "PENDING"
}
```

### GET /api/scan?id={scanId}
查询扫描状态

**响应:**
```json
{
  "id": "clxxxx",
  "username": "nike",
  "status": "COMPLETED",
  "scanData": {...},
  "score": 75
}
```

### POST /api/analyze
生成AI诊断报告

**请求体:**
```json
{
  "scanId": "clxxxx",
  "industry": "餐饮"
}
```

**响应:**
```json
{
  "reportId": "clxxxx",
  "score": 75,
  "grade": "良好"
}
```

### GET /api/analyze?scanId={scanId}
获取诊断报告

**响应:**
```json
{
  "id": "clxxxx",
  "username": "nike",
  "scoreBreakdown": {...},
  "improvements": {...},
  "day1Content": {...},
  "calendarOutline": {...}
}
```

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **AI**: Google Gemini 2.0 Flash
- **爬虫**: Puppeteer
- **部署**: Vercel (推荐)

## ⚠️ 注意事项

### Instagram爬虫
- 仅爬取公开数据,不登录
- 有反爬虫风险,建议添加速率限制
- 生产环境建议使用代理IP池或第三方API服务(如Apify)

### AI成本
- Gemini 2.0 Flash: ~$0.0001/次 (非常低)
- 免费用户限制3次/月可有效控制成本
- 可根据需要切换到OpenAI GPT-4

### 数据库
- Supabase免费版支持500MB存储
- 预计可支持1000+用户的MVP测试

## 📋 待开发功能

- [ ] 结果页面UI (result页面)
- [ ] 用户注册/登录功能
- [ ] 30天日历解锁机制
- [ ] PDF报告导出
- [ ] 真实性检测功能
- [ ] 竞品对标分析
- [ ] 多平台支持 (TikTok、抖音、小红书)

## 🔐 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase项目URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase服务密钥 |
| `DATABASE_URL` | ✅ | PostgreSQL连接字符串 |
| `GOOGLE_GEMINI_API_KEY` | ✅ | Google Gemini API密钥 |
| `OPENAI_API_KEY` | ⚪ | OpenAI API密钥(可选) |
| `ANTHROPIC_API_KEY` | ⚪ | Anthropic API密钥(可选) |

## 📝 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 数据库管理

```bash
# 生成Prisma Client
npx prisma generate

# 同步Schema到数据库
npx prisma db push

# 创建Migration
npx prisma migrate dev

# 查看数据库
npx prisma studio
```

## 📄 许可证

MIT License

---

**AccountDoctor** - 让每个中小企业都拥有专业的社交媒体运营顾问 🚀
