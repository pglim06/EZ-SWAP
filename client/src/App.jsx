import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar from './components/Navbar'
import Browse from './pages/Browse'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import CreateListing from './pages/CreateListing'
import MyListings from './pages/MyListings'
import EditListing from './pages/EditListing'
import ListingDetail from './pages/ListingDetail'
import CategoryPage from './pages/CategoryPage'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Messages from './pages/Messages'

// Guard that ensures user has either logged in or chosen "Continue as Guest"
function RequireAuthOrGuest({ children }) {
  const { user, isGuest, loading } = useAuth()
  if (loading) return null
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Guard for actions that strictly require a registered account
function RequireRegisteredUser({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Global Sticky Navbar with Auth State */}
            <Navbar />

            <Routes>
              {/* Root redirects to /browse if authenticated or guest, otherwise to /login */}
              <Route
                path="/"
                element={
                  <RequireAuthOrGuest>
                    <Browse />
                  </RequireAuthOrGuest>
                }
              />
              <Route
                path="/browse"
                element={
                  <RequireAuthOrGuest>
                    <Browse />
                  </RequireAuthOrGuest>
                }
              />

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes (Guests cannot access, must log in) */}
              <Route
                path="/create-listing"
                element={
                  <RequireRegisteredUser>
                    <CreateListing />
                  </RequireRegisteredUser>
                }
              />
              <Route
                path="/my-listings"
                element={
                  <RequireRegisteredUser>
                    <MyListings />
                  </RequireRegisteredUser>
                }
              />
              <Route
                path="/edit-listing/:id"
                element={
                  <RequireRegisteredUser>
                    <EditListing />
                  </RequireRegisteredUser>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireRegisteredUser>
                    <MyOrders />
                  </RequireRegisteredUser>
                }
              />
              <Route
                path="/messages"
                element={
                  <RequireRegisteredUser>
                    <Messages />
                  </RequireRegisteredUser>
                }
              />

              {/* Accessible by Guest to view listings */}
              <Route
                path="/category/:category"
                element={
                  <RequireAuthOrGuest>
                    <CategoryPage />
                  </RequireAuthOrGuest>
                }
              />
              <Route
                path="/listings/:id"
                element={
                  <RequireAuthOrGuest>
                    <ListingDetail />
                  </RequireAuthOrGuest>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireRegisteredUser>
                    <Profile />
                  </RequireRegisteredUser>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <RequireAuthOrGuest>
                    <Profile />
                  </RequireAuthOrGuest>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
