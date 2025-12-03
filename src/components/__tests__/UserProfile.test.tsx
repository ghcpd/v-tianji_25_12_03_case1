import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should allow saving changes and call onUpdate', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (api.updateUserProfile as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Jane' });

    const onUpdate = jest.fn();
    render(<UserProfile userId="1" onUpdate={onUpdate} />);

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Edit Profile/i));

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane' } });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane' })));
  });

  it('should not allow edits when readonly is true', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" readonly />);

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
  });

  it('should allow retry after error', async () => {
    (api.fetchUserData as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(mockUser);

    render(<UserProfile userId="1" />);

    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Retry/i));

    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
  });

  it('formatLastLogin should show Today/Yesterday/Days ago', async () => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2025-12-03T12:00:00Z'));

    const todayUser = { ...mockUser, metadata: { lastLogin: '2025-12-03T00:00:00Z' } };
    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(todayUser);
    const { rerender } = render(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText(/Today/i)).toBeInTheDocument());

    const yesterdayUser = { ...mockUser, metadata: { lastLogin: '2025-12-02T00:00:00Z' } };
    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(yesterdayUser);
    rerender(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText(/Yesterday/i)).toBeInTheDocument());

    const daysUser = { ...mockUser, metadata: { lastLogin: '2025-11-30T00:00:00Z' } };
    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(daysUser);
    rerender(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText(/days ago|,/i)).toBeInTheDocument());

    jest.useRealTimers();
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
});
