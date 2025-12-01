'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReportData {
  id: string
  username: string
  scoreBreakdown: {
    total: number
    grade: string
    content_quality: number
    engagement_health: number
    account_vitality: number
    growth_potential: number
    audience_match: number
  }
  improvements: {
    issues: string[]
    urgent_action: string
  }
  day1Content: {
    caption: string
    hashtags: string[]
    image_suggestion: string
    best_time: string
  }
  calendarOutline: any
}

function ResultPageContent() {
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scoreAnimation, setScoreAnimation] = useState(0)

  useEffect(() => {
    if (!reportId) {
      setError('Missing report ID')
      setLoading(false)
      return
    }

    fetch(`/api/analyze?id=${reportId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setReport(data)
          animateScore(data.scoreBreakdown.total)
        }
      })
      .catch(() => setError('Failed to fetch report'))
      .finally(() => setLoading(false))
  }, [reportId])

  const animateScore = (targetScore: number) => {
    let current = 0
    const increment = targetScore / 40
    const timer = setInterval(() => {
      current += increment
      if (current >= targetScore) {
        setScoreAnimation(targetScore)
        clearInterval(timer)
      } else {
        setScoreAnimation(Math.floor(current))
      }
    }, 20)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-sand-200 border-t-charcoal-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-sans text-sm text-charcoal-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white border border-sand-200 p-10 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 bg-terracotta-light border border-terracotta flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">Failed to load report</h2>
          <p className="font-sans text-sm text-charcoal-600 mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-6 hover:bg-charcoal-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const score = scoreAnimation || report.scoreBreakdown.total
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981'
    if (s >= 60) return '#3B82F6'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-sand-200">
        <div className="max-w-5xl mx-auto px-8 py-5 flex justify-between items-center">
          <h1 className="font-serif text-charcoal-900 text-xl font-bold">AccountDoctor</h1>
          <button
            onClick={() => (window.location.href = '/')}
            className="text-charcoal-600 hover:text-charcoal-900 text-sm font-sans font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Section 1: The Diagnosis */}
        <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-8">Diagnosis Results</h2>

          <div className="flex items-start gap-16">
            {/* Total Score Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-44 h-44">
                <svg className="transform -rotate-90 w-44 h-44">
                  <circle cx="88" cy="88" r="80" stroke="#e6e2d6" strokeWidth="12" fill="none" />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke={getScoreColor(score)}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-serif text-5xl font-bold text-charcoal-900">{score}</div>
                  <div className="font-sans text-sm text-charcoal-600 mt-1">/ 100</div>
                </div>
              </div>
              <div className="text-center mt-4">
                <div className="inline-block bg-sand-100 px-4 py-1.5 border border-sand-200">
                  <span className="font-sans text-sm font-semibold text-charcoal-900">{report.scoreBreakdown.grade}</span>
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="flex-1">
              <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-4">Critical Issues</h3>
              <div className="space-y-3">
                {report.improvements.issues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="flex gap-3 items-start bg-sand-50 border border-sand-200 p-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-terracotta text-white flex items-center justify-center font-sans text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="font-sans text-sm text-charcoal-800 leading-relaxed flex-1">{issue}</p>
                  </div>
                ))}
              </div>

              {/* Urgent Action */}
              <div className="mt-6 bg-terracotta-light border-l-4 border-terracotta p-5">
                <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">Most Urgent</h4>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed">{report.improvements.urgent_action}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Growth Strategy (Content Mix) */}
        <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">Custom Growth Strategy</h2>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-sans text-base font-bold text-charcoal-900">Product Showcase</h3>
                <span className="font-sans text-sm text-charcoal-600">40%</span>
              </div>
              <div className="w-full bg-sand-100 h-3">
                <div className="bg-sage h-3" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-sans text-base font-bold text-charcoal-900">Lifestyle</h3>
                <span className="font-sans text-sm text-charcoal-600">30%</span>
              </div>
              <div className="w-full bg-sand-100 h-3">
                <div className="bg-sage h-3" style={{ width: '30%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-sans text-base font-bold text-charcoal-900">User-Generated Content</h3>
                <span className="font-sans text-sm text-charcoal-600">20%</span>
              </div>
              <div className="w-full bg-sand-100 h-3">
                <div className="bg-sage h-3" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-sans text-base font-bold text-charcoal-900">Educational Content</h3>
                <span className="font-sans text-sm text-charcoal-600">10%</span>
              </div>
              <div className="w-full bg-sand-100 h-3">
                <div className="bg-sage h-3" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-sand-50 border border-sand-200 p-6">
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-3">Strategy Analysis</h4>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              Recommend increasing lifestyle content to 30% to enhance audience emotional connection. Keep product showcase as core (40%), while incorporating 20% user-generated content for social proof. Regularly publish educational content (10%) to establish brand expertise.
            </p>
          </div>
        </div>

        {/* Section 3: Content Preview */}
        <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">Content Preview & Analysis</h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Left: Image Preview */}
            <div>
              <div className="relative aspect-square bg-gradient-to-br from-sand-100 to-sand-200 border border-sand-200 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-24 h-24 text-charcoal-600 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="relative z-10 bg-white border-2 border-charcoal-900 px-6 py-3">
                  <span className="font-serif text-xl font-bold text-charcoal-900">LOGO</span>
                </div>
              </div>
              <div className="mt-4 bg-sand-50 border border-sand-200 p-4">
                <h4 className="font-sans text-xs font-bold text-charcoal-900 mb-2">Image Suggestion</h4>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed">{report.day1Content.image_suggestion}</p>
              </div>
            </div>

            {/* Right: Caption & Analysis */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">Generated Caption</h3>
                <div className="bg-sand-50 border border-sand-200 p-5">
                  <p className="font-sans text-sm text-charcoal-900 leading-relaxed whitespace-pre-wrap">
                    {report.day1Content.caption}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">Recommended Hashtags</h3>
                <div className="flex flex-wrap gap-2">
                  {report.day1Content.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-sand-100 border border-sand-200 px-3 py-1.5 font-sans text-xs text-charcoal-900"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-sage/10 border-l-4 border-sage p-5">
                <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">AI Analysis</h4>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                  This content combines emotional resonance with product showcasing, using lifestyle scenarios to reduce commercial feel. Recommended posting time is {report.day1Content.best_time}, when audience activity is highest, with an estimated engagement boost of 25-40%.
                </p>
              </div>

              <div className="bg-sand-50 border border-sand-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-sage" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-sans text-xs font-bold text-charcoal-900">Best Posting Time</h4>
                </div>
                <p className="font-sans text-base font-bold text-charcoal-900">{report.day1Content.best_time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Smart Calendar */}
        <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
          <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">Smart Content Calendar</h2>

          {/* 7-Day Calendar Grid */}
          <div className="grid grid-cols-7 gap-4 mb-8">
            {/* Day 1 - Ready to Post */}
            <div className="border-2 border-sage p-4 bg-white">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">Day 1</div>
              <div className="aspect-square bg-sand-100 mb-2 flex items-center justify-center">
                <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-sans text-xs font-semibold text-charcoal-900 mb-1">Ready to Post</h4>
              <p className="font-sans text-xs text-charcoal-600 line-clamp-2">{report.day1Content.caption.substring(0, 40)}...</p>
            </div>

            {/* Day 2-7 - Planned */}
            {[2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="border border-sand-200 p-4 bg-sand-50 opacity-60">
                <div className="font-sans text-xs font-bold text-charcoal-600 mb-2">Day {day}</div>
                <div className="aspect-square bg-sand-200 mb-2 blur-sm"></div>
                <h4 className="font-sans text-xs font-semibold text-charcoal-600 mb-1">Planned</h4>
                <div className="space-y-1">
                  <div className="h-2 bg-sand-200 blur-sm"></div>
                  <div className="h-2 bg-sand-200 blur-sm w-3/4"></div>
                </div>
              </div>
            ))}
          </div>

          {/* 14-30 Days Preview */}
          <div className="grid grid-cols-7 gap-4 mb-8">
            {Array.from({ length: 7 }, (_, i) => i + 8).map((day) => (
              <div key={day} className="border border-sand-200 p-3 bg-sand-50 opacity-40">
                <div className="font-sans text-xs text-charcoal-600 mb-2">Day {day}</div>
                <div className="aspect-square bg-sand-200 blur-md"></div>
              </div>
            ))}
          </div>

          {/* CTA Overlay */}
          <div className="bg-sand-100 border-2 border-charcoal-900 p-8 text-center">
            <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">Unlock Full 30-Day Plan</h3>
            <p className="font-sans text-sm text-charcoal-600 mb-6 max-w-md mx-auto">
              Get the complete content calendar with daily posting suggestions, optimal times, and professional captions
            </p>
            <button className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-8 hover:bg-charcoal-800 transition-colors">
              Sign Up Free to Unlock
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-sand-200 border-t-charcoal-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-sans text-sm text-charcoal-600">Loading...</p>
        </div>
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  )
}
