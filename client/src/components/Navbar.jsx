import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  PlusCircle,
  User,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  MessageCircle,
  X,
  Heart,
  Menu,
  Package,
  Handshake,
  Compass,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

export default function Navbar() {
  const location = useLocation()
  const { user, isGuest, logout } = useAuth()
  const { unreadCount } = useSocket()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Do not show navbar on auth pages (login, register, forgot-password, reset-password, verify-email)
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
  if (authRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + '/'))) {
    return null
  }

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'))

  const isBrowseActive = location.pathname === '/' || location.pathname.startsWith('/browse')

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo and UTM Campus Badge */}
          <Link to={user?.role === 'admin' ? '/admin' : '/'} className="flex items-center gap-2 group shrink-0">
            <span className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight group-hover:text-blue-700 transition">
              EZ Swap
            </span>
            {user?.role === 'admin' ? (
              <span className="text-[11px] sm:text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-600" /> Admin
                <span className="hidden sm:inline">Portal</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                UTM Campus
              </span>
            )}
          </Link>

          {/* Center links (Desktop): If admin, only show Admin Dashboard */}
          {user?.role === 'admin' ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link
                to="/admin"
                className="text-purple-600 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Dashboard
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600">
              <Link
                to="/browse"
                className={`hover:text-blue-600 transition flex items-center gap-1.5 ${
                  isBrowseActive ? 'font-semibold text-blue-600' : ''
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Marketplace
              </Link>
              <Link
                to={user ? '/my-listings' : '/login'}
                className={`hover:text-blue-600 transition ${
                  isActive('/my-listings') ? 'font-semibold text-blue-600' : ''
                }`}
              >
                My Listings
              </Link>
              {user && (
                <Link
                  to="/orders"
                  className={`hover:text-blue-600 transition ${
                    isActive('/orders') ? 'font-semibold text-blue-600' : ''
                  }`}
                >
                  Offers & Deals
                </Link>
              )}
              {user && (
                <Link
                  to="/wishlist"
                  className={`hover:text-rose-600 transition flex items-center gap-1.5 ${
                    isActive('/wishlist') ? 'font-semibold text-rose-600' : ''
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  Wishlist
                </Link>
              )}
              {user && (
                <Link
                  to="/messages"
                  className={`hover:text-blue-600 transition relative flex items-center gap-1.5 ${
                    isActive('/messages') ? 'font-semibold text-blue-600' : ''
                  }`}
                >
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
          )}

          {/* Right side: Auth & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Mobile quick wishlist & messages icons */}
                {user.role !== 'admin' && (
                  <>
                    <Link
                      to="/wishlist"
                      className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition"
                      title="My Wishlist"
                      aria-label="My Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${isActive('/wishlist') ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </Link>
                    <Link
                      to="/messages"
                      className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Messages"
                      aria-label="Messages"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {user.role === 'admin' ? (
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="max-w-[90px] sm:max-w-[140px] truncate">{user.name || user.email}</span>
                    <span className="hidden sm:inline text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-bold uppercase">
                      Admin
                    </span>
                  </div>
                ) : (
                  <Link
                    to={`/profile/${user._id}`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span className="max-w-[120px] truncate">{user.name || user.email}</span>
                    {user.verificationStatus === 'verified' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" title="Verified UTM Student" />
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded">Unverified</span>
                    )}
                  </Link>
                )}

                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  title="Sign Out"
                  className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-2.5 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isGuest && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    Guest Mode
                  </span>
                )}
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition min-h-[40px]"
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

            {/* Desktop Post Free Ad button (non-admin) */}
            {user?.role !== 'admin' && (
              <Link
                to={user ? '/create-listing' : '/login'}
                className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
              >
                <PlusCircle className="w-4 h-4" /> Post Free Ad
              </Link>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in fade-in duration-150">
            {user && (
              <Link
                to={user.role === 'admin' ? '/admin' : `/profile/${user._id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name || user.email}</p>
                    <p className="text-[11px] text-slate-500">
                      {user.role === 'admin'
                        ? 'Platform Administrator'
                        : user.verificationStatus === 'verified'
                        ? 'Verified UTM Student'
                        : 'Unverified Account'}
                    </p>
                  </div>
                </div>
                {user.verificationStatus === 'verified' && (
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </Link>
            )}

            {user?.role === 'admin' ? (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50"
              >
                <ShieldCheck className="w-4 h-4" /> Admin Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/browse"
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    isBrowseActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" /> Marketplace Ads
                </Link>

                <Link
                  to={user ? '/my-listings' : '/login'}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive('/my-listings') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4" /> My Listings
                </Link>

                {user && (
                  <>
                    <Link
                      to="/orders"
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive('/orders') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Handshake className="w-4 h-4" /> Offers & Deals
                    </Link>

                    <Link
                      to="/wishlist"
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive('/wishlist') ? 'bg-rose-50 text-rose-600' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Heart className="w-4 h-4 text-rose-500" /> My Wishlist
                    </Link>

                    <Link
                      to="/messages"
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive('/messages') ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4" /> Messages
                      </span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                <Link
                  to={user ? '/create-listing' : '/login'}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl shadow-xs transition mt-2"
                >
                  <PlusCircle className="w-4 h-4" /> Post Free Ad
                </Link>
              </>
            )}

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowSignOutConfirm(true)
                }}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Sign Out Confirmation Modal */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition cursor-pointer"
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

      {/* Mobile Bottom Navigation Bar (Thumb-Friendly Navigation on Phones) */}
      {user?.role !== 'admin' && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
        >
          <div className="grid grid-cols-5 h-16 items-center">
            <Link
              to="/browse"
              className={`flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold transition ${
                isBrowseActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>Browse</span>
            </Link>

            <Link
              to={user ? '/my-listings' : '/login'}
              className={`flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold transition ${
                isActive('/my-listings') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>My Ads</span>
            </Link>

            <Link
              to={user ? '/create-listing' : '/login'}
              className="flex flex-col items-center justify-center h-full group"
              aria-label="Post Free Ad"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-600 group-hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition">
                <PlusCircle className="w-5 h-5" />
              </div>
            </Link>

            <Link
              to={user ? '/messages' : '/login'}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold transition ${
                isActive('/messages') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <MessageCircle className="w-5 h-5" />
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>Chat</span>
            </Link>

            <Link
              to={user ? `/profile/${user._id}` : '/login'}
              className={`flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold transition ${
                isActive('/profile') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-5 h-5" />
              <span>{user ? 'Profile' : 'Sign In'}</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  )
}
