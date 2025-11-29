# UI修复清单

## 问题汇总

### 1. 模块显示顺序错误
**当前**: Persona → Audience → Mix → Day1 → Calendar
**期望**: Persona → **Mix** → **Audience** → Day1 → Calendar

**原因**: StrategySection.tsx组件的渲染顺序不对

**修复**: 调整JSX渲染顺序

---

### 2. 转圈动画不明显
**问题**: 双层转圈动画太细,不明显

**修复**:
- 增加边框宽度: `border-8` → `border-12`
- 增加对比度: 使用更鲜艳的颜色
- 增加动画大小: `w-48 h-48` → `w-56 h-56`

---

### 3. 日历"已规划"状态缺失
**问题**: 只有Day 2-7显示"已规划",Day 8-30没有状态文字

**修复**: ExecutionCalendar.tsx 给所有Day 2-30添加"已规划"标签

---

### 4. 中英文混合显示
**问题**: 部分英文,部分中文

**修复**:
- 全局改为中文
- 导航栏添加语言切换按钮

---

## 修复步骤

### Step 1: 调整StrategySection渲染顺序

文件: `components/result/StrategySection.tsx`

```typescript
// 正确顺序
return (
  <div className="space-y-8">
    {/* 1. Persona */}
    {strategy.strategy_section?.brand_persona && <PersonaCard />}

    {/* 2. Content Mix (交换位置!) */}
    {strategy.strategy_section?.content_mix_chart && <ContentMixCard />}

    {/* 3. Audience (交换位置!) */}
    {strategy.strategy_section?.target_audience && <AudienceCard />}
  </div>
)
```

### Step 2: 增强转圈动画

```typescript
// 更粗的边框
<div className="border-12 border-transparent border-t-sage"></div>

// 更鲜艳的颜色
border-t-[#6fa88e]  // 更亮的绿色
border-t-[#e06744]  // 更亮的橙色
```

### Step 3: 日历状态标签

```typescript
{calendar.month_plan.slice(0, 6).map((day) => (
  <div>
    <div>第 {day.day} 天</div>
    <div className="aspect-square blur-sm"></div>
    <h4>已规划</h4>  {/* ✅ 添加这行 */}
    <p>{day.theme}</p>
  </div>
))}
```

### Step 4: 中文化

```typescript
// 标题改为中文
"Your Brand Persona" → "品牌人设"
"Content Mix Strategy" → "内容配比策略"
"Target Audience" → "目标受众"
```

---

## 实施检查清单

- [ ] 调整StrategySection模块顺序
- [ ] 增强所有转圈动画(边框+颜色+大小)
- [ ] 日历所有天数添加"已规划"标签
- [ ] 全局中文化
- [ ] 添加语言切换按钮
- [ ] 测试完整流程
