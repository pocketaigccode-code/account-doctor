-- 删除旧表（如果需要）
-- DROP TABLE IF EXISTS "User", "Scan", "Report" CASCADE;

-- 创建 audits 表（项目实际使用的表）
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',

  -- 原始数据
  apify_raw_data JSONB,

  -- 即时数据（Fast Lane）
  profile_snapshot JSONB,

  -- AI 生成数据（Slow Lane）
  diagnosis_card JSONB,
  strategy_section JSONB,
  execution_calendar JSONB,

  -- 进度和状态
  progress INTEGER DEFAULT 0,
  error_code TEXT,
  error_message TEXT,

  -- 元数据
  ai_model_used TEXT,
  generation_time_ms INTEGER,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS audits_username_idx ON audits(username);
CREATE INDEX IF NOT EXISTS audits_status_idx ON audits(status);
CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits(created_at);
CREATE INDEX IF NOT EXISTS audits_expires_at_idx ON audits(expires_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
