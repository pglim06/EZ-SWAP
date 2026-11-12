import { Link } from 'react-router-dom'
import { PlusCircle, Search, User, ShoppingBag } from 'lucide-react'

export default function Navbar() {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

                {/* 左侧：Logo 与 UTM 徽章，点击直接回商品大厅 */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-2xl font-black text-blue-600 tracking-tight group-hover:text-blue-700 transition">
                        EZ Swap
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                        UTM Campus
                    </span>
                </Link>

                {/* 中间链接 */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                    <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1.5 font-semibold text-blue-600">
                        <ShoppingBag className="w-4 h-4" /> Marketplace Ads
                    </Link>
                    <Link to="/my-listings" className="hover:text-blue-600 transition">
                        My Listings
                    </Link>
                </nav>

                {/* 右侧：登录与发帖按钮 */}
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                    >
                        <User className="w-4 h-4" /> Sign In
                    </Link>

                    <Link
                        to="/create-listing"
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
                    >
                        <PlusCircle className="w-4 h-4" /> Post Free Ad
                    </Link>
                </div>

            </div>
        </header>
    )
}