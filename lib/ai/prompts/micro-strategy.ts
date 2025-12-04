/**
 * 微型策略Prompts - 并行执行优化
 * 每个模块独立,Token控制在300-500以内
 */

// ==========================================
// 模块 A: 品牌人设 (Persona)
// 耗时: 3-5秒 | 输出: ~300 tokens
// ==========================================

export const PERSONA_SYSTEM_PROMPT = `LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL text fields must be in English
- This is a strict requirement - no Chinese, Japanese, Korean, or any other language

You are a JSON-only API. Return ONLY valid JSON object, nothing else.

CRITICAL: Your response must start with { and end with }. No text before or after.

Format (MUST use these exact key names):
{
  "archetype": "brand archetype name",
  "tone_voice": "tone description",
  "one_liner_bio": "optimized bio text",
  "analysis_reason": "2-3 sentences explaining what specific content you analyzed (mention specific posts, hashtags, or bio elements) and why you chose this archetype"
}

FORBIDDEN:
- Do NOT use markdown
- Do NOT add explanations outside JSON
- Do NOT use generic statements in analysis_reason

REQUIRED:
- First character must be {
- Last character must be }
- Keys: archetype, tone_voice, one_liner_bio, analysis_reason (exactly these names)
- analysis_reason must mention specific examples from their content
`

export function generatePersonaPrompt(context: {
  category: string
  bio: string
  diagnosis_summary: string
  recent_posts_sample?: string  // Sample of recent post captions
  key_issues?: string[]  // From diagnosis
}): string {
  let prompt = `Category: ${context.category}
Current Bio: "${context.bio}"
Diagnosis: ${context.diagnosis_summary}`

  if (context.recent_posts_sample) {
    prompt += `\nRecent Post Example: "${context.recent_posts_sample}"`
  }

  if (context.key_issues && context.key_issues.length > 0) {
    prompt += `\nKey Issues Found: ${context.key_issues.join('; ')}`
  }

  prompt += `\n\nOutput JSON object with brand persona. Include analysis_reason that mentions specific content you analyzed. Start with { and end with }.`

  return prompt
}

// ==========================================
// 模块 B: 目标受众 (Audience)
// 耗时: 3-5秒 | 输出: ~400 tokens
// ==========================================

export const AUDIENCE_SYSTEM_PROMPT = `LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL text fields (description, pain_point) must be in English
- This is a strict requirement - no Chinese, Japanese, Korean, or any other language

You are a JSON-only API. Return ONLY valid JSON array, nothing else.

CRITICAL: Your response must start with [ and end with ]. No text before or after.

Format - return an array with 2 objects:
[
  {"type":"Main","description":"describe main audience","pain_point":"their main struggle"},
  {"type":"Secondary","description":"describe secondary audience","pain_point":"their main struggle"}
]

FORBIDDEN:
- Do NOT add "Here is the JSON"
- Do NOT use markdown code blocks (no backticks)
- Do NOT add explanations or comments
- Do NOT copy the example values, generate new content based on the category

REQUIRED:
- First character must be [
- Last character must be ]
- Exactly 2 objects
- Keys: type, description, pain_point (exactly these names)
`

export function generateAudiencePrompt(context: {
  category: string
  bio: string
}): string {
  return `Category: ${context.category}
Bio: "${context.bio}"

Output JSON array with 2 audience profiles. Start with [ and end with ].`
}

// ==========================================
// 模块 C: 内容配比 (Content Mix)
// 耗时: 2-3秒 | 输出: ~200 tokens
// ==========================================

export const CONTENT_MIX_SYSTEM_PROMPT = `LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL label fields must be in English
- This is a strict requirement - no Chinese, Japanese, Korean, or any other language

You are a JSON-only API. Return ONLY valid JSON array, nothing else.

CRITICAL: Your response must start with [ and end with ]. No text before or after.

Format (return 4-5 content types based on the category):
[{"label":"Content Type Name","percentage":40},{"label":"Another Type","percentage":30}...]

IMPORTANT - Label Requirements:
- Use industry-specific content type names (NOT generic "Educational/Inspirational")
- Examples by industry:
  * Coffee Shop: "Menu Highlights", "Cafe Vibes", "Customer Stories", "Behind Counter"
  * Gym: "Workout Tips", "Success Stories", "Gym Updates", "Member Spotlight"
  * BBQ Restaurant: "Signature Dishes", "BBQ Secrets", "Customer Reviews", "Events"
  * Sports Brand: "Product Launches", "Athlete Stories", "Training Tips", "Brand Values"
- Keep labels short (2-4 words)
- Be specific to the category, avoid generic terms

FORBIDDEN:
- Do NOT use generic labels like "Educational", "Inspirational" unless truly appropriate
- Do NOT add markdown or explanations

REQUIRED:
- Start with [
- End with ]
- 4-5 objects
- Total percentage = 100
- Labels must be industry-specific
`

export function generateContentMixPrompt(context: {
  category: string
}): string {
  return `Category: ${context.category}

Generate 4-5 industry-specific content types with percentages. Labels must match this industry. Start with [ and end with ].`
}

// ==========================================
// 模块 D: Day 1 爆款文案 (Day 1 Creative)
// 耗时: 5-8秒 | 输出: ~500 tokens
// 依赖: persona (需要在Stage 1完成后执行)
// ==========================================

export const DAY1_SYSTEM_PROMPT = `LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL text fields (title, caption) must be in English
- Exception: hashtags may include local language tags if culturally relevant
- image_gen_prompt MUST be in English for AI image generators
- This is a strict requirement - no Chinese in caption or title

You are a JSON-only API. Return ONLY valid JSON object, nothing else.

CRITICAL: Your response must start with { and end with }. No text before or after.

Format (MUST use these exact key names):
{
  "title": "hook title (max 10 words)",
  "caption": "engaging story (450-500 characters, rich storytelling with emotion and call-to-action)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],
  "image_gen_prompt": "detailed image prompt for AI image generator (50-80 words, specific visual description)"
}

CAPTION REQUIREMENTS:
- Length: 450-500 characters (NOT words!)
- Include: Hook + Story + Emotion + Call-to-action
- Style: Conversational, authentic, brand-aligned
- NO generic phrases, be specific and vivid
- Do NOT include "Day 1" or "第一天" in the caption

FORBIDDEN:
- Do NOT use markdown
- Do NOT add explanations
- Do NOT make caption too short (minimum 300 chars)

IMAGE_GEN_PROMPT REQUIREMENTS:
- Length: 50-80 words
- Describe: Composition, subject, lighting, style, mood
- Be specific for AI image generation (Midjourney/DALL-E style)

REQUIRED:
- First character must be {
- Last character must be }
- Keys: title, caption, hashtags, image_gen_prompt (exactly these names, NOT "visual_concept")
`

export function generateDay1Prompt(context: {
  category: string
  bio: string
  persona: any  // 来自Stage 1
}): string {
  return `
Category: ${context.category}
Bio: "${context.bio}"
Brand Persona: ${context.persona.archetype} (${context.persona.tone})

Create viral Day 1 post JSON.
`
}

// ==========================================
// 模块 E: 30天极简规划 (Month Plan)
// 耗时: 10-15秒 | 输出: ~800 tokens (29条)
// 依赖: content_mix (需要在Stage 1完成后执行)
// ==========================================

export const MONTH_PLAN_SYSTEM_PROMPT = `LANGUAGE REQUIREMENT (CRITICAL):
- You MUST respond in English ONLY for all generated content
- ALL text fields (theme, hook) must be in English
- This is a strict requirement - no Chinese, Japanese, Korean, or any other language

You are a JSON-only API. Return ONLY a valid JSON array.

CRITICAL REQUIREMENTS:
1. Your response must start with [ and end with ]
2. NO text before or after the JSON array
3. NO comments, NO explanations
4. NO line breaks inside string values
5. Use double quotes for all strings
6. Return EXACTLY 29 objects (Day 2 to Day 30)

Format (each object):
{"day":2,"theme":"Short theme","hook":"Brief strategy"}

Example start:
[{"day":2,"theme":"Product Launch","hook":"Announce new collection"},{"day":3,...}]

FORBIDDEN:
- Do NOT add any commentary
- Do NOT use single quotes
- Do NOT break strings across lines
- Do NOT add trailing commas

Keys: day (number), theme (string), hook (string)
`

export function generateMonthPlanPrompt(context: {
  category: string
  content_mix: any  // 来自Stage 1,现在是数组
  persona: any      // 来自Stage 1,确保tone一致
}): string {
  return `
Category: ${context.category}
Brand Tone: ${context.persona.tone || 'Professional and engaging'}
Content Mix: ${JSON.stringify(context.content_mix)}

Generate 29-day plan JSON Array (Day 2-30 only).
IMPORTANT: Return exactly 29 items.
`
}
