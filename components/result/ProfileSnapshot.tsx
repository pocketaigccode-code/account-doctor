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
  
}

export function ProfileSnapshot({ data }: ProfileSnapshotProps) {
  const displayHandle = data.username || data.handle || ''
  const hasAIEnhancement = data.category_label !== undefined

  const avatarProxyUrl = data.avatar_url ? `/api/image-proxy?url=${encodeURIComponent(data.avatar_url)}` : null
  const postsWithProxyUrls = data.recent_posts_preview?.map(post => ({
    ...post,
    proxyUrl: post.thumbnail_url ? `/api/image-proxy?url=${encodeURIComponent(post.thumbnail_url)}` : null
  }))

  console.log('[ProfileSnapshot] 头像URL:', data.avatar_url)
  console.log('[ProfileSnapshot] 帖子数量:', data.recent_posts_preview?.length)

  return (
    <section className="snapshot-card section-gap">
      {/* Profile Header - 参考Sidewalk设计 */}
      <div className="profile-header">
        <div className="p-avatar">
          {avatarProxyUrl ? (
            <img
              src={avatarProxyUrl}
              alt={data.full_name}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                if (placeholder) placeholder.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-sage to-terracotta flex items-center justify-center ${avatarProxyUrl ? 'hidden' : ''}`}>
            <span className="font-serif text-3xl font-bold text-white">
              {data.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-info">
          <h3>{data.full_name}</h3>
          <span className="p-handle">@{displayHandle}</span>
          <span className="p-status">
            {data.activity_status} · Last Post: {data.last_post_date}
          </span>
        </div>
      </div>

      {/* Stats Row - 参考Sidewalk 4列统计 */}
      <div className="stats-row">
        <div className="stat-box black">
          <div className="stat-num">{data.post_count !== undefined ? data.post_count.toLocaleString() : '-'}</div>
          <div className="stat-label">Posts</div>
        </div>

        <div className="stat-box blue">
          <div className="stat-num">
            {data.follower_count !== undefined ? (
              data.follower_count >= 1000000
                ? `${(data.follower_count / 1000000).toFixed(1)}M`
                : data.follower_count >= 1000
                ? `${(data.follower_count / 1000).toFixed(1)}K`
                : data.follower_count.toLocaleString()
            ) : '-'}
          </div>
          <div className="stat-label">Followers</div>
        </div>

        <div className="stat-box black">
          <div className="stat-num">
            {data.following_count !== undefined ? data.following_count.toLocaleString() : '-'}
          </div>
          <div className="stat-label">Following</div>
        </div>

        <div className="stat-box pink">
          <div className="stat-num">{data.avg_likes.toLocaleString()}</div>
          <div className="stat-label">Avg Likes</div>
        </div>
      </div>

      {/* Recent Posts Gallery - 参考Sidewalk 5列网格 */}
      {data.recent_posts_preview && data.recent_posts_preview.length > 0 && (
        <>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Recent Posts (Visual Footprint)
          </h4>
          <div className="gallery-grid">
            {postsWithProxyUrls?.slice(0, 5).map((post, i) => (
              <div key={i} className="gallery-img">
                {post.proxyUrl ? (
                  <img
                    src={post.proxyUrl}
                    alt={`Post ${i + 1}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
