import { Link } from 'react-router-dom'
import { GraduationCap, ArrowLeft, Lock, Mail } from 'lucide-react'

export default function Login() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

                <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Student Sign In</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Sign in with your verified UTM student credentials
                    </p>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            University Email
                        </label>
                        <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="email"
                                placeholder="yourname@graduate.utm.my"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Must be your official @graduate.utm.my email
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-xs transition text-sm mt-2"
                    >
                        Sign In to EZ Swap
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    First time here?{' '}
                    <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                        Register Student Account
                    </span>
                </div>

            </div>
        </div>
    )
}