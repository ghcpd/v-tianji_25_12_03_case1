import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';
import * as api from '@/services/api';

jest.mock('@/services/api');

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user' as const,
  status: 'active' as const,
  metadata: {
    lastLogin: '2024-01-01T00:00:00Z',
  },
};

const mockAdmin = {
  ...mockUser,
  id: 'admin',
  role: 'admin' as const,
};

const mockInactive = {
  ...mockUser,
  id: 'inactive',
  status: 'inactive' as const,
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should render loading state', () => {
    (api.fetchUserData as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<UserProfile userId="1" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should render user data after loading', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display error message on load failure', async () => {
    (api.fetchUserData as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should enter edit mode when edit button is clicked', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByText(/Edit Profile/i);
    fireEvent.click(editButton);
    
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });

  it('should validate email on change', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Edit Profile/i));
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should validate name and phone on submit', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await screen.findByText('John Doe');

    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '123' } });
    fireEvent.click(screen.getByText(/Save/i));
    expect(await screen.findByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/Invalid phone format/i)).toBeInTheDocument();
  });

  it('should prevent role change for admin and readonly', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockAdmin);
    render(<UserProfile userId="admin" readonly />);
    await screen.findByText('John Doe');
    expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
  });

  it('should toggle status when not readonly', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockInactive);
    render(<UserProfile userId="inactive" />);
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByText(/Edit Profile/i));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should submit updates and call onUpdate', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (api.updateUserProfile as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Jane' });
    const onUpdate = jest.fn();
    render(<UserProfile userId="1" onUpdate={onUpdate} />);
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText(/Save/i));
    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(screen.queryByText(/Save/i)).not.toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('should handle submit error', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));
    render(<UserProfile userId="1" />);
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.click(screen.getByText(/Save/i));
    await screen.findByText(/Update failed/i);
  });

  it('should cancel edits and reset form', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByText(/Edit Profile/i));
    const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(screen.queryByText(/Save/i)).not.toBeInTheDocument();
    expect(nameInput.value).toBe('John Doe');
  });

  it('should render last login variations', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-10T12:00:00Z'));
    (api.fetchUserData as jest.Mock)
      .mockResolvedValueOnce({ ...mockUser, metadata: { lastLogin: '2024-01-10T08:00:00Z' } })
      .mockResolvedValueOnce({ ...mockUser, metadata: { lastLogin: '2024-01-09T12:00:00Z' } })
      .mockResolvedValueOnce({ ...mockUser, metadata: { lastLogin: '2024-01-05T12:00:00Z' } })
      .mockResolvedValueOnce({ ...mockUser, metadata: { lastLogin: '2023-12-01T12:00:00Z' } })
      .mockResolvedValueOnce({ ...mockUser, metadata: { lastLogin: undefined } });

    const { rerender } = render(<UserProfile userId="1" />);
    await screen.findByText(/Last Login: Today/);

    rerender(<UserProfile userId="2" />);
    await screen.findByText(/Last Login: Yesterday/);

    rerender(<UserProfile userId="3" />);
    await screen.findByText(/Last Login: 5 days ago/);

    rerender(<UserProfile userId="4" />);
    await screen.findByText(/Last Login:/);

    rerender(<UserProfile userId="5" />);
    await screen.findByText(/Last Login: Never/);
  });

  it('should display badges with correct classes', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    const badgeRole = await screen.findByText(/user/);
    expect(badgeRole.className).toMatch(/badge/);
  });
});
