import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-between">
            {/* Hero 区域 */}
            <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Exclusively for UTM Students & Staff
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
                    The Smarter Way to <span className="text-blue-600">Swap & Trade</span> on Campus
                </h1>

                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
                    Turn your unused textbooks, dorm equipment, and electronics into cash, or discover deals right within your college residential hall.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to="/browse"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition text-base"
                    >
                        Explore Marketplace <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        to="/login"
                        className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-xl shadow-xs transition text-base"
                    >
                        Student Sign In
                    </Link>
                </div>
            </section>

            {/* 3 大核心优势卡片 */}
            <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Verified Students Only</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        All users must register with university email (@graduate.utm.my) to ensure a spam-free, secure trading community.
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">Offer & Handover Flow</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Propose offers, agree on prices, and coordinate safe on-campus meetups with dual-handover confirmations.
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">In-App Chat & Reviews</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Chat directly with sellers without sharing personal WhatsApp numbers, and build peer reputation through ratings.
                    </p>
                </div>
            </section>

            {/* 底部版权 */}
            <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
                © 2026 EZ Swap — AIROST Project. Developed by Team EZ (Lim Pin Guan & Wong Ann Rick).
            </footer>
        </div>
    )
}