import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Browse from './pages/Browse'
import Login from './pages/Login'
import CreateListing from './pages/CreateListing'
import MyListings from './pages/MyListings'
import EditListing from './pages/EditListing'
import ListingDetail from './pages/ListingDetail'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* 全局常驻导航栏 */}
        <Navbar />

        {/* 动态路由：访问 "/" 或 "/browse" 都会直接进入商品大厅！ */}
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          {/* T10 新增路由 */}
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}