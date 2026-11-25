import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MakeOfferModal from '../components/MakeOfferModal'
import { FALLBACK_ITEMS } from './Browse'
import {
  Search,
  MapPin,
  Tag,
  ArrowLeft,
  ArrowUpDown,
  RotateCcw,
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  PlusCircle,
  Loader2,
  BookOpen,
  Laptop,
  Bed,
  Shirt,
  Wrench,
  Bike,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Lock,
  Layers,
  CheckSquare,
  Square,
  Shuffle,
} from 'lucide-react'

// Category definitions and subcategory chips (Mudah.my-style)
export const CATEGORY_CONFIG = {
  Textbooks: {
    id: 'Textbooks',
    name: 'Textbooks',
    displayName: 'Textbooks & Study Materials',
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    subcategories: [
      'All Textbooks',
      'Engineering Maths',
      'Calculus',
      'Computer Science',
      'Physics',
      'Chemistry',
      'Lecture Notes',
    ],
  },
  Electronics: {
    id: 'Electronics',
    name: 'Electronics',
    displayName: 'Electronics & Gadgets',
    icon: Laptop,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    subcategories: [
      'All Electronics',
      'Laptops & PC',
      'Monitors',
      'Keyboards & Mice',
      'Calculators',
      'Audio & Earphones',
      'Chargers & Cables',
    ],
  },
  'Dorm Essentials': {
    id: 'Dorm Essentials',
    name: 'Dorm Essentials',
    displayName: 'Dorm & Living Essentials',
    icon: Bed,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    subcategories: [
      'All Dorm',
      'Desk Lamps',
      'Table Fans',
      'Mattress & Bedding',
      'Storage & Racks',
      'Kettles & Cookware',
    ],
  },
  Fashion: {
    id: 'Fashion',
    name: 'Fashion',
    displayName: 'Fashion & Wear',
    icon: Shirt,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    subcategories: [
      'All Fashion',
      'UTM Corporate Polo',
      'Baju Kurung',
      'Hoodies & Jackets',
      'Sneakers & Shoes',
      'Bags & Backpacks',
    ],
  },
  Services: {
    id: 'Services',
    name: 'Services',
    displayName: 'Campus Services & Gigs',
    icon: Wrench,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    subcategories: [
      'All Services',
      'Printing & Binding',
      'PC & Phone Repair',
      'Tutoring & Proofreading',
      'Campus Carpool',
      'Event Photography',
    ],
  },
  Sports: {
    id: 'Sports',
    name: 'Sports',
    displayName: 'Bikes & Sports Gear',
    icon: Bike,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    subcategories: [
      'All Sports',
      'Campus Bicycles',
      'Badminton Rackets',
      'Football / Futsal',
      'Gym & Fitness',
    ],
  },
}

const ALL_CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG)

const CAMPUS_LOCATIONS = [
  'Entire UTM Campus',
  'UTM Arked Meranti',
  'UTM Arked Cengal',
  'KDSE / KRP Dorms',
  'KTDI / KTR / KTC',
  'FABU / FKE / FKT Faculty',
  'UTM Library (PSZ)',
]

const CONDITIONS = ['All', 'New', 'Used']

export default function CategoryPage() {
  const { category: rawCategoryParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Match category or normalize
  const decodedParam = decodeURIComponent(rawCategoryParam || '')
  let currentKey = ALL_CATEGORY_KEYS.find(
    (k) => k.toLowerCase() === decodedParam.toLowerCase()
  )
  if (!currentKey) {
    if (decodedParam === 'Dorm') currentKey = 'Dorm Essentials'
    else if (decodedParam === 'Clothing') currentKey = 'Fashion'
    else if (decodedParam === 'Other') currentKey = 'Sports'
    else currentKey = 'Textbooks'
  }

  const currentCategory = CATEGORY_CONFIG[currentKey]

  // Filter & Search states
  const [keywordInput, setKeywordInput] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')
  const [selectedArea, setSelectedArea] = useState('Entire UTM Campus')
  const [selectedCondition, setSelectedCondition] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [titleOnly, setTitleOnly] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState(currentCategory.subcategories[0])

  // Remote data state
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  // Auth & Offer modal states
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [selectedOfferListing, setSelectedOfferListing] = useState(null)

  // When URL parameter changes, reset subcategory and search
  useEffect(() => {
    setSelectedSubcategory(CATEGORY_CONFIG[currentKey].subcategories[0])
    setKeywordInput('')
    setActiveKeyword('')
  }, [currentKey])

  // Fetch listings for this category
  const fetchCategoryListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('category', currentKey)
      if (activeKeyword.trim()) params.append('keyword', activeKeyword.trim())
      if (selectedCondition !== 'All') params.append('condition', selectedCondition)
      if (minPrice !== '') params.append('minPrice', minPrice)
      if (maxPrice !== '') params.append('maxPrice', maxPrice)
      if (sort) params.append('sort', sort)

      const url = `http://localhost:5000/api/listings?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch from backend')

      const data = await res.json()
      if (data.success && Array.isArray(data.listings)) {
        // Enforce strict client-side price bounds
        let filtered = data.listings.filter((item) => {
          if (minPrice !== '' && Number(item.price) < Number(minPrice)) return false
          if (maxPrice !== '' && Number(item.price) > Number(maxPrice)) return false
          if (selectedArea !== 'Entire UTM Campus' && item.location && !item.location.toLowerCase().includes(selectedArea.toLowerCase().replace('utm ', ''))) {
            return false
          }
          if (titleOnly && activeKeyword.trim()) {
            return item.title.toLowerCase().includes(activeKeyword.toLowerCase().trim())
          }
          return true
        })

        // Normalize condition in items
        filtered = filtered.map((it) => ({
          ...it,
          condition: it.condition === 'New' ? 'New' : 'Used',
        }))

        setListings(filtered)
      } else {
        setListings([])
      }
    } catch {
      // Fallback: match from FALLBACK_ITEMS
      const filtered = FALLBACK_ITEMS.filter((item) => {
        const matchesCat =
          item.category === currentKey ||
          (currentKey === 'Dorm Essentials' && item.category === 'Dorm') ||
          (currentKey === 'Fashion' && item.category === 'Clothing') ||
          (currentKey === 'Sports' && item.category === 'Other')

        if (!matchesCat) return false

        const matchesKeyword =
          !activeKeyword.trim() ||
          item.title.toLowerCase().includes(activeKeyword.toLowerCase()) ||
          item.category.toLowerCase().includes(activeKeyword.toLowerCase())

        const matchesCond =
          selectedCondition === 'All' ||
          item.condition === selectedCondition ||
          (selectedCondition === 'Used' && ['Like New', 'Good', 'Fair', 'Poor'].includes(item.condition))

        const matchesMin = minPrice === '' || Number(item.price) >= Number(minPrice)
        const matchesMax = maxPrice === '' || Number(item.price) <= Number(maxPrice)

        return matchesKeyword && matchesCond && matchesMin && matchesMax
      }).map((it) => ({
        ...it,
        condition: it.condition === 'New' ? 'New' : 'Used',
      }))

      if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price)
      if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price)
      if (sort === 'shuffle') {
        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]]
        }
      }

      setListings(filtered)
    } finally {
      setLoading(false)
    }
  }

  // Shuffle currently displayed category listings
  const handleShuffleListings = () => {
    setListings((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
  }

  // Trigger fetch whenever filters or active keyword change
  useEffect(() => {
    fetchCategoryListings()
  }, [currentKey, activeKeyword, selectedArea, selectedCondition, minPrice, maxPrice, sort, titleOnly])

  // Handle Search button click
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setActiveKeyword(keywordInput)
  }

  // Handle subcategory chip click
  const handleSubcategoryClick = (sub) => {
    setSelectedSubcategory(sub)
    if (sub.startsWith('All ')) {
      setKeywordInput('')
      setActiveKeyword('')
    } else {
      setKeywordInput(sub)
      setActiveKeyword(sub)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setKeywordInput('')
    setActiveKeyword('')
    setSelectedArea('Entire UTM Campus')
    setSelectedCondition('All')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setTitleOnly(false)
    setSelectedSubcategory(currentCategory.subcategories[0])
  }

  const hasActiveFilters =
    activeKeyword !== '' ||
    selectedArea !== 'Entire UTM Campus' ||
    selectedCondition !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sort !== 'newest' ||
    titleOnly

  const IconComponent = currentCategory.icon

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* ─── MUDAH.MY STYLE INTEGRATED FILTER BOX ───────────────────────── */}
      <section className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto">
          {/* Main Filter Card (Mudah.my Card Layout) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Row 1: Area Dropdown, Category Dropdown, Keyword Input + Big Red SEARCH button */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Location Selector */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      {CAMPUS_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="md:col-span-3">
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={currentKey}
                      onChange={(e) => navigate(`/category/${encodeURIComponent(e.target.value)}`)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
                    >
                      {ALL_CATEGORY_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {CATEGORY_CONFIG[k].displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Keyword Input */}
                <div className="md:col-span-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder={`Search anything in ${currentCategory.name}...`}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {keywordInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setKeywordInput('')
                          setActiveKeyword('')
                        }}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Mudah-style Red SEARCH Button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-[#e02424] hover:bg-[#c81e1e] active:scale-98 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Secondary Options & Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={titleOnly}
                      onChange={(e) => setTitleOnly(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="font-medium text-slate-700">Search title only</span>
                  </label>

                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span>
                    <span>For sale (UTM peer-to-peer)</span>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                  </button>
                )}
              </div>

              {/* Row 3: Integrated Price Range, Condition, and Sort Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-xl">
                {/* Price From */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Price From (RM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min Price"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Price To */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Price To (RM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max Price"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Item Condition */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Condition
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'All Conditions' : c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" /> Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="newest">Newest Listed First</option>
                    <option value="shuffle">🔀 Shuffled / Random</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="oldest">Oldest Listed First</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ─── BREADCRUMBS & HEADING (Mudah.my Style) ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3">
        {/* Breadcrumb row */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link to="/browse" className="hover:text-blue-600 transition font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-600 font-medium">UTM Campus</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{currentCategory.name}</span>
        </nav>

        {/* Category Result Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{currentCategory.displayName} For Sale In UTM</span>
            <span className="text-slate-400 font-normal text-base sm:text-lg">
              | Found {listings.length} Results.
            </span>
          </h1>

          <Link
            to="/create-listing"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Post Ad in {currentCategory.name}
          </Link>
        </div>
      </section>

      {/* ─── SUBCATEGORY QUICK FILTER CHIPS (Mudah.my Icons/Chips Bar) ────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {currentCategory.subcategories.map((sub) => {
            const isActive = selectedSubcategory === sub
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleSubcategoryClick(sub)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#e02424] text-white border-[#e02424] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : currentCategory.color}`} />
                <span>{sub}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ─── TABS & SORT ROW (Mudah.my Tab Bar) ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-4">
        <div className="border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="border-b-2 border-[#e02424] text-[#e02424] font-black text-xs pb-3 uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>ALL ({listings.length})</span>
            </button>
            <span className="text-slate-400 text-xs pb-3 hidden sm:inline">
              Verified UTM Peer Listings
            </span>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleShuffleListings}
              title="Shuffle category listings randomly"
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-600" />
              <span>Shuffle</span>
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="shuffle">🔀 Shuffled / Random</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── LISTINGS GRID ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">
              Searching {currentCategory.displayName}...
            </p>
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconComponent className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No Listings Found in {currentCategory.name}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              There are currently no active advertisements matching your search and filter criteria in this category.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Clear Filters
              </button>
              <Link
                to="/create-listing"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                Post the First Ad in {currentCategory.name}
              </Link>
            </div>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => {
              const image =
                item.images && item.images.length > 0
                  ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].imageUrl)
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
                    {/* Image & Condition Tag */}
                    <div className="h-48 bg-slate-100 overflow-hidden relative">
                      <Link to={`/listings/${item._id || item.id}`}>
                        <img
                          src={image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </Link>

                      {/* Condition Badge (New / Used only) */}
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.condition === 'New' ? 'New' : 'Used'}
                      </span>

                      {/* Reserved Badge if applicable */}
                      {item.status === 'reserved' && (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          Reserved
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Category & Location */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {location}
                        </span>
                      </div>

                      {/* Title */}
                      <Link to={`/listings/${item._id || item.id}`}>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition">
                          {item.title}
                        </h3>
                      </Link>

                      {/* Price */}
                      <div className="mt-2.5 flex items-baseline gap-1">
                        <span className="text-lg font-black text-blue-600">RM {item.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Seller & Action Buttons */}
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="font-medium truncate max-w-[120px]">{sellerName}</span>
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{typeof sellerRating === 'number' ? sellerRating.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowAuthModal(true)
                            return
                          }
                          setSelectedOfferListing(item)
                          setShowOfferModal(true)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition cursor-pointer text-center"
                      >
                        Make Offer
                      </button>

                      <button
                        onClick={() => {
                          if (!user) {
                            setShowAuthModal(true)
                            return
                          }
                          navigate(`/messages?listingId=${item._id || item.id}`)
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Chat
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Guest Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Account Required</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                You need to be registered and signed in to make offers or chat with student sellers on EZ Swap UTM.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                to="/login"
                className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-xs"
              >
                Register or Sign In
              </Link>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 py-2.5 transition cursor-pointer"
              >
                Continue Browsing as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      <MakeOfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        listing={selectedOfferListing}
        currentUser={user}
        onOfferSuccess={() => {
          setShowOfferModal(false)
          navigate(`/messages?listingId=${selectedOfferListing?._id || selectedOfferListing?.id}`)
        }}
      />
    </div>
  )
}
