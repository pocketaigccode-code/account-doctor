'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function Home() {
  const router = useRouter()
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError(t('home.errorRequired'))
      return
    }

    setIsLoading(true)

    try {
      console.log('🚀 [新架构] 开始诊断账号:', username)

      // 调用新的Fast Lane API
      const response = await fetch('/api/audit/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.ui_message || errorData.message || t('home.errorFailed'))
      }

      const data = await response.json()
      console.log('✅ [Fast Lane] 快照数据已获取:', {
        auditId: data.audit_id,
        score: data.diagnosis_card?.score,
        cacheHit: data.cache_hit
      })

      // 打印完整数据到控制台
      console.log('📦 [完整响应数据]:', data)
      console.log('👤 [即时数据 - instant_data]:', data.instant_data)
      console.log('📊 [诊断卡片 - diagnosis_card]:', data.diagnosis_card)
      console.log('⏱️ [性能指标]:', data.performance)

      // 跳转到新的结果页
      router.push(`/audit/${data.audit_id}`)

    } catch (err) {
      setError((err as Error).message || t('common.error'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-5xl mx-auto px-8 py-5 flex justify-between items-center">
          <h1 className="font-serif text-charcoal-900 text-xl font-bold">{t('common.appName')}</h1>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-5xl font-bold text-charcoal-900 mb-6 leading-tight tracking-tight">
            {t('home.title')}
          </h1>

          <p className="font-sans text-lg text-charcoal-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>

          {/* Input Form */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('home.inputPlaceholder')}
                  disabled={isLoading}
                  className="w-full px-5 py-4 text-base border-2 border-charcoal-900 bg-white text-charcoal-900 placeholder:text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-charcoal-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                />
              </div>

              {error && (
                <div className="bg-terracotta-light border-l-4 border-terracotta p-4 text-left">
                  <p className="text-sm text-charcoal-800 font-sans">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-charcoal-900 text-white font-sans font-semibold text-base py-4 px-8 hover:bg-charcoal-800 transition-colors disabled:bg-charcoal-600 disabled:cursor-not-allowed border-none"
                style={{ backgroundColor: isLoading ? '#666666' : '#191919', color: '#ffffff' }}
              >
                {isLoading ? t('home.analyzingButton') : t('home.startButton')}
              </button>

              {isLoading && (
                <div className="text-center mt-6">
                  <div className="inline-block bg-white border-2 border-sand-300 px-8 py-6">
                    <p className="text-xs font-sans font-bold text-charcoal-900 mb-4 uppercase tracking-widest">{t('home.analyzing.title')}</p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sage">✓</span>
                        <span className="text-charcoal-900">{t('home.analyzing.step1')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <div className="w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-charcoal-900 font-medium">{t('home.analyzing.step2')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-sans">
                        <span className="text-sand-400">○</span>
                        <span className="text-charcoal-400">{t('home.analyzing.step3')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">{t('home.features.feature1Title')}</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              {t('home.features.feature1Desc')}
            </p>
          </div>

          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">{t('home.features.feature2Title')}</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              {t('home.features.feature2Desc')}
            </p>
          </div>

          <div className="bg-white p-8 border border-sand-200 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">{t('home.features.feature3Title')}</h3>
            <p className="font-sans text-sm text-charcoal-600 leading-relaxed">
              {t('home.features.feature3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="font-sans text-xs text-charcoal-600">
            {t('home.footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
