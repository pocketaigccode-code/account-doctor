/**
 * TextStrategyDisplay - 纯文本策划案展示组件
 * 简单展示 AI 生成的纯文本策划案,无需复杂解析
 */

interface TextStrategyDisplayProps {
  text: string
}

export function TextStrategyDisplay({ text }: TextStrategyDisplayProps) {
  return (
    <div className="bg-white border border-sand-200 p-10 shadow-sm mb-8">
      <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">
        完整运营策划案
      </h2>

      <div className="prose prose-charcoal max-w-none">
        <pre className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </pre>
      </div>
    </div>
  )
}
