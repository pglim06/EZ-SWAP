import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Search,
    Tag,
    Heart,
    LayoutGrid,
    BookOpen,
    Laptop,
    Bed,
    Shirt,
    Wrench,
    Sparkles,
    Loader2,
    PackageOpen,
    PlusCircle
} from 'lucide-react'

// 分类与 Mongoose Listing 模型中的 enum 保持一致
const CATEGORIES = [
    { id: 'All', name: 'All Ads', icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Textbooks', name: 'Textbooks', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'Electronics', name: 'Electronics', icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'Dorm', name: 'Dorm & Living', icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Clothing', name: 'Fashion & Wear', icon: Shirt, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'Services', name: 'Campus Services', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
]

export default function Browse() {
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCat, setSelectedCat] = useState('All')

    // 从真实后端 API 获取数据库所有活跃商品
    useEffect(() => {
        const fetchListings = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/listings')
                const data = await res.json()
                if (res.ok) {
                    setListings(data)
                }
            } catch (err) {
                console.error('Failed to load listings:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchListings()
    }, [])

    // 过滤逻辑
    const filtered = listings.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
        const matchesCat = selectedCat === 'All' || item.category === selectedCat
        return matchesSearch && matchesCat
    })

    return (
        <div className="min-h-screen bg-slate-50 pb-16">

            {/* 顶部搜索栏与 Banner */}
            <section className="bg-white border-b border-slate-200 py-6 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            UTM Campus Marketplace <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">Live Ads</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Buy, sell & swap preloved items directly with verified campus peers.</p>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by keywords (e.g. Textbook, Calculator)..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition shadow-xs"
                        />
                    </div>
                </div>
            </section>

            {/* 分类图标金刚区 */}
            <section className="max-w-7xl mx-auto px-6 py-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explore By Categories
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {CATEGORIES.map((cat) => {
                            const IconComp = cat.icon
                            const isSelected = selectedCat === cat.id

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCat(cat.id)}
                                    className="flex flex-col items-center group cursor-pointer text-center transition"
                                >
                                    <div
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                            : `${cat.bg} ${cat.color} border-slate-100 group-hover:scale-105 group-hover:shadow-sm`
                                            }`}
                                    >
                                        <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>
                                    <span
                                        className={`text-xs mt-2 font-medium line-clamp-1 transition ${isSelected
                                            ? 'text-blue-600 font-bold'
                                            : 'text-slate-700 group-hover:text-blue-600'
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

            {/* 商品展示网格 */}
            <section className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                        {selectedCat === 'All' ? 'All Live Campus Advertisements' : `${selectedCat} Listings`}
                        <span className="text-xs text-slate-400 font-normal ml-2">({filtered.length} items found)</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Loading marketplace items from campus...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                        <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800 mb-1">No Active Listings Yet</h3>
                        <p className="text-xs text-slate-500 mb-4">Be the first student to post an advertisement!</p>
                        <Link
                            to="/create-listing"
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
                        >
                            <PlusCircle className="w-4 h-4" /> Post Free Ad Now
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((item) => {
                            const coverImg = item.images && item.images.length > 0
                                ? item.images[0].imageUrl
                                : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';
                            const seller = item.sellerId || {};

                            return (
                                <div
                                    key={item._id}
                                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
                                >
                                    <div>
                                        <Link to={`/listings/${item._id}`} className="block h-48 bg-slate-100 overflow-hidden relative">
                                            <img
                                                src={coverImg}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:text-red-500 transition"
                                            >
                                                <Heart className="w-4 h-4" />
                                            </button>
                                            <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                                                {item.condition}
                                            </span>
                                        </Link>

                                        <div className="p-4">
                                            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-1">
                                                <Tag className="w-3.5 h-3.5" /> {item.category}
                                            </div>
                                            <Link to={`/listings/${item._id}`}>
                                                <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                            <div className="text-[11px] text-slate-400">
                                                Seller: <span className="font-medium text-slate-600">{seller.name || 'Verified Student'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block">Price</span>
                                            <span className="text-lg font-black text-blue-600">RM {item.price}</span>
                                        </div>
                                        <Link
                                            to={`/listings/${item._id}`}
                                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

        </div>
    )
}