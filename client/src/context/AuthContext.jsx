import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE = 'http://localhost:5000/api/auth'

// Explicitly clean up any stale persisted accounts from previous runs
try {
  localStorage.removeItem('ezswap_user')
  localStorage.removeItem('currentUser')
} catch {}

export function AuthProvider({ children }) {
  // Always start with null on execution so the user must sign in or choose guest
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  // Verify session on mount with /api/auth/me
  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          setUser(data.user)
          setIsGuest(false)
        } else {
          setUser(null)
        }
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const continueAsGuest = () => {
    setIsGuest(true)
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.message || 'Login failed')
      err.data = data
      throw err
    }
    setUser(data.user)
    setIsGuest(false)
    return data
  }

  const register = async ({ name, email, password, confirmPassword, universityId }) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, confirmPassword, universityId }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed')
    }
    return data
  }

  const verifyEmail = async (token) => {
    const res = await fetch(`${API_BASE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Email verification failed')
    }
    if (data.user) {
      setUser(data.user)
      setIsGuest(false)
    }
    return data
  }

  const resendVerification = async (email) => {
    const res = await fetch(`${API_BASE}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to resend verification')
    return data
  }

  const forgotPassword = async (email) => {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to request password reset')
    return data
  }

  const resetPassword = async ({ token, newPassword, confirmPassword }) => {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to reset password')
    return data
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      setUser(null)
      setIsGuest(false)
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
    }
  }

  const deleteAccount = async () => {
    const res = await fetch(`${API_BASE}/account`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete account')
    }
    await logout()
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        continueAsGuest,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
