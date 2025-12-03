import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import { productService } from '../services/api'
import { Product } from '../types'
import './SearchBar.css'

export const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim()) {
      try {
        const data = await productService.search(searchQuery)
        setResults(data)
        setShowResults(true)
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      }
    } else {
      setResults([])
      setShowResults(false)
    }
  }

  const handleResultClick = (productId: string) => {
    navigate(`/product/${productId}`)
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map(product => (
            <div
              key={product.id}
              className="search-result-item"
              onClick={() => handleResultClick(product.id)}
            >
              <img src={product.imageUrl} alt={product.name} />
              <div>
                <h4>{product.name}</h4>
                <p>${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

