import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '../store/cartStore'
import { Review } from '../types'
import { reviewService } from '../services/api'
import { useUserStore } from '../store/userStore'

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { product, loading, error } = useProduct(id || '')
  const addItem = useCartStore(state => state.addItem)
  const { currentUser, isAuthenticated } = useUserStore()
  const [quantity, setQuantity] = useState(1)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
    }
  }

  const handleSubmitReview = async () => {
    if (!product || !isAuthenticated || !currentUser) return

    try {
      const newReview: Partial<Review> = {
        userId: currentUser.id,
        userName: currentUser.name,
        rating: reviewRating,
        comment: reviewText,
        createdAt: new Date().toISOString(),
      }
      const createdReview = await reviewService.create(product.id, newReview)
      if (product.reviews) {
        product.reviews.push(createdReview as Review)
      } else {
        product.reviews = [createdReview as Review]
      }
      setReviewText('')
      setReviewRating(5)
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert('Failed to submit review. Please try again.')
    }
  }

  if (loading) return <div className="loading">Loading product...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!product) return <div>Product not found</div>

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0

  return (
    <div className="product-detail">
      <div className="product-detail-content">
        <div className="product-image">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="category">{product.category}</p>
          <p className="price">${product.price.toFixed(2)}</p>
          {averageRating > 0 && (
            <div className="rating">
              Rating: {averageRating.toFixed(1)} / 5.0
            </div>
          )}
          <p className="description">{product.description}</p>
          <div className="stock-info">
            {product.stock > 0 ? (
              <span className="in-stock">In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>
          <div className="purchase-section">
            <div className="quantity-selector">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="add-to-cart-btn"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      <div className="reviews-section">
        <h2>Reviews</h2>
        {isAuthenticated && (
          <div className="review-form">
            <div className="rating-input">
              <label>Rating:</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review..."
              rows={4}
            />
            <button onClick={handleSubmitReview}>Submit Review</button>
          </div>
        )}
        <div className="reviews-list">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">{review.userName}</span>
                  <span className="review-rating">⭐ {review.rating}/5</span>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          ) : (
            <p>No reviews yet. Be the first to review!</p>
          )}
        </div>
      </div>
    </div>
  )
}

