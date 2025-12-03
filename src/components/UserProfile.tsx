import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { orderService } from '../services/api'
import { Order } from '../types'

export const UserProfile = () => {
  const { currentUser, updatePreferences } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return
      try {
        const data = await orderService.getByUser(currentUser.id)
        setOrders(data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [currentUser])

  const handlePreferenceChange = (key: keyof typeof currentUser.preferences, value: string) => {
    updatePreferences({ [key]: value })
  }

  if (!currentUser) {
    return <div>Please login to view your profile</div>
  }

  return (
    <div className="user-profile">
      <h2>Profile</h2>
      <div className="profile-section">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {currentUser.name}</p>
        <p><strong>Email:</strong> {currentUser.email}</p>
      </div>
      <div className="profile-section">
        <h3>Preferences</h3>
        <div className="preference-item">
          <label>Theme:</label>
          <select
            value={currentUser.preferences?.theme || 'light'}
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="preference-item">
          <label>Currency:</label>
          <input
            type="text"
            value={currentUser.preferences?.currency || 'USD'}
            onChange={(e) => handlePreferenceChange('currency', e.target.value)}
          />
        </div>
        <div className="preference-item">
          <label>Language:</label>
          <input
            type="text"
            value={currentUser.preferences?.language || 'en'}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
          />
        </div>
      </div>
      <div className="profile-section">
        <h3>Order History</h3>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length > 0 ? (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span>Order #{order.id}</span>
                  <span className={`status ${order.status}`}>{order.status}</span>
                </div>
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      {item.product.name} x {item.quantity}
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <strong>Total: ${order.total.toFixed(2)}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No orders yet</p>
        )}
      </div>
    </div>
  )
}

