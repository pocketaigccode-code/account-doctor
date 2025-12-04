/**
 * InstagramPostMockup - iPhone手机壳 + Instagram帖子样机
 * 带光效背景的手机预览，展示Day 1内容的实际效果
 */

interface InstagramPostMockupProps {
  username: string
  avatar_url?: string
  image_url?: string  // AI生成的图片（如果有）
  caption: string
  hashtags: string[]
  likes?: number
  comments?: number
  showGlowEffect?: boolean
}

export function InstagramPostMockup({
  username,
  avatar_url,
  image_url,
  caption,
  hashtags,
  likes = 0,
  comments = 0,
  showGlowEffect = true
}: InstagramPostMockupProps) {
  // Generate random engagement if not provided
  const displayLikes = likes || Math.floor(Math.random() * 200) + 120
  const displayComments = comments || Math.floor(Math.random() * 40) + 15

  return (
    <div className="relative py-12">
      {/* 光效背景 */}
      {showGlowEffect && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      )}

      {/* iPhone 外壳 */}
      <div className="relative mx-auto w-[390px] aspect-[9/19.5] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[55px] p-3 shadow-2xl transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-300">
        {/* iPhone Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-9 bg-black rounded-[19px] z-10"></div>

        {/* iPhone Screen */}
        <div className="relative w-full h-full bg-white rounded-[45px] overflow-hidden">
          {/* Status Bar */}
          <div className="h-12 bg-white flex items-center justify-between px-8 pt-2">
            <span className="font-sans text-xs font-semibold text-charcoal-900">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <svg className="w-4 h-4 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <svg className="w-4 h-4 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
            </div>
          </div>

          {/* Instagram Top Bar */}
          <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button>
                <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-sans text-sm font-semibold text-charcoal-900">{username}</span>
            </div>
            <button>
              <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          {/* Post Image */}
          <div className="w-full aspect-square bg-gradient-to-br from-sand-100 to-sand-200 flex items-center justify-center relative">
            {image_url ? (
              <img src={image_url} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <svg className="w-20 h-20 text-charcoal-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="bg-white border-2 border-charcoal-900 px-4 py-2 inline-block">
                  <span className="font-serif text-sm font-bold text-charcoal-900">AI Image Here</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <svg className="w-6 h-6 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>

          {/* Caption and Hashtags */}
          <div className="px-4 py-3 bg-white overflow-y-auto" style={{ maxHeight: '200px' }}>
            <div className="flex items-start gap-2 mb-2">
              <span className="font-sans text-xs text-charcoal-600">
                Liked by <span className="font-semibold text-charcoal-900">sarah_chen</span> and <span className="font-semibold text-charcoal-900">{displayLikes} others</span>
              </span>
            </div>
            <div className="mb-2">
              <span className="font-sans text-sm font-semibold text-charcoal-900 mr-2">{username}</span>
              <span className="font-sans text-sm text-charcoal-800 line-clamp-3">{caption}</span>
            </div>
            {hashtags && hashtags.length > 0 && (
              <div className="font-sans text-sm text-blue-600 line-clamp-2">
                {hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
              </div>
            )}
            <div className="mt-2">
              <span className="font-sans text-xs text-charcoal-500">View all {displayComments} comments</span>
            </div>
            <div className="mt-1">
              <span className="font-sans text-xs text-charcoal-400">2 hours ago</span>
            </div>
          </div>

          {/* Bottom Nav Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t border-gray-100 flex items-center justify-around">
            <svg className="w-6 h-6 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div className="w-6 h-6 rounded-full bg-sand-200 border border-charcoal-600"></div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-black/30 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
