import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ShoppingCart } from '../ShoppingCart';
import { Product, CartItem } from '@/types';

const mockProducts: Product[] = [
  { id: '1', name: 'Product 1', price: 10, category: 'A', stock: 100 },
  { id: '2', name: 'Product 2', price: 20, category: 'B', stock: 50 },
];

describe('ShoppingCart', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  const renderCart = (opts?: Partial<React.ComponentProps<typeof ShoppingCart>>) => {
    const actionsRef: { current: any } = { current: null };
    const utils = render(
      <ShoppingCart
        products={mockProducts}
        exposeActions={(a) => {
          actionsRef.current = a;
        }}
        {...opts}
      />
    );
    return { actionsRef, ...utils };
  };

  it('renders empty cart message and item count', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/0 items/i)).toBeInTheDocument();
  });

  it('adds items, updates quantities, and calculates totals', async () => {
    const { actionsRef } = renderCart();
    await waitFor(() => expect(actionsRef.current).toBeTruthy());
    const actions = actionsRef.current;
    await act(async () => {
      actions.addToCart(mockProducts[0], 2); // subtotal 20
    });

    expect(screen.getAllByTestId('cart-item')).toHaveLength(1);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0); // subtotal/item total
    expect(screen.getByText('Shopping Cart (2 items)')).toBeInTheDocument();

    // Tax 10% => $2.00, total $22.00
    expect(screen.getByText(/Tax \(10\.0%\):/)).toBeInTheDocument();
    expect(screen.getByText('$2.00')).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText('$22.00')).toBeInTheDocument();

    // Increase quantity via UI
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(screen.getByText('Shopping Cart (3 items)')).toBeInTheDocument();

    // Decrease quantity via UI
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(screen.getByText('Shopping Cart (2 items)')).toBeInTheDocument();
  });

  it('removes item when quantity goes to zero', async () => {
    const initialCart: CartItem[] = [{ productId: '1', name: 'Product 1', price: 10, quantity: 1 }];
    render(<ShoppingCart products={mockProducts} initialCartItems={initialCart} />);

    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('applies and removes a valid discount code', async () => {
    const { actionsRef } = renderCart();
    await waitFor(() => expect(actionsRef.current).toBeTruthy());
    const actions = actionsRef.current;
    await act(async () => {
      actions.addToCart(mockProducts[0], 10); // subtotal 100
    });

    // Apply SAVE10 (10%)
    fireEvent.change(screen.getByPlaceholderText(/Discount code/i), { target: { value: 'SAVE10' } });
    fireEvent.click(screen.getByText(/Apply/i));

    expect(screen.getByText(/Discount \(SAVE10\):/)).toBeInTheDocument();
    expect(screen.getByText('-$10.00')).toBeInTheDocument();
    // Tax on 90 => 9
    expect(screen.getByText('$9.00')).toBeInTheDocument();
    expect(screen.getByText('$99.00')).toBeInTheDocument();

    // Remove discount
    const discountRemoveBtn = screen.getAllByText(/Remove/i).find(btn => btn.closest('.discount-section')) as HTMLElement;
    fireEvent.click(discountRemoveBtn);
    expect(screen.queryByText(/Discount \(SAVE10\):/)).not.toBeInTheDocument();
    expect((screen.getByPlaceholderText(/Discount code/i) as HTMLInputElement).value).toBe('');
  });

  it('shows alert for invalid or insufficient discount codes', async () => {
    const { actionsRef } = renderCart();
    await waitFor(() => expect(actionsRef.current).toBeTruthy());
    const actions = actionsRef.current;
    await act(async () => {
      actions.addToCart(mockProducts[0], 5); // subtotal 50
    });

    fireEvent.change(screen.getByPlaceholderText(/Discount code/i), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByText(/Apply/i));
    expect(alertSpy).toHaveBeenCalledWith('Invalid discount code');

    // FLAT50 requires minPurchase 200, should alert
    fireEvent.change(screen.getByPlaceholderText(/Discount code/i), { target: { value: 'FLAT50' } });
    fireEvent.click(screen.getByText(/Apply/i));
    expect(alertSpy).toHaveBeenCalledTimes(2);
  });

  it('handles checkout flows (empty, invalid total, success)', async () => {
    const { actionsRef, unmount } = renderCart();
    await waitFor(() => expect(actionsRef.current).toBeTruthy());

    // Empty cart
    actionsRef.current.handleCheckout();
    expect(alertSpy).toHaveBeenCalledWith('Cart is empty');

    // Invalid total (< 0.01) with zero-priced item
    await act(async () => {
      actionsRef.current.addToCart({ ...mockProducts[0], price: 0 }, 1);
    });
    // Wait for item to appear
    await screen.findByText('Product 1');
    actionsRef.current.handleCheckout();
    expect(alertSpy).toHaveBeenNthCalledWith(2, 'Invalid total amount');

    // Valid checkout
    const onCheckout = jest.fn();
    unmount();
    const { actionsRef: actionsRef2 } = renderCart({ onCheckout });
    await waitFor(() => expect(actionsRef2.current).toBeTruthy());
    await act(async () => {
      actionsRef2.current.addToCart(mockProducts[1], 1); // $20
    });
    fireEvent.click(screen.getByText(/Proceed to Checkout/i));
    expect(onCheckout).toHaveBeenCalledWith(
      expect.arrayContaining([{ productId: '2', name: 'Product 2', price: 20, quantity: 1 }]),
      22 // subtotal 20, tax 2
    );
    expect(screen.getByTestId('checkout-modal')).toBeInTheDocument();
  });

  it('allows VIP30 discount (min purchase) and reflects uncapped discount', async () => {
    const { actionsRef } = renderCart();
    await waitFor(() => expect(actionsRef.current).toBeTruthy());
    const actions = actionsRef.current;
    await act(async () => {
      actions.addToCart(mockProducts[0], 100); // subtotal 1000
    });

    fireEvent.change(screen.getByPlaceholderText(/Discount code/i), { target: { value: 'VIP30' } });
    fireEvent.click(screen.getByText(/Apply/i));

    // 30% of 1000 = 300 (component does not cap at maxDiscount)
    expect(screen.getByText('-$300.00')).toBeInTheDocument();
    // Tax on 700 => 70
    expect(screen.getByText('$70.00')).toBeInTheDocument();
    expect(screen.getByText('$770.00')).toBeInTheDocument();
  });
});
