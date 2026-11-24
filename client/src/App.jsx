import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar from './components/Navbar'
import Browse from './pages/Browse'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateListing from './pages/CreateListing'
import MyListings from './pages/MyListings'
import EditListing from './pages/EditListing'
import ListingDetail from './pages/ListingDetail'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Messages from './pages/Messages'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Global Sticky Navbar with Auth State */}
            <Navbar />

            <Routes>
              <Route path="/" element={<Browse />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/edit-listing/:id" element={<EditListing />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/messages" element={<Messages />} />
            </Routes>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
