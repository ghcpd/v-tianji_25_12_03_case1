import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useUserStore } from '../store/userStore'
import { orderService } from '../services/api'
import { Address } from '../types'

export const Checkout = () => {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const { currentUser } = useUserStore()
  const [shippingAddress, setShippingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('credit')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      navigate('/login')
      return
    }

    if (items.length === 0) {
      alert('Your cart is empty')
      return
    }

    setProcessing(true)
    try {
      const order = await orderService.create({
        userId: currentUser.id,
        items,
        total: getTotal(),
        status: 'pending',
        shippingAddress,
        createdAt: new Date().toISOString(),
      })
      
      if (order) {
        clearCart()
        navigate('/profile', { state: { orderId: order.id } })
      } else {
        throw new Error('Order creation failed')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      const message = error instanceof Error ? error.message : 'Checkout failed. Please try again.'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="form-section">
          <h3>Shipping Address</h3>
          <input
            type="text"
            placeholder="Street"
            value={shippingAddress.street}
            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="City"
            value={shippingAddress.city}
            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="State"
            value={shippingAddress.state}
            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="ZIP Code"
            value={shippingAddress.zipCode}
            onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Country"
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
            required
          />
        </div>
        <div className="form-section">
          <h3>Payment Method</h3>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>
        <div className="order-summary">
          <h3>Order Summary</h3>
          {items.map(item => (
            <div key={item.product.id} className="order-item">
              <span>{item.product.name} x {item.quantity}</span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="order-total">
            <strong>Total: ${getTotal().toFixed(2)}</strong>
          </div>
        </div>
        <button type="submit" disabled={processing} className="submit-order-btn">
          {processing ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}

