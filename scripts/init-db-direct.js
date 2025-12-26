require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');
  console.log('📝 使用 Supabase Management API...\n');

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

  console.log('✅ SQL 语句已准备好\n');
  console.log('📋 请按以下步骤操作：\n');
  console.log('1. 访问 Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/fjeczvuutqjdvwejnwgl/sql/new\n');
  console.log('2. 复制下方 SQL 语句');
  console.log('3. 粘贴到 SQL Editor');
  console.log('4. 点击 "Run" 按钮执行\n');
  console.log('=' .repeat(80));
  console.log(sql);
  console.log('=' .repeat(80));
  console.log('\n💡 或者，SQL 已保存到文件: scripts/schema.sql');

  // 保存 SQL 到文件
  const fs = require('fs');
  fs.writeFileSync('scripts/schema.sql', sql.trim());
  console.log('✅ 已保存\n');
}

initDatabase();
