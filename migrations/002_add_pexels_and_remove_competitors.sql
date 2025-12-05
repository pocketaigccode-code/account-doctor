-- ============================================
-- Migration 002: 添加Pexels字段并移除竞争对手分析功能
-- ============================================

-- 1. 添加 pexels_query 列到 audits 表
ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS pexels_query TEXT;

-- 添加注释说明
COMMENT ON COLUMN public.audits.pexels_query IS 'AI生成的Pexels图片搜索关键词（英文）';

-- 创建索引（可选，如果需要搜索）
CREATE INDEX IF NOT EXISTS idx_audits_pexels_query ON public.audits(pexels_query)
WHERE pexels_query IS NOT NULL;

-- 2. 删除竞争对手相关的表（如果存在）
DROP TABLE IF EXISTS public.competitor_viral_posts CASCADE;
DROP TABLE IF EXISTS public.competitors CASCADE;

-- 3. 清理可能存在的竞争对手相关JSONB字段数据（可选）
-- 如果diagnosis_card或strategy_section中有竞争对手数据，可以清理
-- UPDATE public.audits
-- SET diagnosis_card = diagnosis_card - 'competitor_analysis'
-- WHERE diagnosis_card ? 'competitor_analysis';

-- UPDATE public.audits
-- SET strategy_section = strategy_section - 'competitor_comparison'
-- WHERE strategy_section ? 'competitor_comparison';

-- 完成
SELECT 'Migration 002 completed successfully!' AS result;
SELECT 'Added: pexels_query column' AS added;
SELECT 'Removed: competitor_viral_posts, competitors tables' AS removed;
