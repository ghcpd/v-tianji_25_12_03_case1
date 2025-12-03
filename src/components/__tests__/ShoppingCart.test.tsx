import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingCart } from '../ShoppingCart';
import { Product } from '@/types';

const mockProducts: Product[] = [
  { id: '1', name: 'Product 1', price: 10, category: 'A', stock: 100 },
  { id: '2', name: 'Product 2', price: 20, category: 'B', stock: 50 },
  { id: '3', name: 'Freebie', price: 0, category: 'C', stock: 10 },
];

describe('ShoppingCart', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });
  it('should render empty cart message', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('should display item count', () => {
    render(<ShoppingCart products={mockProducts} />);
    expect(screen.getByText(/0 items/i)).toBeInTheDocument();
  });

  it('should add items to cart and update quantities', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api.addToCart(mockProducts[0]);
      api.addToCart(mockProducts[0]);
    });

    expect(screen.getByText(/Shopping Cart \(2 items\)/)).toBeInTheDocument();
    const itemRow = screen.getAllByTestId('cart-item')[0];
    expect(within(itemRow).getByText('Product 1')).toBeInTheDocument();
    expect(within(itemRow).getByText('$10.00')).toBeInTheDocument();
    expect(within(itemRow).getByText('2')).toBeInTheDocument();

    const increaseBtn = within(itemRow).getByLabelText('Increase quantity');
    const decreaseBtn = within(itemRow).getByLabelText('Decrease quantity');
    fireEvent.click(increaseBtn);
    expect(within(itemRow).getByText('3')).toBeInTheDocument();
    fireEvent.click(decreaseBtn);
    expect(within(itemRow).getByText('2')).toBeInTheDocument();
  });

  it('should remove item when quantity becomes zero', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[0]));
    const itemRow = screen.getAllByTestId('cart-item')[0];
    const decreaseBtn = within(itemRow).getByLabelText('Decrease quantity');
    fireEvent.click(decreaseBtn);
    await waitFor(() => expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument());
  });

  it('should apply and remove discount code', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart({ id: '10', name: 'Big', price: 100, category: 'Z', stock: 1 } as any));

    const input = screen.getByPlaceholderText(/Discount code/i);
    const user = userEvent.setup();
    await act(async () => {
      await user.type(input, 'SAVE10');
    });
    fireEvent.click(screen.getByText(/Apply/i));

    await waitFor(() => expect(screen.getByText(/Discount \(SAVE10\)/)).toBeInTheDocument());
    expect(screen.getByText(/\$9\.00/)).toBeInTheDocument(); // tax
    expect(screen.getByText(/\$99\.00/)).toBeInTheDocument(); // total

    const removeButtons = screen.getAllByText(/Remove/i);
    fireEvent.click(removeButtons[1]);
    await waitFor(() => expect(screen.queryByText(/Discount \(SAVE10\)/)).not.toBeInTheDocument());
  });

  it('should show alert for invalid discount code', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[0]));

    const input = screen.getByPlaceholderText(/Discount code/i);
    const user = userEvent.setup();
    await act(async () => {
      await user.type(input, 'INVALID');
    });
    fireEvent.click(screen.getByText(/Apply/i));
    expect(alertSpy).toHaveBeenCalledWith('Invalid discount code');
  });

  it('should alert when cart is empty on checkout', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.handleCheckout());
    expect(alertSpy).toHaveBeenCalledWith('Cart is empty');
  });

  it('should alert when total is invalid', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[2])); // price 0
    const checkoutBtn = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkoutBtn);
    expect(alertSpy).toHaveBeenCalledWith('Invalid total amount');
  });

  it('should checkout successfully and show modal', async () => {
    let api: any;
    const onCheckout = jest.fn();
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} onCheckout={onCheckout} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[0]));

    const checkoutBtn = screen.getByText(/Proceed to Checkout/i);
    fireEvent.click(checkoutBtn);
    expect(onCheckout).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('checkout-modal')).toBeInTheDocument());
  });

  it('should clear cart and reset discount state', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[0]));
    const input = screen.getByPlaceholderText(/Discount code/i);
    const user = userEvent.setup();
    await act(async () => {
      await user.type(input, 'SAVE10');
    });
    fireEvent.click(screen.getByText(/Apply/i));
    fireEvent.click(screen.getByText(/Clear Cart/i));
    await waitFor(() => expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument());
    act(() => api.addToCart(mockProducts[0]));
    await screen.findByPlaceholderText(/Discount code/i);
    expect((screen.getByPlaceholderText(/Discount code/i) as HTMLInputElement).value).toBe('');
  });

  it('should respect currency prop', async () => {
    let api: any;
    render(<ShoppingCart products={mockProducts} onReady={(a) => (api = a)} currency="EUR" />);
    await waitFor(() => expect(api).toBeDefined());
    act(() => api.addToCart(mockProducts[0]));
    const itemRow = await screen.findAllByTestId('cart-item');
    expect(within(itemRow[0]).getAllByText(/€10\.00/).length).toBeGreaterThan(0);
  });
});
