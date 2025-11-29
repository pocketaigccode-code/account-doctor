/**
 * FullStrategyPlan - 完整策划案展示组件
 * 支持章节折叠/展开
 */

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface FullStrategyPlanProps {
  plan: any  // 完整的strategy_plan数据
}

export function FullStrategyPlan({ plan }: FullStrategyPlanProps) {
  const { t } = useLanguage()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['background']))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  if (!plan) return null

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl font-bold text-charcoal-900">
          {t('result.fullStrategy.title')}
        </h2>
        <button
          onClick={() => {
            if (expandedSections.size > 0) {
              setExpandedSections(new Set())
            } else {
              setExpandedSections(new Set(['background', 'competitor', 'users', 'persona', 'pillars', 'schedule', 'kpi']))
            }
          }}
          className="font-sans text-sm text-sage hover:text-charcoal-900 transition-colors"
        >
          {expandedSections.size > 0 ? t('result.fullStrategy.collapseAll') : t('result.fullStrategy.expandAll')}
        </button>
      </div>

      {/* 一、账号背景与运营目标 */}
      <Section
        id="background"
        title={t('result.fullStrategy.sectionBackground')}
        isExpanded={expandedSections.has('background')}
        onToggle={() => toggleSection('background')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">{t('result.fullStrategy.labelBackground')}</h4>
            <div className="bg-sand-50 border border-sand-200 p-4">
              <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
                {plan.background_goal?.background}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-2">{t('result.fullStrategy.labelGoals')}</h4>
            <div className="space-y-2">
              {plan.background_goal?.goals?.map((goal: string, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-sage text-white flex items-center justify-center font-sans text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="font-sans text-sm text-charcoal-800 leading-relaxed flex-1">
                    {goal}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 二、对标账号分析 */}
      <Section
        id="competitor"
        title={t('result.fullStrategy.sectionCompetitor')}
        isExpanded={expandedSections.has('competitor')}
        onToggle={() => toggleSection('competitor')}
      >
        <div className="space-y-6">
          <AnalysisBlock
            title={t('result.fullStrategy.labelChainCompetitors')}
            content={plan.competitor_analysis?.chain_competitors}
          />
          <AnalysisBlock
            title={t('result.fullStrategy.labelInfluencers')}
            content={plan.competitor_analysis?.individual_influencers}
          />
          <AnalysisBlock
            title={t('result.fullStrategy.labelCrossIndustry')}
            content={plan.competitor_analysis?.cross_industry}
          />
          <AnalysisBlock
            title={t('result.fullStrategy.labelStrengths')}
            content={plan.competitor_analysis?.strengths}
            highlight
          />
        </div>
      </Section>

      {/* 三、目标用户画像 */}
      <Section
        id="users"
        title={t('result.fullStrategy.sectionUsers')}
        isExpanded={expandedSections.has('users')}
        onToggle={() => toggleSection('users')}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-sand-50 border border-sand-200 p-6">
            <span className="inline-block bg-charcoal-900 text-white px-3 py-1.5 font-sans text-xs font-bold mb-3">
              {t('result.fullStrategy.labelMainUser')}
            </span>
            <div className="space-y-3">
              <div>
                <h5 className="font-sans text-xs font-bold text-charcoal-900 mb-1">{t('result.fullStrategy.labelDemographics')}</h5>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                  {plan.target_users?.main_user?.demographics}
                </p>
              </div>
              <div>
                <h5 className="font-sans text-xs font-bold text-charcoal-900 mb-1">{t('result.fullStrategy.labelPainPoints')}</h5>
                <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                  {plan.target_users?.main_user?.pain_points}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-sand-50 border border-sand-200 p-6">
            <span className="inline-block bg-sand-200 text-charcoal-900 px-3 py-1.5 font-sans text-xs font-bold mb-3">
              {t('result.fullStrategy.labelSecondaryUser')}
            </span>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
              {plan.target_users?.secondary_user}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-sage/5 border-l-4 border-sage p-5">
          <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-2">{t('result.fullStrategy.labelContentPreference')}</h5>
          <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
            {plan.target_users?.content_preference}
          </p>
        </div>
      </Section>

      {/* 四、账号定位与人设 */}
      <Section
        id="persona"
        title={t('result.fullStrategy.sectionPersona')}
        isExpanded={expandedSections.has('persona')}
        onToggle={() => toggleSection('persona')}
      >
        <div className="space-y-6">
          <div className="bg-sand-50 border border-sand-200 p-6">
            <h4 className="font-serif text-xl font-bold text-charcoal-900 mb-4">
              {plan.persona_design?.account_name}
            </h4>
            <div className="bg-white border border-sand-200 p-4 mb-4">
              <p className="font-sans text-xs text-charcoal-600 mb-1">建议Bio:</p>
              <p className="font-sans text-sm text-charcoal-900 leading-relaxed">
                {plan.persona_design?.bio_suggestion}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-sans text-xs text-charcoal-600">昵称:</span>
                <span className="font-sans font-bold text-charcoal-900 ml-2">
                  {plan.persona_design?.persona_core?.nickname}
                </span>
              </div>
              <div>
                <span className="font-sans text-xs text-charcoal-600">身份:</span>
                <span className="font-sans text-charcoal-900 ml-2">
                  {plan.persona_design?.persona_core?.identity}
                </span>
              </div>
              <div>
                <span className="font-sans text-xs text-charcoal-600">性格:</span>
                <span className="font-sans text-charcoal-900 ml-2">
                  {plan.persona_design?.persona_core?.personality}
                </span>
              </div>
              <div>
                <span className="font-sans text-xs text-charcoal-600">口头禅:</span>
                <span className="font-sans text-charcoal-900 ml-2">
                  "{plan.persona_design?.persona_core?.catchphrase}"
                </span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-3">互动风格</h5>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
              {plan.persona_design?.interaction_style}
            </p>
          </div>
        </div>
      </Section>

      {/* 五、内容栏目规划 */}
      <Section
        id="pillars"
        title={t('result.fullStrategy.sectionPillars')}
        isExpanded={expandedSections.has('pillars')}
        onToggle={() => toggleSection('pillars')}
      >
        <div className="space-y-6">
          {plan.content_pillars?.map((pillar: any, i: number) => (
            <div key={i} className="border border-sand-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif text-lg font-bold text-charcoal-900">
                  栏目{i + 1}: {pillar.name}
                </h4>
                <span className="bg-sage text-white px-3 py-1 font-sans text-xs font-bold">
                  占比 {pillar.percentage}%
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-sans text-xs font-bold text-charcoal-900 mb-1">内容目标:</h5>
                  <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                    {pillar.objective}
                  </p>
                </div>

                <div>
                  <h5 className="font-sans text-xs font-bold text-charcoal-900 mb-1">内容形式:</h5>
                  <p className="font-sans text-sm text-charcoal-800 leading-relaxed">
                    {pillar.format}
                  </p>
                </div>

                <div>
                  <h5 className="font-sans text-xs font-bold text-charcoal-900 mb-2">示例选题:</h5>
                  <div className="space-y-2">
                    {pillar.sample_topics?.map((topic: string, j: number) => (
                      <div key={j} className="bg-sand-50 border-l-4 border-sage px-3 py-2">
                        <p className="font-sans text-sm text-charcoal-900">
                          {topic}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 六、发布排期 */}
      <Section
        id="schedule"
        title={t('result.fullStrategy.sectionSchedule')}
        isExpanded={expandedSections.has('schedule')}
        onToggle={() => toggleSection('schedule')}
      >
        <div className="space-y-6">
          {/* 周度计划表 */}
          <div>
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-3">发布频率与时间</h4>
            <div className="border border-sand-200">
              <table className="w-full">
                <thead className="bg-sand-50">
                  <tr>
                    <th className="font-sans text-xs font-bold text-charcoal-900 p-3 text-left">星期</th>
                    <th className="font-sans text-xs font-bold text-charcoal-900 p-3 text-left">发布时间</th>
                    <th className="font-sans text-xs font-bold text-charcoal-900 p-3 text-left">栏目</th>
                    <th className="font-sans text-xs font-bold text-charcoal-900 p-3 text-left">内容侧重</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.publishing_schedule?.weekly_plan?.map((day: any, i: number) => (
                    <tr key={i} className="border-t border-sand-200">
                      <td className="font-sans text-sm text-charcoal-900 p-3">{day.day}</td>
                      <td className="font-sans text-sm text-charcoal-600 p-3">{day.time}</td>
                      <td className="font-sans text-sm font-semibold text-charcoal-900 p-3">{day.pillar}</td>
                      <td className="font-sans text-sm text-charcoal-800 p-3">{day.content_focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 第一周详细安排 */}
          <div>
            <h4 className="font-sans text-sm font-bold text-charcoal-900 mb-3">第一周详细内容安排</h4>
            <div className="space-y-4">
              {plan.publishing_schedule?.first_week_detail?.map((day: any, i: number) => (
                <div key={i} className="bg-sand-50 border border-sand-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-charcoal-900 text-white px-3 py-1 font-sans text-xs font-bold">
                      第{day.day}天
                    </span>
                    <span className="font-sans text-xs text-charcoal-600">{day.time}</span>
                    <span className="font-sans text-xs text-sage font-semibold">{day.pillar}</span>
                  </div>

                  <h5 className="font-serif text-base font-bold text-charcoal-900 mb-2">
                    {day.topic}
                  </h5>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-sans text-xs text-charcoal-600">目的:</span>
                      <p className="font-sans text-charcoal-800 mt-1 leading-relaxed">
                        {day.objective}
                      </p>
                    </div>
                    <div>
                      <span className="font-sans text-xs text-charcoal-600">人设体现:</span>
                      <p className="font-sans text-charcoal-800 mt-1 leading-relaxed">
                        {day.persona_element}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 七、KPI框架 */}
      <Section
        id="kpi"
        title={t('result.fullStrategy.sectionKpi')}
        isExpanded={expandedSections.has('kpi')}
        onToggle={() => toggleSection('kpi')}
      >
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-sand-50 border border-sand-200 p-5">
            <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-3">用户增长指标</h5>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
              {plan.kpi_framework?.growth_kpis}
            </p>
          </div>

          <div className="bg-sand-50 border border-sand-200 p-5">
            <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-3">内容效果指标</h5>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
              {plan.kpi_framework?.engagement_kpis}
            </p>
          </div>

          <div className="bg-sand-50 border border-sand-200 p-5">
            <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-3">转化链路指标</h5>
            <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
              {plan.kpi_framework?.conversion_kpis}
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}

/**
 * 可折叠章节组件
 */
function Section({ id, title, isExpanded, onToggle, children }: {
  id: string
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-sand-200 pb-6 mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 hover:bg-sand-50 transition-colors"
      >
        <h3 className="font-serif text-xl font-bold text-charcoal-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-charcoal-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * 分析块组件
 */
function AnalysisBlock({ title, content, highlight }: {
  title: string
  content: string
  highlight?: boolean
}) {
  return (
    <div className={`p-5 ${highlight ? 'bg-sage/10 border-l-4 border-sage' : 'bg-sand-50 border border-sand-200'}`}>
      <h5 className="font-sans text-sm font-bold text-charcoal-900 mb-2">{title}</h5>
      <p className="font-sans text-sm text-charcoal-800 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
