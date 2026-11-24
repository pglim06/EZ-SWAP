import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_BASE = 'http://localhost:5000/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ezswap_user') || localStorage.getItem('currentUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // Verify session on mount with /api/auth/me
  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          setUser(data.user)
          localStorage.setItem('ezswap_user', JSON.stringify(data.user))
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        } else {
          setUser(null)
          localStorage.removeItem('ezswap_user')
          localStorage.removeItem('currentUser')
        }
      })
      .catch(() => {
        // If server is not reachable, keep cached user or null
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Login failed')
    }
    setUser(data.user)
    localStorage.setItem('ezswap_user', JSON.stringify(data.user))
    localStorage.setItem('currentUser', JSON.stringify(data.user))
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
    setUser(data.user)
    localStorage.setItem('ezswap_user', JSON.stringify(data.user))
    localStorage.setItem('currentUser', JSON.stringify(data.user))
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
      localStorage.removeItem('ezswap_user')
      localStorage.removeItem('currentUser')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
