'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const languages = [
  { code: 'zh', label: '中文简体' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  const handleSelectLanguage = (code: string) => {
    setLanguage(code as 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 当前语言显示按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-sand-300 rounded bg-white hover:bg-sand-50 transition-colors"
      >
        <span className="font-sans text-sm font-medium text-charcoal-900">
          {currentLanguage.label}
        </span>
        <svg
          className={`w-4 h-4 text-charcoal-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-sand-300 rounded shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`w-full px-4 py-2 text-left font-sans text-sm transition-colors flex items-center justify-between ${
                language === lang.code
                  ? 'bg-sand-100 text-charcoal-900 font-semibold'
                  : 'text-charcoal-600 hover:bg-sand-50'
              }`}
            >
              <span>{lang.label}</span>
              {language === lang.code && (
                <svg className="w-4 h-4 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
