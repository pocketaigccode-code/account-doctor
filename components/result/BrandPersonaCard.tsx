/**
 * BrandPersonaCard - 卡片式品牌人设分析组件
 * 左侧: Emoji + Archetype + Tags
 * 右侧: Tone & Voice + Optimized Bio
 */

interface BrandPersonaCardProps {
  archetype_name?: string
  archetype?: string // 兼容旧字段
  tone_voice_description?: string
  tone_voice?: string // 兼容旧字段
  tone_keywords?: string[]
  optimized_bio?: string
  one_liner_bio?: string // 兼容旧字段
}

const ARCHETYPE_ICONS: Record<string, string> = {
  'The Indulgent Neighbor': '🥐',
  'The Nurturing Neighbor': '🍜',
  'The Expert': '🎓',
  'The Creator': '🎨',
  'The Caregiver': '💚',
  'The Jester': '🎭',
  'The Explorer': '🧭',
  'The Rebel': '⚡',
  'The Sage': '📚',
  'The Innocent': '🌸',
  'The Ruler': '👑',
  'The Hero': '🦸',
  'The Lover': '💖',
  'The Magician': '✨',
  'The Everyperson': '🤝'
}

// Extract tone keywords from tone_voice text
function extractToneKeywords(tone_voice: string): string[] {
  const keywords = ['warm', 'welcoming', 'cheeky', 'professional', 'friendly',
                    'authentic', 'modern', 'classic', 'bold', 'gentle', 'playful']
  const found: string[] = []
  const lowerText = tone_voice.toLowerCase()

  keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      found.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  })

  return found.slice(0, 3) // Max 3 tags
}

export function BrandPersonaCard({
  archetype_name,
  archetype,
  tone_voice_description,
  tone_voice,
  tone_keywords,
  optimized_bio,
  one_liner_bio
}: BrandPersonaCardProps) {
  const displayArchetype = archetype_name || archetype || 'Brand Persona'
  const displayToneVoice = tone_voice_description || tone_voice || ''
  const displayBio = optimized_bio || one_liner_bio || ''

  const icon = ARCHETYPE_ICONS[displayArchetype] || '✨'
  const tags = tone_keywords || (displayToneVoice ? extractToneKeywords(displayToneVoice) : [])

  return (
    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 px-6 md:px-10">
      {/* 左侧：人设卡片 */}
      <div className="flex-1 text-center md:text-left">
        {/* Emoji with drop shadow */}
        <span className="text-8xl inline-block mb-5" style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.1))' }}>
          {icon}
        </span>

        {/* Archetype Title with Instagram gradient */}
        <h3 className="text-4xl font-extrabold mb-5 tracking-tight">
          <span className="text-gradient-instagram">{displayArchetype}</span>
        </h3>

        {/* Tone & Voice Description */}
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          {displayToneVoice}
        </p>

        {/* Tags - Refined pill design */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="bg-white border border-gray-200 text-charcoal-900 px-5 py-2 text-sm font-semibold rounded-full shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 右侧：暂时保留空间给手机样机（由父组件渲染） */}
      <div className="flex-1 flex justify-center">
        {/* Instagram Profile Mockup will be rendered here by parent component */}
      </div>
    </div>
  )
}
