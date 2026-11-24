import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('No verification token provided in URL.')
      setLoading(false)
      return
    }

    const approve = async () => {
      try {
        setLoading(true)
        const data = await verifyEmail(token)
        setSuccess(true)
        setUserData(data.user)
      } catch (err) {
        setError(err.message || 'Verification link is invalid or has expired.')
      } finally {
        setLoading(false)
      }
    }

    approve()
  }, [token])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        {loading && (
          <div>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 mb-2">Verifying Your Email...</h2>
            <p className="text-xs text-slate-500">Please wait while we confirm your email approval.</p>
          </div>
        )}

        {!loading && success && (
          <div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Email Approved!</h2>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Your email registration is confirmed and your account is now active.
            </p>

            {userData && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs text-slate-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">Account:</span>
                  <span>{userData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Verification:</span>
                  <span className="font-bold text-blue-600 capitalize">
                    {userData.verificationStatus === 'verified' ? 'Verified UTM Student' : 'Unverified User'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/browse')}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-xs transition text-sm cursor-pointer"
            >
              Start Exploring Marketplace <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!loading && error && (
          <div>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Verification Failed</h2>
            <p className="text-xs text-red-600 mb-6 leading-relaxed">{error}</p>

            <Link
              to="/login"
              className="w-full inline-block bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl shadow-xs transition text-sm"
            >
              Go to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
