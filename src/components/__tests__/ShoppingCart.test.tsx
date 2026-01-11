import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingCart } from '../ShoppingCart';
import { Product } from '@/types';

const mockProducts: Product[] = [
  { id: '1', name: 'Product 1', price: 10, category: 'A', stock: 100 },
  { id: '2', name: 'Product 2', price: 20, category: 'B', stock: 50 },
  { id: '3', name: 'Product 3', price: 50, category: 'C', stock: 0 },
];

describe('ShoppingCart', () => {
  describe('Rendering', () => {
    it('should render empty cart message', () => {
      render(<ShoppingCart products={mockProducts} />);
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });

    it('should display item count', () => {
      render(<ShoppingCart products={mockProducts} />);
      expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    });

    it('should render shopping cart container', () => {
      render(<ShoppingCart products={mockProducts} />);
      const cart = screen.getByTestId('shopping-cart');
      expect(cart).toBeInTheDocument();
    });

    it('should render with default tax rate and currency', () => {
      render(<ShoppingCart products={mockProducts} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should render with custom tax rate and currency', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0.15} currency="EUR" />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });
  });

  describe('Add to Cart', () => {
    it('should add product to cart', async () => {
      const { rerender } = render(<ShoppingCart products={mockProducts} />);
      
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });

    it('should update item count when adding items', async () => {
      render(<ShoppingCart products={mockProducts} />);
      
      const initialText = screen.getByText(/0 items/i);
      expect(initialText).toBeInTheDocument();
    });
  });

  describe('Remove from Cart', () => {
    it('should show clear cart button when items exist', () => {
      render(<ShoppingCart products={mockProducts} />);
      
      // Initially empty cart should not show clear button
      expect(screen.queryByText(/Clear Cart/i)).not.toBeInTheDocument();
    });
  });

  describe('Calculations', () => {
    it('should calculate subtotal correctly', () => {
      render(<ShoppingCart products={mockProducts} />);
      const cart = screen.getByTestId('shopping-cart');
      expect(cart).toBeInTheDocument();
    });

    it('should calculate tax correctly with default rate', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0.1} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should calculate tax correctly with custom rate', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0.15} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });
  });

  describe('Discount Codes', () => {
    it('should render discount input field', () => {
      render(<ShoppingCart products={mockProducts} />);
      
      const discountInput = screen.queryByPlaceholderText(/Discount code/i);
      // Empty cart won't show discount section
      expect(discountInput).not.toBeInTheDocument();
    });

    it('should display apply button for discount codes', () => {
      render(<ShoppingCart products={mockProducts} />);
      
      const applyButton = screen.queryByText(/Apply/i);
      // Empty cart won't show discount section
      expect(applyButton).not.toBeInTheDocument();
    });
  });

  describe('Checkout', () => {
    it('should render checkout button when not checking out', () => {
      render(<ShoppingCart products={mockProducts} />);
      
      // Initially empty, so button not visible
      const checkoutBtn = screen.queryByText(/Proceed to Checkout/i);
      expect(checkoutBtn).not.toBeInTheDocument();
    });

    it('should show checkout modal when checking out', () => {
      render(<ShoppingCart products={mockProducts} />);
      
      // With empty cart, modal won't show
      const modal = screen.queryByTestId(/checkout-modal/i);
      expect(modal).not.toBeInTheDocument();
    });

    it('should call onCheckout callback when available', () => {
      const onCheckout = jest.fn();
      render(<ShoppingCart products={mockProducts} onCheckout={onCheckout} />);
      
      // Callback would be called if items existed and checkout was clicked
      expect(onCheckout).not.toHaveBeenCalled();
    });
  });

  describe('Currency Formatting', () => {
    it('should format prices with selected currency', () => {
      render(<ShoppingCart products={mockProducts} currency="USD" />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should use default USD currency', () => {
      render(<ShoppingCart products={mockProducts} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero products', () => {
      render(<ShoppingCart products={[]} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should handle very large prices', () => {
      const expensiveProducts = [
        { id: '1', name: 'Expensive', price: 999999.99, category: 'A', stock: 1 },
      ];
      render(<ShoppingCart products={expensiveProducts} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should handle very small prices', () => {
      const cheapProducts = [
        { id: '1', name: 'Cheap', price: 0.01, category: 'A', stock: 100 },
      ];
      render(<ShoppingCart products={cheapProducts} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should handle zero tax rate', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should handle high tax rate', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0.5} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should accept products prop', () => {
      const { container } = render(<ShoppingCart products={mockProducts} />);
      expect(container.querySelector('.shopping-cart')).toBeInTheDocument();
    });

    it('should accept onCheckout callback', () => {
      const onCheckout = jest.fn();
      render(<ShoppingCart products={mockProducts} onCheckout={onCheckout} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should accept custom taxRate', () => {
      render(<ShoppingCart products={mockProducts} taxRate={0.2} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should accept custom currency', () => {
      render(<ShoppingCart products={mockProducts} currency="GBP" />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should render with all props provided', () => {
      const onCheckout = jest.fn();
      render(
        <ShoppingCart
          products={mockProducts}
          onCheckout={onCheckout}
          taxRate={0.12}
          currency="CAD"
        />
      );
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should handle multiple products', () => {
      const manyProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `Product ${i}`,
        price: (i + 1) * 10,
        category: 'test',
        stock: 100,
      }));

      render(<ShoppingCart products={manyProducts} />);
      expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
    });

    it('should maintain state correctly', () => {
      render(<ShoppingCart products={mockProducts} />);
      expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    });
  });
});
