import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PlusCircle, User, ShoppingBag, LogOut, ShieldCheck, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

export default function Navbar() {
  const location = useLocation()
  const { user, isGuest, logout } = useAuth()
  const { unreadCount } = useSocket()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Do not show navbar on auth pages (login, register, forgot-password, reset-password, verify-email)
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
  if (authRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + '/'))) {
    return null
  }

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
          <Link to="/browse" className="hover:text-blue-600 transition flex items-center gap-1.5 font-semibold text-blue-600">
            <ShoppingBag className="w-4 h-4" /> Marketplace Ads
          </Link>
          <Link to={user ? "/my-listings" : "/login"} className="hover:text-blue-600 transition">
            My Listings
          </Link>
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
          {user && user.role === 'admin' && (
            <Link to="/admin" className="hover:text-blue-600 transition flex items-center gap-1.5 text-purple-600 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Admin
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
                <span className={`w-2 h-2 rounded-full ${user.verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                {user.verificationStatus === 'verified' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" title="Verified UTM Student" />
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded">Unverified</span>
                )}
              </Link>

              <button
                onClick={() => setShowSignOutConfirm(true)}
                title="Sign Out"
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-2.5 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isGuest && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  Guest Mode
                </span>
              )}
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

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Confirm Sign Out</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to sign out of your account? You will need to sign in again to chat, post, or manage your listings.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowSignOutConfirm(false)
                  await logout()
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
