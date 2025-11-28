-- ============================================
-- AccountDoctor 数据库迁移脚本
-- 版本: 001
-- 日期: 2025-01-28
-- 说明: 创建新架构的 audits 表 (双速响应架构)
-- ============================================

-- ============================================
-- 1. 创建 audits 主表
-- ============================================
CREATE TABLE IF NOT EXISTS public.audits (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基础信息
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,  -- 缓存过期时间 (24小时后)

  -- 状态管理
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  -- 可选值: pending | snapshot_ready | analyzing | completed | failed
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Fast Lane 数据 (毫秒级返回)
  apify_raw_data JSONB,           -- Apify原始响应
  profile_snapshot JSONB,          -- 解析后的快照数据
  diagnosis_card JSONB,            -- 诊断卡片

  -- Slow Lane 数据 (异步生成)
  strategy_section JSONB,          -- 策略分析
  execution_calendar JSONB,        -- 30天日历

  -- 元数据
  apify_run_id VARCHAR(255),       -- Apify任务ID
  ai_model_used VARCHAR(100),      -- 使用的AI模型
  generation_time_ms INTEGER,      -- 生成耗时(毫秒)

  -- 错误处理
  error_code VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- 用户关联 (可选,用于付费用户)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- 约束
  CONSTRAINT valid_status CHECK (status IN ('pending', 'snapshot_ready', 'analyzing', 'completed', 'failed'))
);

-- ============================================
-- 2. 创建索引 (优化查询性能)
-- ============================================

-- 用户名索引 (用于缓存查询)
CREATE INDEX IF NOT EXISTS idx_audits_username
ON public.audits(username);

-- 创建时间索引 (用于排序)
CREATE INDEX IF NOT EXISTS idx_audits_created_at
ON public.audits(created_at DESC);

-- 状态索引 (用于过滤)
CREATE INDEX IF NOT EXISTS idx_audits_status
ON public.audits(status);

-- 过期时间索引 (用于缓存检查)
CREATE INDEX IF NOT EXISTS idx_audits_expires_at
ON public.audits(expires_at)
WHERE expires_at IS NOT NULL;

-- 复合索引 (用户名 + 过期时间) - 缓存查询优化
CREATE INDEX IF NOT EXISTS idx_audits_username_expires
ON public.audits(username, expires_at DESC)
WHERE expires_at IS NOT NULL;

-- ============================================
-- 3. 创建 users 表 (如果不存在)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free' NOT NULL,
  -- 可选值: free | pro | enterprise
  credits_remaining INTEGER DEFAULT 3,

  CONSTRAINT valid_subscription CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- ============================================
-- 4. 创建 generated_images 表 (预留)
-- ============================================
CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 30),
  prompt TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_image_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 图片索引
CREATE INDEX IF NOT EXISTS idx_images_audit_id
ON public.generated_images(audit_id);

-- ============================================
-- 5. 创建自动触发器
-- ============================================

-- 触发器函数: 自动设置过期时间为24小时后
CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器到audits表
DROP TRIGGER IF EXISTS trigger_set_expires_at ON public.audits;
CREATE TRIGGER trigger_set_expires_at
BEFORE INSERT ON public.audits
FOR EACH ROW
EXECUTE FUNCTION set_expires_at();

-- 触发器函数: 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器到audits表
DROP TRIGGER IF EXISTS trigger_update_audits_updated_at ON public.audits;
CREATE TRIGGER trigger_update_audits_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 绑定触发器到users表
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. 创建自动清理函数 (定时任务)
-- ============================================

-- 清理过期的audit记录
CREATE OR REPLACE FUNCTION cleanup_expired_audits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.audits
  WHERE expires_at < NOW()
    AND status = 'completed';

  RAISE NOTICE 'Cleaned up expired audits';
END;
$$ LANGUAGE plpgsql;

-- 如果使用Supabase,可以通过Dashboard创建Cron Job:
-- SELECT cron.schedule(
--   'cleanup-expired-audits',
--   '0 * * * *',  -- 每小时整点执行
--   $$SELECT cleanup_expired_audits()$$
-- );

-- ============================================
-- 7. 插入测试数据 (可选)
-- ============================================

-- 取消注释以下代码来插入测试数据
/*
INSERT INTO public.audits (
  username,
  status,
  apify_raw_data,
  profile_snapshot,
  diagnosis_card
) VALUES (
  'test_account',
  'snapshot_ready',
  '{"username": "test_account", "followers": 1000}'::jsonb,
  '{"handle": "@test_account", "followers_display": "1K", "category_label": "测试账号"}'::jsonb,
  '{"score": 75, "summary_title": "测试诊断", "key_issues": ["测试问题1", "测试问题2"]}'::jsonb
);
*/

-- ============================================
-- 8. 权限设置 (Supabase RLS)
-- ============================================

-- 启用行级安全
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- 策略: 允许匿名用户读取audits (用于免费诊断)
DROP POLICY IF EXISTS "Allow anonymous read audits" ON public.audits;
CREATE POLICY "Allow anonymous read audits"
ON public.audits
FOR SELECT
TO anon
USING (true);

-- 策略: 允许service_role完全访问
DROP POLICY IF EXISTS "Allow service_role all on audits" ON public.audits;
CREATE POLICY "Allow service_role all on audits"
ON public.audits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 策略: 允许认证用户访问自己的audits
DROP POLICY IF EXISTS "Allow authenticated users own audits" ON public.audits;
CREATE POLICY "Allow authenticated users own audits"
ON public.audits
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 验证安装
-- ============================================

-- 查看表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audits'
ORDER BY ordinal_position;

-- 查看索引
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'audits';

-- 查看触发器
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'audits';

-- ============================================
-- 迁移完成
-- ============================================

COMMENT ON TABLE public.audits IS 'Instagram账号诊断记录 - 双速响应架构';
COMMENT ON COLUMN public.audits.status IS '状态: pending | snapshot_ready | analyzing | completed | failed';
COMMENT ON COLUMN public.audits.expires_at IS '缓存过期时间 (自动设置为24小时后)';
COMMENT ON COLUMN public.audits.apify_raw_data IS 'Apify完整原始数据';
COMMENT ON COLUMN public.audits.profile_snapshot IS 'Fast Lane解析结果';
COMMENT ON COLUMN public.audits.strategy_section IS 'Slow Lane策略结果';

-- 完成
SELECT 'Migration 001 completed successfully!' AS status;
