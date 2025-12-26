const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  // 创建枚举类型和表的 SQL
  const sql = `
-- 创建枚举类型
DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建用户表
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "subscriptionTier" "SubscriptionTier" DEFAULT 'FREE' NOT NULL,
    "scansRemaining" INTEGER DEFAULT 3 NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 创建扫描记录表
CREATE TABLE IF NOT EXISTS "Scan" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "platform" TEXT DEFAULT 'instagram' NOT NULL,
    "username" TEXT NOT NULL,
    "scanData" JSONB,
    "score" INTEGER,
    "status" "ScanStatus" DEFAULT 'PENDING' NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Scan_userId_platform_idx" ON "Scan"("userId", "platform");
CREATE INDEX IF NOT EXISTS "Scan_username_platform_idx" ON "Scan"("username", "platform");

-- 创建诊断报告表
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "scanId" TEXT UNIQUE NOT NULL,
    "userId" TEXT,
    "scoreBreakdown" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "day1Content" JSONB NOT NULL,
    "calendarOutline" JSONB NOT NULL,
    "generatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "expiresAt" TIMESTAMP,
    FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Report_scanId_idx" ON "Report"("scanId");
CREATE INDEX IF NOT EXISTS "Report_userId_idx" ON "Report"("userId");
`;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // 如果 rpc 不存在，尝试直接使用 from 方法测试连接
      console.log('⚠️  RPC 方法不可用，请手动在 Supabase Dashboard 执行 SQL');
      console.log('\n📋 请访问: https://supabase.com/dashboard/project/fjeczvuutqjdvwejnwgl/sql/new');
      console.log('\n复制以下 SQL 并执行:\n');
      console.log(sql);
      return;
    }

    console.log('✅ 数据库初始化成功！');
    console.log('📊 已创建以下表：');
    console.log('  - User (用户表)');
    console.log('  - Scan (扫描记录表)');
    console.log('  - Report (诊断报告表)');

  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
    console.log('\n💡 建议手动在 Supabase Dashboard 执行 SQL');
    console.log('📋 访问: https://supabase.com/dashboard/project/fjeczvuutqjdvwejnwgl/sql/new\n');
  }
}

initDatabase();
