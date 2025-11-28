-- ============================================
-- 简化版迁移脚本 (如果users表已存在)
-- ============================================

-- 创建 audits 表
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  progress INTEGER DEFAULT 0,
  apify_raw_data JSONB,
  profile_snapshot JSONB,
  diagnosis_card JSONB,
  strategy_section JSONB,
  execution_calendar JSONB,
  apify_run_id VARCHAR(255),
  ai_model_used VARCHAR(100),
  generation_time_ms INTEGER,
  error_code VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  user_id UUID
);

-- 创建索引
CREATE INDEX idx_audits_username ON public.audits(username);
CREATE INDEX idx_audits_created_at ON public.audits(created_at DESC);
CREATE INDEX idx_audits_status ON public.audits(status);
CREATE INDEX idx_audits_expires_at ON public.audits(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_audits_username_expires ON public.audits(username, expires_at DESC) WHERE expires_at IS NOT NULL;

-- 自动设置过期时间
CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expires_at
BEFORE INSERT ON public.audits
FOR EACH ROW
EXECUTE FUNCTION set_expires_at();

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audits_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 启用RLS
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "Allow anonymous read audits"
ON public.audits FOR SELECT TO anon USING (true);

CREATE POLICY "Allow service_role all on audits"
ON public.audits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 验证
SELECT 'Audits table created successfully!' AS status;
