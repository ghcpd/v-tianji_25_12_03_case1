import { ReactNode, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useUserStore } from '../store/userStore'
import { SearchBar } from './SearchBar'

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const itemCount = useCartStore(state => state.getItemCount())
  const { currentUser, isAuthenticated, logout } = useUserStore()
  const [notifications, setNotifications] = useState<number>(0)

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const interval = setInterval(() => {
        const count = Math.floor(Math.random() * 5)
        setNotifications(count)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, currentUser])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNavigation = (path: string) => {
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            Ecommerce
          </Link>
          <div className="header-middle">
            <SearchBar />
          </div>
          <nav className="nav">
            <a href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/') }}>
              Products
            </a>
            <Link to="/cart">
              Cart {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  {currentUser?.name}
                  {notifications > 0 && <span className="badge">{notifications}</span>}
                </Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button onClick={() => navigate('/login')}>Login</button>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>&copy; 2024 Ecommerce Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}

