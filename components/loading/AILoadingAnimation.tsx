'use client'

import { useEffect, useState } from 'react'
import './ai-loading.css'

interface LoadingStep {
  title: string
  detail: string
  progress: number
}

interface AILoadingAnimationProps {
  /**
   * 加载步骤（可选）
   * 如果提供，将显示进度条和动态文字
   */
  steps?: LoadingStep[]

  /**
   * 中心图标（可选，默认为⚡️）
   */
  icon?: string | React.ReactNode

  /**
   * 主标题（可选）
   */
  title?: string

  /**
   * 副标题（可选）
   */
  subtitle?: string

  /**
   * 是否显示为全屏遮罩（默认false）
   */
  fullscreen?: boolean

  /**
   * 自定义样式类名
   */
  className?: string

  /**
   * 是否自动播放步骤动画（默认true，仅在提供steps时有效）
   */
  autoPlay?: boolean

  /**
   * 步骤切换间隔时间（ms，默认800-1400随机）
   */
  stepInterval?: number
}

export function AILoadingAnimation({
  steps,
  icon = '⚡️',
  title = 'AI Analyzing...',
  subtitle = 'Please wait while we process your data',
  fullscreen = false,
  className = '',
  autoPlay = true,
  stepInterval
}: AILoadingAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentProgress, setCurrentProgress] = useState(0)

  // 自动播放步骤
  useEffect(() => {
    if (!steps || !autoPlay || steps.length === 0) return

    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
        setCurrentProgress(steps[currentStepIndex + 1].progress)
      }
    }, stepInterval || (Math.random() * 600 + 800))

    return () => clearTimeout(timer)
  }, [currentStepIndex, steps, autoPlay, stepInterval])

  // 当前步骤数据
  const currentStep = steps?.[currentStepIndex]
  const displayProgress = currentStep?.progress ?? currentProgress
  const displayTitle = currentStep?.title ?? title
  const displaySubtitle = currentStep?.detail ?? subtitle

  const content = (
    <div className={`ai-loading-container ${fullscreen ? 'ai-loading-fullscreen' : ''} ${className}`}>
      {/* AI 扫描环 */}
      <div className="scanner-container">
        <div className="scanner-pulse"></div>
        <div className="scanner-ring"></div>
        <div className="scanner-icon">
          {typeof icon === 'string' ? (
            <span style={{ fontSize: '32px' }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>

      {/* 进度条（可选） */}
      {steps && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${displayProgress}%` }}
          ></div>
        </div>
      )}

      {/* 动态文字 */}
      <div className="loading-text-wrap">
        <div className="main-status">{displayTitle}</div>
        <div className="sub-status fade-in">{displaySubtitle}</div>
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    )
  }

  return content
}

/**
 * 简化版加载动画（无步骤，只有转圈）
 */
export function SimpleLoadingSpinner({
  icon = '⚡️',
  text = 'Loading...',
  className = ''
}: {
  icon?: string | React.ReactNode
  text?: string
  className?: string
}) {
  return (
    <div className={`ai-loading-simple ${className}`}>
      <div className="scanner-container scanner-container-small">
        <div className="scanner-pulse"></div>
        <div className="scanner-ring"></div>
        <div className="scanner-icon">
          {typeof icon === 'string' ? (
            <span style={{ fontSize: '20px' }}>{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>
      {text && <p className="loading-text-simple">{text}</p>}
    </div>
  )
}

/**
 * 页面级加载动画（全屏）
 */
export function PageLoadingAnimation({
  title = 'AI Analyzing...',
  subtitle = 'Please wait while we process your data'
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center">
      <AILoadingAnimation
        title={title}
        subtitle={subtitle}
      />
    </div>
  )
}
