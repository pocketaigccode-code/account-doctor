'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import zh from '@/locales/zh.json'
import en from '@/locales/en.json'
import ja from '@/locales/ja.json'
import ko from '@/locales/ko.json'

type Language = 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 翻译映射 (es, fr, de, pt 暂时fallback到en)
const translations: Record<Language, any> = {
  zh,
  en,
  ja,
  ko,
  es: en,  // 西班牙语暂时使用英文
  fr: en,  // 法语暂时使用英文
  de: en,  // 德语暂时使用英文
  pt: en,  // 葡萄牙语暂时使用英文
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')

  // 从 localStorage 读取语言偏好
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    const validLanguages: Language[] = ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'pt']
    if (savedLanguage && validLanguages.includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // 保存语言偏好到 localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  // 翻译函数 - 支持嵌套键 (e.g., "home.title")
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
