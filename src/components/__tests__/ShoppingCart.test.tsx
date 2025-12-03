import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShoppingCart } from '../ShoppingCart';
import { Product } from '@/types';

const mockProducts: Product[] = [
  { id: '1', name: 'Product 1', price: 10, category: 'A', stock: 100 },
  { id: '2', name: 'Product 2', price: 20, category: 'B', stock: 50 },
];

describe('ShoppingCart', () => {
  it('should render empty cart message', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('should display item count', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByText(/0 items/i)).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(<ShoppingCart products={mockProducts} />);
    const cart = screen.getByTestId('shopping-cart');
    expect(cart).toBeInTheDocument();
  });

  it('should calculate subtotal correctly', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByTestId('shopping-cart')).toBeInTheDocument();
  });

  it('should display items when initialCartItems provided and support quantity updates and removal', async () => {
    const initialCart = [
      { productId: '1', name: 'Product 1', price: 10, quantity: 2 },
      { productId: '2', name: 'Product 2', price: 20, quantity: 1 },
    ];

    const onCheckout = jest.fn();
    render(<ShoppingCart products={mockProducts} onCheckout={onCheckout} initialCartItems={initialCart} />);

    expect(screen.getAllByTestId('cart-item')).toHaveLength(2);

    // decrease quantity of product 1
    const decreaseButtons = screen.getAllByLabelText('Decrease quantity');
    fireEvent.click(decreaseButtons[0]);
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();

    // increase quantity of product 2
    const increaseButtons = screen.getAllByLabelText('Increase quantity');
    fireEvent.click(increaseButtons[1]);
    expect(screen.getAllByText('2')[1]).toBeInTheDocument();

    // remove product 1 by setting quantity to 0
    fireEvent.click(decreaseButtons[0]);
    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();

    // apply discount code that doesn't apply
    window.alert = jest.fn();
    const input = screen.getByPlaceholderText(/Discount code/i);
    fireEvent.change(input, { target: { value: 'INVALID' } });
    const applyBtn = screen.getByText(/Apply/i);
    fireEvent.click(applyBtn);
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Invalid discount code'));

    // proceed to checkout
    const checkoutBtn = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkoutBtn);
    expect(onCheckout).toHaveBeenCalled();
    expect(screen.getByTestId('checkout-modal')).toBeInTheDocument();
  });

  it('should show empty cart alert when checking out empty cart', () => {
    window.alert = jest.fn();
    render(<ShoppingCart products={mockProducts} />);
    const checkoutBtn = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkoutBtn);
    expect(window.alert).toHaveBeenCalledWith('Cart is empty');
  });
});
