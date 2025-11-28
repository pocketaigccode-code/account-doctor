/**
 * AI Prompt Set 2: Strategic Director (首席策略官)
 * 职责: 基于Fast Lane结果生成深度策略和30天日历
 */

export const STRATEGIC_DIRECTOR_SYSTEM_PROMPT = `
# Role
你是一位拥有 10 年经验的资深社交媒体策略总监,专门服务于本地中小商家 (SMBs)。你的目标是将一个普通的 Instagram 账号转化为能够持续获客的品牌资产。

# Task
基于输入信息,生成一份完整且详细的"品牌增长与内容策划案"。

# ⚠️ CRITICAL - JSON 格式要求 (避免解析错误)

**之前的失败都是因为JSON格式错误! 必须严格遵守:**

1. 所有字符串必须用双引号 "
2. 数组元素之间必须有逗号 ,
3. 对象属性之间必须有逗号 ,
4. **最后一个数组元素或对象属性后不要加逗号!** (最常见错误)
5. 不要使用单引号 '

**常见错误示例:**
❌ "target_audience": [{...}, {...},]  ← 最后有逗号
✅ "target_audience": [{...}, {...}]

❌ "month_plan": [{"day": 2, "theme": "...", "idea": "...",}]  ← idea后有逗号
✅ "month_plan": [{"day": 2, "theme": "...", "idea": "..."}]

# Processing Rules
1. **Persona Design (人设设计)** - 必须详细具体:
   - archetype: 结合行业特点,设计独特的品牌人设(如 "The Local Hero Athlete" for Nike)
   - one_liner_bio: 优化的Bio文案(150-200字),必须包含:
     * 品牌定位
     * 核心优势
     * 明确的CTA(行动召唤)
     * 适当的Emoji
   - tone_voice: 详细描述品牌语调和沟通风格(100字以上)
   - 根据行业调整风格:
     * 服务业: 专业与亲切并重
     * 餐饮: 诱惑与氛围感
     * 零售: 品味与生活方式
     * 运动品牌: 充满力量、简洁有力、以数据说话

2. **Target Audience (目标受众)** - 必须详细分析:
   - Main 主要受众:
     * description: 详细描述(150字),包含年龄、职业、消费习惯、兴趣爱好
     * pain_point: 核心痛点详细说明(100字)
   - Secondary 次要受众:
     * description: 详细描述(150字)
     * pain_point: 核心痛点详细说明(100字)

3. **Content Mix (内容配比)** - 必须合理且详细:
   - 生成3-4个内容类型
   - label 必须详细说明内容类型(不少于10字)
   - percentage 总和必须=100
   - 根据行业调整:
     * 餐饮: 40% Visual ASMR (视觉诱惑菜品特写) + 30% Social Proof (顾客评价) + 30% BTS (制作过程)
     * 服务: 35% Results (成果案例) + 35% Expertise (专业知识) + 30% Community (社区互动)
     * 运动品牌: 40% Performance & Product (专业装备+功能讲解) + 30% Athlete Stories (运动员故事+口碑) + 30% Community & Lifestyle (城市运动生活方式+活动)

4. **30-Day Calendar (智能日历)**:
   - **Day 1 (明天)**: 必须是"Ready-to-Post"级别,包含:
     * title: Hook标题,吸引眼球(15-25字)
     * caption: 完整文案(**300-500字**,必须包含):
       - 开场钩子(引发共鸣或好奇)
       - 品牌故事或价值主张
       - 社交证明或数据
       - 明确的CTA(行动召唤)
       - 适当的Emoji
     * hashtags: **15个标签数组**(大中小热度混合,必须包含本地标签和行业标签)
     * image_gen_prompt: 高质量英文生图提示词(**150-200字**,详细描述场景、光线、构图、色调、风格)
   - **Day 2-30**: 每天提供详细的 theme 和 idea
     * theme: 策略标签(如 "Social Proof", "Product Showcase")
     * idea: 具体创意点子(50-80字,可直接执行)

5. **Tone & Quality**:
   - 专业、鼓励性、直接点出商业价值 (Not just "likes", but "sales")
   - 所有描述必须具体,避免空洞建议
   - 数据和百分比必须合理

# Output Format
必须输出为严格的 JSON 格式,不包含Markdown标记:

{
  "strategy_section": {
    "brand_persona": {
      "archetype": "String (e.g., 'The Friendly Neighbor', 'The Artisan', 'The Local Hero')",
      "one_liner_bio": "String (优化后的Bio建议,包含Emoji和CTA)",
      "tone_voice": "String (描述品牌语调)"
    },
    "target_audience": [
      {
        "type": "Main",
        "description": "String (主要受众描述)",
        "pain_point": "String (他们的痛点)"
      },
      {
        "type": "Secondary",
        "description": "String (次要受众描述)",
        "pain_point": "String (他们的痛点)"
      }
    ],
    "content_mix_chart": [
      {"label": "内容类型1", "percentage": 40},
      {"label": "内容类型2", "percentage": 30},
      {"label": "内容类型3", "percentage": 30}
    ]
  },
  "execution_calendar": {
    "day_1_detail": {
      "title": "String (Hook标题)",
      "caption": "String (完整文案,200字左右,包含Emoji和行动召唤)",
      "hashtags": ["#tag1", "#tag2", "#LocalTag", ...共10个],
      "image_gen_prompt": "String (高质量英文生图提示词,描述场景、光线、构图、色调)"
    },
    "month_plan": [
      {"day": 2, "theme": "Social Proof", "idea": "Repost a customer story"},
      {"day": 3, "theme": "Product Showcase", "idea": "Close-up of best seller"},
      ... (共29天)
    ]
  }
}

# Important Notes
- 输出必须是纯JSON,不要包含\`\`\`json标记
- image_gen_prompt必须是详细的英文描述,用于AI生图
- hashtags必须包含本地标签(基于Bio或用户名推断城市)
- month_plan要有逻辑性,不要随机排列
`

/**
 * 生成Strategic Director的用户提示词
 */
export function generateStrategyPrompt(
  profileSnapshot: any,
  rawBio: string
): string {
  const snapshot = profileSnapshot.profile_snapshot
  const diagnosis = profileSnapshot.diagnosis_card

  return `
请为以下账号生成完整的增长策略:

=== 当前诊断 ===
- 行业类别: ${snapshot.category_label}
- 评分: ${diagnosis.score}/100 (${diagnosis.score >= 70 ? '良好' : diagnosis.score >= 50 ? '中等' : '需改进'})
- 诊断总结: ${diagnosis.summary_title}
- 活跃状态: ${snapshot.activity_status}
- 粉丝规模: ${snapshot.followers_display}
- 平均互动: ${snapshot.avg_likes} likes

=== 主要问题 ===
${diagnosis.key_issues.map((issue: string, i: number) => `${i + 1}. ${issue}`).join('\n')}

=== 账号信息 ===
- 品牌名称: ${snapshot.full_name}
- 用户名: ${snapshot.handle}
- Bio原文: ${rawBio || '(空)'}
- 缺失元素: ${snapshot.missing_elements.join(', ') || '无'}

=== 策略要求 ===
1. 设计符合"${snapshot.category_label}"行业特点的品牌人设
2. 针对"${diagnosis.key_issues[0]}"这个核心问题,提供解决方案
3. 生成30天内容日历,Day 1必须包含完整的文案和生图提示词
4. 所有内容必须适合中文本地市场

请按照系统提示词中的JSON格式输出策略方案。
`
}

/**
 * 智能降级方案 (基于行业模板)
 */
export function getStrategyFallback(category: string, snapshot: any) {
  const INDUSTRY_TEMPLATES: Record<string, any> = {
    '咖啡店': {
      strategy_section: {
        brand_persona: {
          archetype: 'The Community Hub',
          one_liner_bio: '你的社区咖啡驿站 ☕ | 本地烘焙 | 周一至周日 7am-6pm',
          tone_voice: '温暖、真诚、接地气'
        },
        target_audience: [
          {
            type: 'Main',
            description: '城市白领和远程工作者',
            pain_point: '需要舒适的工作环境和优质咖啡提神'
          },
          {
            type: 'Secondary',
            description: '周末社交人群',
            pain_point: '寻找有氛围感的聚会场所'
          }
        ],
        content_mix_chart: [
          { label: '视觉诱惑(产品特写)', percentage: 40 },
          { label: '社区故事(顾客分享)', percentage: 30 },
          { label: '幕后花絮(制作过程)', percentage: 30 }
        ]
      },
      execution_calendar: {
        day_1_detail: {
          title: '你的晨间能量站',
          caption: `☕ 早安!\n\n每一杯咖啡背后都是一个故事。从精选咖啡豆到完美萃取,我们用心对待每一个细节,只为给你带来一天的好心情。\n\n这里不仅有咖啡,更有温度。欢迎来店里坐坐,让我们成为你的日常陪伴。\n\n📍 就在你家附近 | 周一至周日 7am-6pm\n👉 点击Bio链接预订座位\n\n#本地咖啡 #社区咖啡馆 #精品咖啡 #咖啡爱好者 #早餐推荐 #工作空间 #城市生活 #手冲咖啡 #拿铁艺术 #咖啡时光`,
          hashtags: ['#本地咖啡', '#社区咖啡馆', '#精品咖啡', '#咖啡爱好者', '#早餐推荐', '#工作空间', '#城市生活', '#手冲咖啡', '#拿铁艺术', '#咖啡时光'],
          image_gen_prompt: 'A warm, inviting coffee shop interior during golden hour. Soft natural light streaming through large windows, highlighting a perfectly crafted latte with heart-shaped latte art on a wooden table. Cozy atmosphere with plants and warm tones. Professional food photography style, shallow depth of field, Instagram aesthetic.'
        },
        month_plan: [
          { day: 2, theme: 'Social Proof', idea: '转发一条顾客好评' },
          { day: 3, theme: 'Product', idea: '招牌咖啡特写' },
          { day: 4, theme: 'BTS', idea: '咖啡师制作过程' },
          { day: 5, theme: 'Community', idea: '常客故事' },
          { day: 6, theme: 'Menu', idea: '新品预告' },
          { day: 7, theme: 'Engagement', idea: '投票: 最爱的咖啡类型?' },
          // ... 继续生成到30天
        ]
      }
    },
    '餐厅': {
      // 类似结构...
    },
    '美甲店': {
      // 类似结构...
    }
  }

  // 生成完整的30天计划
  const template = INDUSTRY_TEMPLATES[category] || INDUSTRY_TEMPLATES['咖啡店']

  // 填充Day 2-30
  if (template.execution_calendar.month_plan.length < 29) {
    const themes = ['Social Proof', 'Product', 'BTS', 'Community', 'Promo', 'Engagement']

    for (let day = template.execution_calendar.month_plan.length + 2; day <= 30; day++) {
      const theme = themes[(day - 2) % themes.length]
      template.execution_calendar.month_plan.push({
        day,
        theme,
        idea: `${theme}相关内容创意`
      })
    }
  }

  return template
}
