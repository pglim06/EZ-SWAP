import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MakeOfferModal from '../components/MakeOfferModal'
import RecommendationShelf from '../components/RecommendationShelf'
import {
  Search,
  MapPin,
  Tag,
  Heart,
  LayoutGrid,
  BookOpen,
  Laptop,
  Bed,
  Shirt,
  Wrench,
  Bike,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
  Star,
  Database,
  Loader2,
  MessageCircle,
} from 'lucide-react'

// 1. Mudah.my-style categories
const CATEGORIES = [
  { id: 'All', name: 'All Ads', icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Textbooks', name: 'Textbooks', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'Electronics', name: 'Electronics', icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'Dorm Essentials', name: 'Dorm & Living', icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Fashion', name: 'Fashion & Wear', icon: Shirt, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'Services', name: 'Campus Services', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'Sports', name: 'Bikes & Sports', icon: Bike, color: 'text-teal-600', bg: 'bg-teal-50' },
]

const CONDITIONS = ['All', 'New', 'Used']

// Fallback demo items if backend database is offline or empty
export const FALLBACK_ITEMS = [
  {
    _id: 'sample-1',
    title: 'Engineering Mathematics 1 (Calculus & Algebra)',
    category: 'Textbooks',
    price: 35,
    condition: 'Used',
    location: 'UTM Arked Meranti',
    sellerId: { name: 'Ahmad Faris', averageRating: 4.9, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60' }],
  },
  {
    _id: 'sample-2',
    title: 'Logitech Wireless Silent Mouse M331',
    category: 'Electronics',
    price: 45,
    condition: 'Used',
    location: 'Kolej Rahman Putra (KRP)',
    sellerId: { name: 'Sarah Tan', averageRating: 5.0, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60' }],
  },
  {
    _id: 'sample-3',
    title: 'Rechargeable LED Study Desk Lamp',
    category: 'Dorm',
    price: 20,
    condition: 'New',
    location: 'Kolej Tun Dr Ismail (KTDI)',
    sellerId: { name: 'Wei Ming', averageRating: 4.8, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60' }],
  },
  {
    _id: 'sample-4',
    title: 'Official UTM Corporate Polo Shirt (Size L)',
    category: 'Clothing',
    price: 18,
    condition: 'Used',
    location: 'UTM FABU Building',
    sellerId: { name: 'Nurul Huda', averageRating: 4.7, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' }],
  },
  {
    _id: 'sample-5',
    title: 'Campus Commute Fixed Gear Bicycle',
    category: 'Other',
    price: 120,
    condition: 'Used',
    location: 'Kolej Perdana (KP)',
    sellerId: { name: 'Hafiz Azman', averageRating: 4.9, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60' }],
  },
  {
    _id: 'sample-6',
    title: 'PC & Laptop Dust Cleaning & Repasting Service',
    category: 'Services',
    price: 25,
    condition: 'New',
    location: 'UTM Lingkaran Ilmu',
    sellerId: { name: 'Kevin Lee', averageRating: 5.0, verificationStatus: 'verified' },
    images: [{ imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60' }],
  },
]

export default function Browse() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedOfferListing, setSelectedOfferListing] = useState(null)
  const [showOfferModal, setShowOfferModal] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Remote data state
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUsingLiveDb, setIsUsingLiveDb] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set())
  const [bookmarkError, setBookmarkError] = useState('')

  // Fetch listings from backend API
  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('keyword', search.trim())
      if (selectedCat !== 'All') params.append('category', selectedCat)
      if (selectedCondition !== 'All') params.append('condition', selectedCondition)
      if (minPrice !== '') params.append('minPrice', minPrice)
      if (maxPrice !== '') params.append('maxPrice', maxPrice)
      if (sort) params.append('sort', sort)

      const url = `http://localhost:5000/api/listings?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch from backend')

      const data = await res.json()
      const hasActiveFilters =
        search.trim() !== '' ||
        selectedCat !== 'All' ||
        selectedCondition !== 'All' ||
        minPrice !== '' ||
        maxPrice !== '' ||
        sort !== ''

      if (data.success && Array.isArray(data.listings) && data.listings.length > 0) {
        // Double-check price bounds client-side
        const priceFiltered = data.listings.filter((item) => {
          if (minPrice !== '' && Number(item.price) < Number(minPrice)) return false
          if (maxPrice !== '' && Number(item.price) > Number(maxPrice)) return false
          return true
        })
        setListings(priceFiltered)
        setIsUsingLiveDb(true)
      } else if (data.success && data.total === 0 && !hasActiveFilters) {
        // If DB is completely empty and no filters active, use fallback
        setListings(FALLBACK_ITEMS)
        setIsUsingLiveDb(false)
      } else {
        setListings([])
        setIsUsingLiveDb(true)
      }
    } catch {
      // Offline fallback: client-side filter
      setIsUsingLiveDb(false)
      const filtered = FALLBACK_ITEMS.filter((item) => {
        const matchesSearch =
          !search.trim() ||
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
        const matchesCat =
          selectedCat === 'All' ||
          item.category === selectedCat ||
          (selectedCat === 'Dorm Essentials' && item.category === 'Dorm') ||
          (selectedCat === 'Fashion' && item.category === 'Clothing') ||
          (selectedCat === 'Sports' && item.category === 'Other')
        const matchesCond =
          selectedCondition === 'All' ||
          item.condition === selectedCondition ||
          (selectedCondition === 'Used' && ['Like New', 'Good', 'Fair', 'Poor'].includes(item.condition))
        const matchesMin = minPrice === '' || Number(item.price) >= Number(minPrice)
        const matchesMax = maxPrice === '' || Number(item.price) <= Number(maxPrice)
        return matchesSearch && matchesCat && matchesCond && matchesMin && matchesMax
      })

      // Sort client fallback
      if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price)
      if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price)

      setListings(filtered)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on filter changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, selectedCat, selectedCondition, minPrice, maxPrice, sort])

  // Fetch user bookmarks when logged in
  useEffect(() => {
    if (user?._id) {
      fetch('/api/bookmarks', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.bookmarkedListingIds) {
            setBookmarkedIds(new Set(data.bookmarkedListingIds))
          }
        })
        .catch(() => {})
    } else {
      setBookmarkedIds(new Set())
    }
  }, [user?._id])

  const handleToggleBookmark = async (e, listingId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user?._id) {
      navigate('/login')
      return
    }
    const lid = listingId?.toString()
    if (!lid) return
    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId: lid, userId: user._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not update wishlist')
      setBookmarkError('')
      setBookmarkedIds((prev) => {
        const next = new Set(prev)
        if (data.bookmarked) {
          next.add(lid)
        } else {
          next.delete(lid)
        }
        return next
      })
    } catch (err) {
      setBookmarkError(err.message || 'Could not update wishlist')
    }
  }

  // One-click seed demo listings to MongoDB Atlas
  const handleSeedDatabase = async () => {
    try {
      setSeeding(true)
      const res = await fetch('http://localhost:5000/api/listings/seed?force=true', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchListings()
      }
    } catch (e) {
      console.error('Seeding error:', e)
    } finally {
      setSeeding(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedCat('All')
    setSelectedCondition('All')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCat !== 'All' ||
    selectedCondition !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sort !== 'newest'

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Search Header Banner */}
      <section className="bg-white border-b border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              UTM Campus Marketplace
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Buy, sell & swap preloved items directly with verified university peers.
            </p>
          </div>

          {/* Search bar & filter toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* HCI Enhanced Search Container */}
            <div className="relative flex items-center bg-white border-2 border-slate-200 hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 rounded-2xl shadow-xs transition-all duration-200 w-full md:w-[420px] lg:w-[460px] pl-3.5 pr-1.5 py-1.5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by keywords (e.g. Mathematics, Mouse)..."
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none pr-2 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition mr-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Round Blue Search Button (High Contrast & Visual Affordance) */}
              <button
                type="button"
                onClick={() => fetchListings()}
                title="Search campus listings"
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-xs hover:shadow transition-all duration-150 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4 text-white stroke-[2.5]" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-[46px] px-3.5 border-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Popular Search Tags (HCI Principle: Recognition over Recall) */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap pt-3 text-xs text-slate-500">
          <span className="font-bold text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Popular:
          </span>
          {['Calculus', 'Logitech Mouse', 'Study Lamp', 'UTM Polo', 'Bicycle', 'Monitor'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearch(tag)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium transition cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Collapsible Advanced Filters Bar */}
        {showFilters && (
          <div className="max-w-7xl mx-auto mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
            {/* Condition Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Item Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Conditions' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Price Range (RM)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort Order
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest Listed First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="oldest">Oldest Listed First</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={resetFilters}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Categories Grid (Mudah.my-style) */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explore By Categories
            </span>

            {/* Seed demo items button for quick testing */}
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
            >
              <Database className="w-3 h-3" />
              {seeding ? 'Seeding...' : 'Populate Demo Ads'}
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon
              const isSelected = selectedCat === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'All') {
                      setSelectedCat('All')
                    } else {
                      navigate(`/category/${encodeURIComponent(cat.id)}`)
                    }
                  }}
                  className="flex flex-col items-center group cursor-pointer text-center transition"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                        : `${cat.bg} ${cat.color} border-slate-100 group-hover:scale-105 group-hover:shadow-sm`
                    }`}
                  >
                    <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium line-clamp-1 transition ${
                      isSelected ? 'text-blue-600 font-bold' : 'text-slate-700 group-hover:text-blue-600'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ads Listing Grid */}
      <section className="max-w-7xl mx-auto px-6">
        {/* AI Recommendation Shelf hidden to prevent obstructing filter controls and instant results */}
        {/* {selectedCat === 'All' && !search && (
          <RecommendationShelf
            onMakeOffer={(item) => {
              if (!user) {
                navigate('/login')
                return
              }
              setSelectedOfferListing(item)
              setShowOfferModal(true)
            }}
          />
        )} */}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {selectedCat === 'All' ? 'All Recent Advertisements' : `${selectedCat} Listings`}
            <span className="text-xs text-slate-400 font-normal">({listings.length} items found)</span>
          </h2>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {bookmarkError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            {bookmarkError}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Searching campus listings...</p>
          </div>
        )}

        {/* Product Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => {
              const image =
                item.images && item.images.length > 0
                  ? item.images[0].imageUrl
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
              const sellerName = item.sellerId ? item.sellerId.name : item.seller || 'Verified Student'
              const sellerRating = item.sellerId && item.sellerId.averageRating ? item.sellerId.averageRating : 5.0
              const location = item.location || 'UTM Campus'

              return (
                <div
                  key={item._id || item.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-48 bg-slate-100 overflow-hidden relative">
                      <Link to={`/listings/${item._id || item.id}`}>
                        <img
                          src={image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </Link>
                      <button
                        onClick={(e) => handleToggleBookmark(e, item._id || item.id)}
                        className={`absolute top-3 right-3 p-2 backdrop-blur-sm rounded-full transition cursor-pointer ${
                          bookmarkedIds.has((item._id || item.id)?.toString())
                            ? 'bg-rose-50 text-rose-500 shadow-sm'
                            : 'bg-white/80 text-slate-600 hover:text-rose-500'
                        }`}
                        title={bookmarkedIds.has((item._id || item.id)?.toString()) ? 'Saved in Wishlist' : 'Save to Wishlist'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            bookmarkedIds.has((item._id || item.id)?.toString())
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                      </button>
                      <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                        {item.condition === 'New' ? 'New' : 'Used'}
                      </span>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-blue-600 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" /> {item.category}
                        </span>
                        <span className="text-amber-500 flex items-center gap-0.5 text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {sellerRating.toFixed(1)}
                        </span>
                      </div>

                      <Link to={`/listings/${item._id || item.id}`}>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                          {item.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Seller: <span className="font-medium text-slate-600">{sellerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Price</span>
                      <span className="text-lg font-black text-blue-600">RM {item.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!user) {
                            navigate('/login')
                            return
                          }
                          navigate(`/messages?listingId=${item._id || item.id}`)
                        }}
                        title="Chat with Seller"
                        className="p-2 border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer flex items-center justify-center"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            navigate('/login')
                            return
                          }
                          setSelectedOfferListing(item)
                          setShowOfferModal(true)
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
                      >
                        Make Offer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl mt-4">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">No listings found matching your search</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your keywords, price range, or category filter.</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
      {/* T12: Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => {
          setShowOfferModal(false)
          setSelectedOfferListing(null)
        }}
        listing={selectedOfferListing}
        currentUser={user}
        onOfferSuccess={(order) => {
          setShowOfferModal(false)
          const targetListingId = selectedOfferListing?._id || selectedOfferListing?.id
          if (targetListingId) {
            navigate(`/messages?listingId=${targetListingId}`)
          }
        }}
      />
    </div>
  )
}
