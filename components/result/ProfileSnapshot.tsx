/**
 * ProfileSnapshot - 现代化用户资料卡片
 * 重新设计: 卡片式布局,信息层次清晰
 */

interface ProfileSnapshotData {
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
  category_label?: string
  missing_elements?: string[]
  handle?: string
  followers_display?: string
}

interface ProfileSnapshotProps {
  data: ProfileSnapshotData
  t: (key: string) => string
}

export function ProfileSnapshot({ data, t }: ProfileSnapshotProps) {
  const displayHandle = data.username || data.handle || ''
  const hasAIEnhancement = data.category_label !== undefined

  const avatarProxyUrl = data.avatar_url ? `/api/image-proxy?url=${encodeURIComponent(data.avatar_url)}` : null
  const postsWithProxyUrls = data.recent_posts_preview?.map(post => ({
    ...post,
    proxyUrl: post.thumbnail_url ? `/api/image-proxy?url=${encodeURIComponent(post.thumbnail_url)}` : null
  }))

  console.log('[ProfileSnapshot] 头像URL:', data.avatar_url)
  console.log('[ProfileSnapshot] 帖子数量:', data.recent_posts_preview?.length)

  const getActivityStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-600', text: t('result.profile.active') }
      case 'Dormant':
        return { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-600', text: t('result.profile.dormant') }
      case 'Inactive':
        return { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-600', text: t('result.profile.inactive') }
      default:
        return { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-600', text: t('result.profile.inactive') }
    }
  }

  const activityStyle = getActivityStyle(data.activity_status)

  return (
    <div className="bg-white border border-sand-200 p-8 mb-8 shadow-sm">
      {/* === 顶部: 用户身份卡片 === */}
      <div className="flex items-start gap-6 mb-8 pb-8 border-b border-sand-200">
        {/* 头像 */}
        <div className="relative flex-shrink-0">
          {avatarProxyUrl ? (
            <img
              src={avatarProxyUrl}
              alt={data.full_name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-sand-100"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                if (placeholder) placeholder.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-24 h-24 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-sage to-terracotta flex items-center justify-center ${avatarProxyUrl ? 'hidden' : ''}`}>
            <span className="font-serif text-4xl font-bold text-white">
              {data.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          {data.is_verified && (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-3 border-white shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-serif text-3xl font-bold text-charcoal-900">
              {data.full_name}
            </h2>
            {hasAIEnhancement && (
              <span className="bg-sage text-white px-3 py-1 font-sans text-xs font-bold uppercase tracking-wide">
                {data.category_label}
              </span>
            )}
          </div>
          <p className="font-sans text-base text-charcoal-600 mb-4">
            @{displayHandle}
          </p>

          {/* 活跃状态 */}
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center gap-2 ${activityStyle.bg} ${activityStyle.border} border-l-4 px-4 py-2`}>
              <div className={`w-2.5 h-2.5 rounded-full ${activityStyle.color.replace('text-', 'bg-')} animate-pulse`}></div>
              <span className={`font-sans text-sm font-bold ${activityStyle.color}`}>
                {activityStyle.text}
              </span>
            </div>
            <span className="font-sans text-sm text-charcoal-600">
              {t('result.profile.lastPost')}: {data.last_post_date}
            </span>
          </div>
        </div>
      </div>

      {/* === 中部: 数据卡片 === */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {/* 帖子数 */}
        <div className="bg-gradient-to-br from-sage/10 to-sage/5 border-l-4 border-sage p-5">
          <p className="font-sans text-xs text-charcoal-600 mb-2 font-semibold uppercase tracking-wide">{t('result.profile.posts')}</p>
          <p className="font-serif text-3xl font-bold text-charcoal-900">
            {data.post_count !== undefined ? data.post_count.toLocaleString() : '-'}
          </p>
        </div>

        {/* 粉丝数 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-25 border-l-4 border-blue-500 p-5">
          <p className="font-sans text-xs text-charcoal-600 mb-2 font-semibold uppercase tracking-wide">{t('result.profile.followers')}</p>
          <p className="font-serif text-3xl font-bold text-charcoal-900">
            {data.follower_count !== undefined ? (data.follower_count >= 1000000
              ? `${(data.follower_count / 1000000).toFixed(1)}M`
              : data.follower_count >= 1000
              ? `${(data.follower_count / 1000).toFixed(1)}K`
              : data.follower_count.toLocaleString())
              : '-'}
          </p>
        </div>

        {/* 关注数 */}
        <div className="bg-gradient-to-br from-terracotta-light/30 to-terracotta-light/10 border-l-4 border-terracotta p-5">
          <p className="font-sans text-xs text-charcoal-600 mb-2 font-semibold uppercase tracking-wide">{t('result.profile.following')}</p>
          <p className="font-serif text-3xl font-bold text-charcoal-900">
            {data.following_count !== undefined ? data.following_count.toLocaleString() : '-'}
          </p>
        </div>

        {/* 平均点赞 */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-25 border-l-4 border-pink-500 p-5">
          <p className="font-sans text-xs text-charcoal-600 mb-2 font-semibold uppercase tracking-wide">{t('result.profile.avgLikes')}</p>
          <p className="font-serif text-3xl font-bold text-charcoal-900">
            {data.avg_likes.toLocaleString()}
          </p>
        </div>
      </div>

      {/* === 底部: 转化清单 === */}
      {hasAIEnhancement && data.missing_elements && data.missing_elements.length > 0 && (
        <div className="bg-terracotta-light/20 border-l-4 border-terracotta p-6 mb-8">
          <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-4">⚠️ {t('result.profile.optimizationSuggestions')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.missing_elements.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-terracotta/30 p-3">
                <div className="w-6 h-6 bg-terracotta text-white flex items-center justify-center flex-shrink-0 font-sans text-xs font-bold">
                  !
                </div>
                <span className="font-sans text-sm text-charcoal-900 font-medium">
                  {t('result.profile.missing')} {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === 最近内容 === */}
      {data.recent_posts_preview && data.recent_posts_preview.length > 0 && (
        <div>
          <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-4">
            {t('result.profile.recentPosts')}
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {postsWithProxyUrls?.map((post, i) => (
              <div
                key={i}
                className="relative aspect-square bg-sand-100 border border-sand-200 group overflow-hidden hover:border-sage hover:shadow-md transition-all"
              >
                {post.proxyUrl ? (
                  <img
                    src={post.proxyUrl}
                    alt={`Post ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-charcoal-400" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Hover覆盖层 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-3 text-white">
                  {post.type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  )}
                  <div className="font-sans text-xs font-semibold flex items-center gap-3">
                    <span>❤️ {post.likes.toLocaleString()}</span>
                    <span>💬 {post.comments}</span>
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
