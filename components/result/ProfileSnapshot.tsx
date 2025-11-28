/**
 * ProfileSnapshot - 顶部概览组件 (双速响应)
 * 阶段1: 展示即时数据 (用户信息、统计数据)
 * 阶段2: AI增强数据加载后更新 (category_label, missing_elements)
 */

interface ProfileSnapshotData {
  // === 即时数据 (从Apify直接获取,0延迟) ===
  username?: string
  full_name: string
  avatar_url: string
  is_verified: boolean
  follower_count?: number
  following_count?: number
  post_count?: number
  activity_status: 'Active' | 'Dormant' | 'Inactive'
  last_post_date: string
  avg_likes: number
  recent_posts_preview?: Array<{
    thumbnail_url: string
    type: string
    likes: number
    comments: number
  }>

  // === AI增强数据 (异步加载) ===
  category_label?: string
  missing_elements?: string[]

  // 兼容旧格式
  handle?: string
  followers_display?: string
}

interface ProfileSnapshotProps {
  data: ProfileSnapshotData
}

export function ProfileSnapshot({ data }: ProfileSnapshotProps) {
  // 兼容新旧格式
  const displayHandle = data.username || data.handle || ''
  const hasAIEnhancement = data.category_label !== undefined && data.missing_elements !== undefined

  // 预处理图片URL - 只计算一次
  const avatarProxyUrl = data.avatar_url ? `/api/image-proxy?url=${encodeURIComponent(data.avatar_url)}` : null
  const postsWithProxyUrls = data.recent_posts_preview?.map(post => ({
    ...post,
    proxyUrl: post.thumbnail_url ? `/api/image-proxy?url=${encodeURIComponent(post.thumbnail_url)}` : null
  }))

  // 调试日志
  console.log('[ProfileSnapshot] 头像URL:', data.avatar_url)
  console.log('[ProfileSnapshot] 头像代理URL:', avatarProxyUrl)
  console.log('[ProfileSnapshot] 帖子数量:', data.recent_posts_preview?.length)

  const getActivityStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          color: 'text-sage',
          bg: 'bg-sage/10',
          border: 'border-sage',
          dotBg: 'bg-sage'
        }
      case 'Dormant':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-600',
          dotBg: 'bg-yellow-600'
        }
      case 'Inactive':
        return {
          color: 'text-terracotta',
          bg: 'bg-terracotta-light',
          border: 'border-terracotta',
          dotBg: 'bg-terracotta'
        }
      default:
        return {
          color: 'text-charcoal-600',
          bg: 'bg-sand-100',
          border: 'border-sand-200',
          dotBg: 'bg-charcoal-600'
        }
    }
  }

  const activityStyle = getActivityStyle(data.activity_status)

  return (
    <div className="bg-white border border-sand-200 p-10 mb-8 shadow-sm">
      {/* === 三栏布局 === */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">

        {/* 左: 身份锚点 */}
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {avatarProxyUrl ? (
              <img
                src={avatarProxyUrl}
                alt={data.full_name}
                className="w-20 h-20 rounded-full border-2 border-sand-200 object-cover bg-sand-100"
                onError={(e) => {
                  // 图片加载失败时显示占位符
                  e.currentTarget.style.display = 'none'
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                  if (placeholder) placeholder.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-20 h-20 rounded-full border-2 border-sand-200 bg-sand-100 flex items-center justify-center ${avatarProxyUrl ? 'hidden' : ''}`}>
              <span className="font-serif text-2xl font-bold text-charcoal-600">
                {data.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            {data.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl font-bold text-charcoal-900 mb-1">
              {data.full_name}
            </h2>
            <p className="font-sans text-sm text-charcoal-600 mb-2">
              @{displayHandle}
            </p>
            {hasAIEnhancement ? (
              <span className="inline-block bg-sand-100 border border-sand-200 px-3 py-1 font-sans text-xs text-charcoal-900">
                {data.category_label}
              </span>
            ) : (
              <span className="inline-block bg-sand-50 border border-sand-200 px-3 py-1 font-sans text-xs text-charcoal-600 animate-pulse">
                分析中...
              </span>
            )}
          </div>
        </div>

        {/* 中: 账号统计数据 */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 bg-sand-50 border border-sand-200 p-4">
            <div className="text-center">
              <p className="font-serif text-xl font-bold text-charcoal-900 break-words">
                {data.post_count !== undefined ? data.post_count.toLocaleString() : '-'}
              </p>
              <p className="font-sans text-xs text-charcoal-600 mt-1">帖子</p>
            </div>
            <div className="text-center border-l border-r border-sand-200 px-2">
              <p className="font-serif text-xl font-bold text-charcoal-900 break-words">
                {data.follower_count !== undefined ? (data.follower_count >= 1000000
                  ? `${(data.follower_count / 1000000).toFixed(1)}M`
                  : data.follower_count >= 1000
                  ? `${(data.follower_count / 1000).toFixed(1)}K`
                  : data.follower_count.toLocaleString())
                  : '-'}
              </p>
              <p className="font-sans text-xs text-charcoal-600 mt-1">粉丝</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl font-bold text-charcoal-900 break-words">
                {data.following_count !== undefined ? data.following_count.toLocaleString() : '-'}
              </p>
              <p className="font-sans text-xs text-charcoal-600 mt-1">关注</p>
            </div>
          </div>

          <div>
            <p className="font-sans text-xs text-charcoal-600 mb-2 font-semibold">
              Activity Status
            </p>
            <div className={`inline-flex items-center gap-2 border-2 ${activityStyle.border} ${activityStyle.bg} px-3 py-1.5`}>
              <div className={`w-2 h-2 rounded-full ${activityStyle.dotBg}`}></div>
              <span className={`font-sans text-sm font-bold ${activityStyle.color}`}>
                {data.activity_status}
              </span>
            </div>
            <p className="font-sans text-xs text-charcoal-600 mt-2">
              Last post: {data.last_post_date}
            </p>
          </div>

          <div>
            <p className="font-sans text-xs text-charcoal-600 mb-1 font-semibold">
              Avg. Engagement
            </p>
            <p className="font-sans text-xl font-bold text-charcoal-900">
              ❤️ {data.avg_likes.toLocaleString()} likes
            </p>
          </div>
        </div>

        {/* 右: 商业转化检查 */}
        <div>
          <p className="font-sans text-xs font-bold text-charcoal-900 mb-3">
            Conversion Checklist
          </p>

          {!hasAIEnhancement ? (
            <div className="flex items-center gap-2 text-charcoal-400">
              <div className="w-5 h-5 border-2 border-charcoal-300 border-t-charcoal-600 rounded-full animate-spin"></div>
              <span className="font-sans text-sm">AI分析中...</span>
            </div>
          ) : data.missing_elements && data.missing_elements.length > 0 ? (
            <div className="space-y-2">
              {data.missing_elements.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-terracotta-light border border-terracotta flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-terracotta" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-sans text-sm text-charcoal-800">
                    Missing {item}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sage">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-sans text-sm font-bold">All Set Up ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* === 底部: 视觉足迹 (最近内容预览) === */}
      {data.recent_posts_preview && data.recent_posts_preview.length > 0 && (
        <div className="border-t border-sand-200 pt-6">
          <p className="font-sans text-xs font-bold text-charcoal-900 mb-3">
            Recent Content (Visual Footprint)
          </p>
          <div className="grid grid-cols-5 gap-3">
            {postsWithProxyUrls?.map((post, i) => (
              <div
                key={i}
                className="relative aspect-square bg-sand-100 border border-sand-200 group overflow-hidden"
              >
                {post.proxyUrl ? (
                  <img
                    src={post.proxyUrl}
                    alt={`Post ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时显示占位符
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal-600 opacity-20" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* 覆盖层 (Hover显示) */}
                <div className="absolute inset-0 bg-charcoal-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  {post.type === 'video' && (
                    <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  )}
                  <div className="font-sans text-xs space-y-1">
                    <div>❤️ {post.likes}</div>
                    <div>💬 {post.comments}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
