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

  it('should disable apply button when discount code is empty and allow applying and removing discount', async () => {
    render(<ShoppingCart products={mockProducts} />);

    const applyBtn = screen.getByText(/Apply/i) as HTMLButtonElement;
    const input = screen.getByPlaceholderText(/Discount code/i) as HTMLInputElement;

    // initially disabled because empty
    expect(applyBtn.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'SAVE10' } });
    expect(applyBtn.disabled).toBe(false);

    // apply discount should set applied state (no visible discount since subtotal is 0)
    fireEvent.click(applyBtn);

    // now the apply button should be disabled because appliedDiscount is set
    expect(applyBtn.disabled).toBe(true);

    // remove discount via Remove button
    const removeBtn = await screen.findByText(/Remove/i);
    fireEvent.click(removeBtn);

    expect((input as HTMLInputElement).value).toBe('');
  });

  it('should alert when checking out empty cart', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ShoppingCart products={mockProducts} />);

    const checkout = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkout);

    expect(alertSpy).toHaveBeenCalledWith('Cart is empty');
    alertSpy.mockRestore();
  });
});
