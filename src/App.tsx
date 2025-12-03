import { Routes, Route, Navigate } from 'react-router-dom'
import { ProductList } from './components/ProductList'
import { ProductDetail } from './components/ProductDetail'
import { Cart } from './components/Cart'
import { Checkout } from './components/Checkout'
import { UserProfile } from './components/UserProfile'
import { Layout } from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

