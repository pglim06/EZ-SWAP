import { Link } from 'react-router-dom'
import { PlusCircle, User, ShoppingBag, LogOut, ShieldCheck, MessageCircle, Tag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unreadCount } = useSocket()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and UTM Campus Badge */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-black text-blue-600 tracking-tight group-hover:text-blue-700 transition">
            EZ Swap
          </span>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
            UTM Campus
          </span>
        </Link>

        {/* Center links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1.5 font-semibold text-blue-600">
            <ShoppingBag className="w-4 h-4" /> Marketplace Ads
          </Link>
          <Link to="/my-listings" className="hover:text-blue-600 transition">
            My Listings
          </Link>
          {user && (
            <Link to="/orders" className="hover:text-blue-600 transition flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Offers & Deals
            </Link>
          )}
          {user && (
            <Link to="/messages" className="hover:text-blue-600 transition relative flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              Messages
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Right side: Auth & Post Ad */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Mobile messages icon */}
              <Link
                to="/messages"
                className="md:hidden relative flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 transition"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </Link>

              <button
                onClick={logout}
                title="Sign Out"
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-2.5 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4" /> Sign In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                Register
              </Link>
            </div>
          )}

          <Link
            to={user ? "/create-listing" : "/login"}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Post Free Ad
          </Link>
        </div>
      </div>
    </header>
  )
}
