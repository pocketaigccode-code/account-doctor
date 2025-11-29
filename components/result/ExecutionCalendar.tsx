/**
 * ExecutionCalendar - 30天执行日历组件
 * Day 1完整展示, Day 2-30锁定状态
 */

interface ExecutionCalendarProps {
  calendar: {
    day_1_detail: {
      title: string
      caption: string
      hashtags: string[]
      image_gen_prompt: string
    }
    month_plan: Array<{
      day: number
      theme: string
      idea: string
    }>
  }
  t: (key: string) => string
}

export function ExecutionCalendar({ calendar, t }: ExecutionCalendarProps) {
  if (!calendar || !calendar.day_1_detail) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Day 1 - 完整展示 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          {t('result.contentPreview')}
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          {/* 左: 图片预览 */}
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
              <h4 className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.imagePrompt')}</h4>
              <p className="font-sans text-xs text-charcoal-800 leading-relaxed">
                {calendar.day_1_detail.image_gen_prompt}
              </p>
            </div>
          </div>

          {/* 右: 文案与分析 */}
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">{t('result.generatedCaption')}</h3>
              <div className="bg-sand-50 border border-sand-200 p-5">
                <p className="font-sans text-sm text-charcoal-900 leading-relaxed whitespace-pre-wrap">
                  {calendar.day_1_detail.caption}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-3">{t('result.recommendedTags')}</h3>
              <div className="flex flex-wrap gap-2">
                {calendar.day_1_detail.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-sand-100 border border-sand-200 px-3 py-1.5 font-sans text-xs text-charcoal-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-sage/10 border-l-4 border-sage p-5">
              <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">{t('result.aiAnalysis')}</h4>
              <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                {t('result.aiAnalysisDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 30天智能日历 */}
      <div className="bg-white border border-sand-200 p-10 shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900 mb-6">
          {t('result.calendar.title')}
        </h2>

        {/* Day 1-7 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {/* Day 1 - 准备发布 */}
          <div className="border-2 border-sage p-4 bg-white">
            <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} 1 {t('result.calendar.dayUnit')}</div>
            <div className="aspect-square bg-sand-100 mb-2 flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-sans text-xs font-semibold text-charcoal-900 mb-1">{t('result.calendar.readyToPublish')}</h4>
            <p className="font-sans text-xs text-charcoal-600 line-clamp-2">
              {calendar.day_1_detail.caption.substring(0, 40)}...
            </p>
          </div>

          {/* Day 2-7 - 已规划 */}
          {calendar.month_plan.slice(0, 6).map((day) => (
            <div key={day.day} className="border border-sand-200 p-4 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-2"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>

        {/* Day 8-14 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {calendar.month_plan.slice(6, 13).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>

        {/* Day 15-21 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {calendar.month_plan.slice(13, 20).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>

        {/* Day 22-28 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {calendar.month_plan.slice(20, 27).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
        </div>

        {/* Day 29-30 */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {calendar.month_plan.slice(27, 29).map((day) => (
            <div key={day.day} className="border border-sand-200 p-3 bg-sand-50">
              <div className="font-sans text-xs font-bold text-charcoal-900 mb-2">{t('result.calendar.day')} {day.day} {t('result.calendar.dayUnit')}</div>
              <div className="aspect-square bg-sand-200 mb-1"></div>
              <h4 className="font-sans text-xs font-semibold text-sage mb-1">{t('result.calendar.planned')}</h4>
              <p className="font-sans text-xs text-charcoal-800 line-clamp-2">{day.theme}</p>
            </div>
          ))}
          {/* 填充空格 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`empty-${i}`} className="invisible"></div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-sand-100 border-2 border-charcoal-900 p-8 text-center">
          <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-3">
            {t('result.calendar.unlockTitle')}
          </h3>
          <p className="font-sans text-sm text-charcoal-600 mb-6 max-w-md mx-auto">
            {t('result.calendar.unlockDesc')}
          </p>
          <button className="bg-charcoal-900 text-white font-sans font-semibold py-3 px-8 hover:bg-charcoal-800 transition-colors">
            {t('result.calendar.unlockButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
