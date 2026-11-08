import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Browse from './pages/Browse'
import Login from './pages/Login'

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
        </Routes>
      </div>
    </BrowserRouter>
  )
}