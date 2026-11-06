import { Route, Routes } from 'react-router-dom'
import SmoothScroll from './components/SmoothScroll'
import Curtain from './components/Curtain'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import RealtimeToasts from './components/RealtimeToasts'

import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Brands from './pages/Brands'
import BrandPage from './pages/BrandPage'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import { Login, Register, RegisterBrand, GoogleDone } from './pages/Auth'
import BrandDashboard from './pages/dashboard/BrandDashboard'
import AdminPanel from './pages/dashboard/AdminPanel'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <SmoothScroll />
      <Curtain />
      <Navbar />
      <CartDrawer />
      <RealtimeToasts />
      <main id="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/brands/:id" element={<BrandPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-brand" element={<RegisterBrand />} />
          <Route path="/auth/google/done" element={<GoogleDone />} />

          <Route path="/cart" element={<ProtectedRoute roles={['user', 'admin']}><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute roles={['user', 'admin']}><Checkout /></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute roles={['user', 'admin']}><OrderSuccess /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['user', 'admin']}><Orders /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute roles={['user', 'admin']}><Wishlist /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute roles={['admin']}><BrandDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
