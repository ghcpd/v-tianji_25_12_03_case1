import { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import { Link } from 'react-router-dom'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  onQuickView?: (product: Product) => void
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const addItem = useCartStore(state => state.addItem)
  const [imageError, setImageError] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onQuickView) {
      onQuickView(product)
    }
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        {!imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
        <h3>{product.name}</h3>
        <p className="price">${product.price.toFixed(2)}</p>
        {product.stock === 0 && <span className="out-of-stock">Out of Stock</span>}
        {product.rating && (
          <div className="rating-preview">
            ⭐ {product.rating.toFixed(1)}
          </div>
        )}
      </Link>
      <div className="product-actions">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="add-to-cart-btn"
        >
          Add to Cart
        </button>
        {onQuickView && (
          <button onClick={handleQuickView} className="quick-view-btn">
            Quick View
          </button>
        )}
      </div>
    </div>
  )
}

