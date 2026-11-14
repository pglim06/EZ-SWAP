import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PlusCircle, User, ShoppingBag, LogOut, CheckCircle2 } from 'lucide-react'

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation(); // 获取当前 URL 路径

    // 判断当前所在页面
    const isMarketplace = location.pathname === '/' || location.pathname === '/browse';
    const isMyListings = location.pathname === '/my-listings';

    const [currentUser, setCurrentUser] = useState(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                return null;
            }
        }
        const defaultUser = {
            _id: '650000000000000000000001',
            name: 'Wong Ann Rick',
            email: 'wongannrick@graduate.utm.my',
            verificationStatus: 'verified'
        };
        localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        return defaultUser;
    });

    const handleSignOut = () => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        navigate('/');
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

                {/* 左侧：Logo 与 UTM 徽章 */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-2xl font-black text-blue-600 tracking-tight group-hover:text-blue-700 transition">
                        EZ Swap
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                        UTM Campus
                    </span>
                </Link>

                {/* 中间链接：根据当前路由动态高亮 */}
                <nav className="hidden md:flex items-center gap-6 text-sm">
                    {/* Marketplace Ads */}
                    <Link
                        to="/"
                        className={`flex items-center gap-1.5 transition ${isMarketplace
                            ? 'font-semibold text-blue-600'
                            : 'text-slate-600 hover:text-blue-600 font-medium'
                            }`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Marketplace Ads
                    </Link>

                    {/* My Listings */}
                    <Link
                        to="/my-listings"
                        className={`transition ${isMyListings
                            ? 'font-semibold text-blue-600'
                            : 'text-slate-600 hover:text-blue-600 font-medium'
                            }`}
                    >
                        My Listings
                    </Link>
                </nav>

                {/* 右侧：登录/Profile 与发帖按钮 */}
                <div className="flex items-center gap-3">
                    {currentUser ? (
                        <div className="flex items-center gap-2">
                            <Link
                                to={`/profile/${currentUser._id}`}
                                className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition border border-slate-200"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                                    {currentUser.name.charAt(0)}
                                </div>
                                <span>{currentUser.name.split(' ')[0]}</span>
                                {currentUser.verificationStatus === 'verified' && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                            </Link>

                            <button
                                onClick={handleSignOut}
                                title="Sign Out (Test as Guest)"
                                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
                        >
                            <User className="w-4 h-4" /> Sign In
                        </Link>
                    )}

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