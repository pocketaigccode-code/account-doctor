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