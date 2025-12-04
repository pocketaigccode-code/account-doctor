/**
 * InstagramProfileMockup - Instagram主页头部样机预览
 * 模拟真实的Instagram Profile Header，展示优化后的Bio效果
 */

interface InstagramProfileMockupProps {
  username: string
  full_name: string
  avatar_url?: string
  is_verified?: boolean
  category_label?: string
  post_count?: number
  follower_count?: number
  following_count?: number
  bio: string
  website?: string
}

export function InstagramProfileMockup({
  username,
  full_name,
  avatar_url,
  is_verified = false,
  category_label,
  post_count = 0,
  follower_count = 0,
  following_count = 0,
  bio,
  website
}: InstagramProfileMockupProps) {
  // Format numbers
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="max-w-md mx-auto bg-white border-2 border-sand-200 rounded-lg shadow-lg p-6">
      {/* Header: Avatar + Name + Menu */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-sand-100 border-2 border-sand-200 flex-shrink-0 overflow-hidden">
          {avatar_url ? (
            <img src={`/api/image-proxy?url=${encodeURIComponent(avatar_url)}`} alt={username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-charcoal-600">
              {full_name?.charAt(0) || username?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Name + Menu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-sans text-base font-semibold text-charcoal-900 truncate">
              {username}
            </h3>
            {is_verified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="font-sans text-sm text-charcoal-600">{full_name}</p>
        </div>

        {/* Menu Icon */}
        <button className="p-2 hover:bg-sand-50 rounded-md transition-colors">
          <svg className="w-5 h-5 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex justify-start gap-6 mb-4 px-2">
        <div className="text-center">
          <div className="font-sans text-sm font-semibold text-charcoal-900">{formatCount(post_count)}</div>
          <div className="font-sans text-xs text-charcoal-600">posts</div>
        </div>
        <div className="text-center">
          <div className="font-sans text-sm font-semibold text-charcoal-900">{formatCount(follower_count)}</div>
          <div className="font-sans text-xs text-charcoal-600">followers</div>
        </div>
        <div className="text-center">
          <div className="font-sans text-sm font-semibold text-charcoal-900">{formatCount(following_count)}</div>
          <div className="font-sans text-xs text-charcoal-600">following</div>
        </div>
      </div>

      {/* Category Badge */}
      {category_label && (
        <div className="mb-3 px-2">
          <span className="inline-block bg-sand-100 text-charcoal-800 px-3 py-1 font-sans text-xs font-semibold rounded">
            {category_label}
          </span>
        </div>
      )}

      {/* Bio */}
      <div className="mb-4 px-2">
        <p className="font-sans text-sm text-charcoal-900 whitespace-pre-line leading-relaxed">
          {bio}
        </p>
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-blue-600 hover:underline mt-2 inline-block">
            {website}
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button className="flex-1 bg-blue-500 text-white font-sans text-sm font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
          Follow
        </button>
        <button className="flex-1 bg-sand-100 text-charcoal-900 font-sans text-sm font-semibold py-2 px-4 rounded-lg hover:bg-sand-200 transition-colors">
          Message
        </button>
        <button className="bg-sand-100 text-charcoal-900 font-sans text-sm font-semibold py-2 px-4 rounded-lg hover:bg-sand-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button className="bg-sand-100 text-charcoal-900 font-sans text-sm font-semibold py-2 px-3 rounded-lg hover:bg-sand-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Story Highlights Placeholder */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-2">
        {['New', 'Menu', 'Reviews'].map((highlight, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-sand-100 border-2 border-sand-200 flex items-center justify-center">
              <span className="text-xs text-charcoal-600 font-sans font-semibold">{highlight}</span>
            </div>
            <span className="text-xs text-charcoal-600 font-sans">{highlight}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
