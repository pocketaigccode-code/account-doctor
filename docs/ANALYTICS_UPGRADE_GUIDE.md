# Analytics System Upgrade Guide

## 概述

本次升级将统计系统从 localStorage 升级为 Supabase 数据库，支持完整的用户追踪、分组统计和批量管理功能。

## ✨ 新功能

### 追踪能力升级

**之前只能追踪：**
- ✅ 事件类型
- ✅ 点击次数（累计）
- ✅ 最后点击时间

**现在可以追踪：**
- ✅ **谁点击的** - Instagram username 或 audit ID
- ✅ **在哪里点击的** - 页面URL和组件位置
- ✅ **什么时间点击的** - 精确时间戳
- ✅ **会话追踪** - 同一用户的多次访问
- ✅ **完整历史** - 每次点击都单独记录（而不是只有累计数）

### Analysis 页面新功能

- 🔍 **高级筛选** - 按事件类型、用户、日期范围筛选
- 📊 **分组统计** - 按事件类型、用户、页面、日期、组件分组
- ☑️ **批量选择** - 选择多个事件进行批量操作
- 🗑️ **批量删除** - 删除选中的事件
- 📥 **导出CSV** - 导出统计数据为CSV文件
- 🔄 **自动刷新** - 每30秒自动更新数据
- 👥 **用户统计** - 查看独立用户数量

## 📦 部署步骤

### 1. 执行数据库迁移

在 Supabase Dashboard 中执行 SQL：

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 运行以下SQL文件内容：

```bash
# 文件位置
supabase/migrations/create_analytics_events.sql
```

或者直接复制粘贴执行：

```sql
-- Analytics Events Table
-- Tracks all user interactions with buttons and features

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Information
  event_type TEXT NOT NULL,
  event_category TEXT,

  -- User Information
  user_id TEXT,
  session_id TEXT,

  -- Location Information
  page_url TEXT,
  page_path TEXT,
  component_location TEXT,

  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional Data (flexible JSON field)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON analytics_events(page_path);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now
CREATE POLICY "Enable all access for analytics_events" ON analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. 验证表创建成功

在 Supabase **Table Editor** 中检查：
- `analytics_events` 表是否存在
- 所有字段和索引是否正确创建

### 3. 测试API端点

使用以下命令测试API：

```bash
# 测试追踪API（从浏览器控制台或应用中）
fetch('/api/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_type: 'unlock_click',
    user_id: 'test_user',
    component_location: 'test'
  })
})

# 测试查询API
fetch('/api/analytics/events?limit=10')
```

### 4. 访问新的 Analysis 页面

访问 `http://localhost:8173/analysis` 查看新界面：

- 确认数据正常加载
- 测试筛选功能
- 测试分组功能
- 测试导出CSV功能

## 🎯 追踪的事件类型

| 事件类型 | 说明 | 触发位置 |
|---------|------|---------|
| `unlock_click` | 点击"Unlock Full Calendar"按钮 | MosaicCalendar |
| `vip_service_click` | 点击"VIP Service"按钮（打开modal） | MosaicCalendar |
| `modal_option1_click` | Modal中点击"Try Product"选项 | MosaicCalendar Modal |
| `modal_option2_click` | Modal中点击"Managed Service"选项 | MosaicCalendar Modal |

## 📊 数据结构

### analytics_events 表字段

| 字段 | 类型 | 说明 |
|-----|------|------|
| `id` | UUID | 主键 |
| `event_type` | TEXT | 事件类型 |
| `event_category` | TEXT | 事件分类（calendar, service, modal） |
| `user_id` | TEXT | 用户标识（Instagram username 或 audit ID） |
| `session_id` | TEXT | 会话ID |
| `page_url` | TEXT | 完整URL |
| `page_path` | TEXT | URL路径 |
| `component_location` | TEXT | 组件位置 |
| `user_agent` | TEXT | 浏览器信息 |
| `ip_address` | TEXT | IP地址 |
| `referrer` | TEXT | 来源页面 |
| `created_at` | TIMESTAMPTZ | 创建时间 |
| `metadata` | JSONB | 额外元数据 |

## 🔧 API 端点

### POST /api/analytics/track

记录点击事件

**请求体：**
```json
{
  "event_type": "unlock_click",
  "event_category": "calendar",
  "user_id": "username",
  "component_location": "MosaicCalendar",
  "metadata": {}
}
```

### GET /api/analytics/events

查询统计数据

**查询参数：**
- `event_type` - 筛选事件类型
- `user_id` - 筛选用户
- `date_from` - 开始日期
- `date_to` - 结束日期
- `limit` - 返回数量限制
- `offset` - 分页偏移量
- `group_by` - 分组方式（event_type, user_id, page_path, component_location, date）

### DELETE /api/analytics/events

批量删除事件

**请求体：**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

或

```json
{
  "filters": {
    "event_type": "unlock_click",
    "date_before": "2025-01-01"
  }
}
```

## 🔄 向后兼容

系统保持向后兼容：

- ✅ 旧的 trackClick('event_type') 调用仍然有效
- ✅ 数据同时写入 localStorage（作为降级方案）
- ✅ API 调用失败时自动降级到 localStorage

## 🚀 使用示例

### 前端追踪示例

```typescript
import { trackClick } from '@/lib/analytics-tracker'

// 简单调用（向后兼容）
trackClick('unlock_click')

// 完整调用（推荐）
trackClick('unlock_click', {
  user_id: profileData?.username || auditId,
  component_location: 'MosaicCalendar',
  event_category: 'calendar',
  metadata: { additional: 'data' }
})
```

### Analysis 页面功能

**筛选示例：**
- 查看特定用户的所有点击
- 查看某个日期范围内的事件
- 只看 VIP Service 相关的点击

**分组示例：**
- 按事件类型分组 - 看每种事件的数量
- 按用户分组 - 看每个用户的点击次数
- 按日期分组 - 看每天的点击趋势

**批量操作：**
- 选择多个事件批量删除
- 导出筛选后的数据为 CSV

## 📝 注意事项

1. **环境变量检查**
   - 确认 `NEXT_PUBLIC_SUPABASE_URL` 已设置
   - 确认 `SUPABASE_SERVICE_ROLE_KEY` 已设置（用于API）

2. **权限设置**
   - 当前 RLS 策略允许所有操作
   - 生产环境建议限制删除权限

3. **性能优化**
   - 已创建索引优化查询性能
   - 建议定期清理旧数据

4. **数据迁移**
   - localStorage 中的旧数据不会自动迁移
   - 如需迁移，可以手动导出后导入数据库

## 🎉 完成！

升级完成后，你将拥有一个功能完整的分析系统，可以：

- 📊 追踪详细的用户行为
- 🔍 深入分析用户交互模式
- 📈 导出数据进行进一步分析
- 🎯 识别高意向用户（多次点击VIP服务）
- 🚀 优化转化率

如有问题，请检查：
1. Supabase 表是否正确创建
2. 环境变量是否配置正确
3. API 路由是否正常工作
4. 浏览器控制台是否有错误信息
