import { useState } from 'react'
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
    Sparkles
} from 'lucide-react'

// 1. 定义类似 Mudah.my 的分类列表：包含 ID、显示名称、Lucide 图标、专属淡背景色
const CATEGORIES = [
    { id: 'All', name: 'All Ads', icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Textbooks', name: 'Textbooks', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'Electronics', name: 'Electronics', icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'Dorm Essentials', name: 'Dorm & Living', icon: Bed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Fashion', name: 'Fashion & Wear', icon: Shirt, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'Services', name: 'Campus Services', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'Sports', name: 'Bikes & Sports', icon: Bike, color: 'text-teal-600', bg: 'bg-teal-50' },
]

// 2. 模拟商品数据
const SAMPLE_ITEMS = [
    {
        id: '1',
        title: 'Engineering Mathematics 1 (Calculus)',
        category: 'Textbooks',
        price: 35,
        condition: 'Like New (9/10)',
        location: 'UTM Arked Meranti',
        seller: 'Ahmad (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '2',
        title: 'Logitech Wireless Mouse M331',
        category: 'Electronics',
        price: 45,
        condition: 'Good (Used 1 sem)',
        location: 'Kolej Rahman Putra (KRP)',
        seller: 'Sarah (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '3',
        title: 'Study Desk Lamp (Rechargeable LED)',
        category: 'Dorm Essentials',
        price: 20,
        condition: 'Brand New',
        location: 'Kolej Tun Dr Ismail (KTDI)',
        seller: 'Wei Ming (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '4',
        title: 'UTM Corporate T-Shirt (Size L)',
        category: 'Fashion',
        price: 18,
        condition: 'Used once',
        location: 'UTM FABU Building',
        seller: 'Nurul (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '5',
        title: 'Bicycle for Campus Commute (Fixie)',
        category: 'Sports',
        price: 120,
        condition: 'Good working condition',
        location: 'Kolej Perdana (KP)',
        seller: 'Hafiz (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=60'
    },
    {
        id: '6',
        title: 'PC & Laptop Dust Cleaning Service',
        category: 'Services',
        price: 25,
        condition: 'Service / Repair',
        location: 'UTM Lingkaran Ilmu',
        seller: 'Kevin (Verified)',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'
    }
]

export default function Browse() {
    const [search, setSearch] = useState('')
    const [selectedCat, setSelectedCat] = useState('All')

    // 过滤逻辑
    const filtered = SAMPLE_ITEMS.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
        const matchesCat = selectedCat === 'All' || item.category === selectedCat
        return matchesSearch && matchesCat
    })

    return (
        <div className="min-h-screen bg-slate-50 pb-16">

            {/* 顶部搜索栏与 Banner (Search Header) */}
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
                            placeholder="Search by keywords (e.g. Mathematics, Mouse)..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition shadow-xs"
                        />
                    </div>
                </div>
            </section>

            {/* Mudah.my 风格：分类图标金刚区 (Mudah-style Category Icons) */}
            <section className="max-w-7xl mx-auto px-6 py-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explore By Categories
                    </div>

                    {/* 横向排列的分类卡片网格 */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                        {CATEGORIES.map((cat) => {
                            const IconComp = cat.icon
                            const isSelected = selectedCat === cat.id

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCat(cat.id)}
                                    className="flex flex-col items-center group cursor-pointer text-center transition"
                                >
                                    {/* 方形圆角图标框 (Mudah Icon Box) */}
                                    <div
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                                : `${cat.bg} ${cat.color} border-slate-100 group-hover:scale-105 group-hover:shadow-sm`
                                            }`}
                                    >
                                        <IconComp className="w-6 h-6 sm:w-7 sm:h-7" />
                                    </div>

                                    {/* 下方文字标签 (Category Label) */}
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

            {/* 广告/商品展示大厅 (Ads Listing Grid) */}
            <section className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                        {selectedCat === 'All' ? 'All Recent Advertisements' : `${selectedCat} Listings`}
                        <span className="text-xs text-slate-400 font-normal ml-2">({filtered.length} items found)</span>
                    </h2>
                </div>

                {/* 商品网格 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
                        >
                            <div>
                                <div className="h-48 bg-slate-100 overflow-hidden relative">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:text-red-500 transition">
                                        <Heart className="w-4 h-4" />
                                    </button>
                                    <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                                        {item.condition}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-1">
                                        <Tag className="w-3.5 h-3.5" /> {item.category}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                        Seller: <span className="font-medium text-slate-600">{item.seller}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Price</span>
                                    <span className="text-lg font-black text-blue-600">RM {item.price}</span>
                                </div>
                                <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition">
                                    Make Offer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 无匹配商品时的提示 */}
                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl mt-4">
                        <p className="text-slate-500 text-sm">No listings found matching your search.</p>
                    </div>
                )}
            </section>

        </div>
    )
}