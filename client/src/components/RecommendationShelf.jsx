import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Tag, Star, MapPin, ArrowRight, RefreshCw, MessageCircle } from 'lucide-react'
import { fetchPersonalizedRecommendations, getRecentViewIds } from '../utils/viewHistory'
import { useAuth } from '../context/AuthContext'

export default function RecommendationShelf({ onMakeOffer }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState([])
  const [insights, setInsights] = useState('Personalized for you based on campus browsing')
  const [loading, setLoading] = useState(true)

  const loadRecommendations = async () => {
    setLoading(true)
    const data = await fetchPersonalizedRecommendations(user?._id || user?.id, 6)
    if (data && data.recommendations && data.recommendations.length > 0) {
      setRecommendations(data.recommendations)
      if (data.insights) setInsights(data.insights)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRecommendations()
  }, [user])

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              AI Smart Recommendations
            </h2>
            <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              T17 Bonus Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {insights}
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-xl shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Recommended Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((item) => {
          const itemId = item._id || item.id
          const primaryImage =
            item.images && item.images.length > 0
              ? item.images[0].imageUrl
              : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
          const sellerName = item.sellerId?.name || 'UTM Student'
          const rating = item.sellerId?.averageRating ? item.sellerId.averageRating.toFixed(1) : '5.0'

          return (
            <div
              key={itemId}
              className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Thumbnail & Match Pill */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={primaryImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.recommendationScore ? `${item.recommendationScore}% Match` : 'Recommended'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* AI Reason Badge */}
                  {item.recommendationReason && (
                    <div className="text-[10px] text-blue-700 bg-blue-50/90 border border-blue-100 rounded px-1.5 py-0.5 font-medium mb-1.5 truncate">
                      {item.recommendationReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                    <span className="text-blue-600 font-semibold">{item.category}</span>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" /> {rating}
                    </span>
                  </div>

                  <Link to={`/listings/${itemId}`}>
                    <h3 className="font-bold text-slate-800 text-xs line-clamp-2 group-hover:text-blue-600 transition leading-snug">
                      {item.title}
                    </h3>
                  </Link>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-3 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <span className="text-sm font-black text-blue-600">RM {item.price}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/login')
                        return
                      }
                      navigate(`/messages?listingId=${itemId}`)
                    }}
                    title="Chat"
                    className="p-1.5 border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 rounded-lg transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onMakeOffer && onMakeOffer(item)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2 py-1 rounded-lg transition"
                  >
                    Offer
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
