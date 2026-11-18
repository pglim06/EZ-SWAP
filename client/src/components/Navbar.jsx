import { Link } from 'react-router-dom'
import { PlusCircle, User, ShoppingBag, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

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

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            to="/browse"
            className="hover:text-blue-600 transition flex items-center gap-1.5 font-semibold text-blue-600"
          >
            <ShoppingBag className="w-4 h-4" /> Marketplace Ads
          </Link>
        </nav>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Student
                  </div>
                </div>
              </div>

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
            to={user ? "/browse" : "/login"}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
          >
            <PlusCircle className="w-4 h-4" /> Post Free Ad
          </Link>
        </div>
      </div>
    </header>
  )
}
