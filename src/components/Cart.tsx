import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useUserStore } from '../store/userStore'

export const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { isAuthenticated } = useUserStore()

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <Link to="/">Continue Shopping</Link>
      </div>
    )
  }

  return (
    <div className="cart">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {items.map(item => (
          <div key={item.product.id} className="cart-item">
            <img src={item.product.imageUrl} alt={item.product.name} />
            <div className="cart-item-info">
              <h3>{item.product.name}</h3>
              <p>${item.product.price.toFixed(2)} each</p>
            </div>
            <div className="cart-item-controls">
              <input
                type="number"
                min="1"
                max={item.product.stock}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
              />
              <button onClick={() => removeItem(item.product.id)}>Remove</button>
            </div>
            <div className="cart-item-total">
              ${(item.product.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="cart-total">
          <strong>Total: ${getTotal().toFixed(2)}</strong>
        </div>
        <div className="cart-actions">
          <button onClick={clearCart}>Clear Cart</button>
          {isAuthenticated ? (
            <Link to="/checkout" className="checkout-btn">Proceed to Checkout</Link>
          ) : (
            <Link to="/login" className="checkout-btn">Login to Checkout</Link>
          )}
        </div>
      </div>
    </div>
  )
}

