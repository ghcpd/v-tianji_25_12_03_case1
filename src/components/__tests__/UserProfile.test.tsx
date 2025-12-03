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

  it('should not show edit controls when readonly', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" readonly />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
  });

  it('should disable role changing when current user is admin', async () => {
    const adminUser = { ...mockUser, role: 'admin' };
    (api.fetchUserData as jest.Mock).mockResolvedValue(adminUser);
    render(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Edit Profile/i));
    // radio inputs are rendered but should be disabled for admins
    const adminRadio = screen.getByLabelText('admin') as HTMLInputElement;
    expect(adminRadio.disabled).toBe(true);
  });

  it('should update user on submit and call onUpdate', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    const updatedUser = { ...mockUser, name: 'Jane Doe' };
    (api.updateUserProfile as jest.Mock).mockResolvedValue(updatedUser);
    const onUpdate = jest.fn();

    render(<UserProfile userId="1" onUpdate={onUpdate} />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Edit Profile/i));
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updatedUser));
  });

  it('should display an error banner if update fails', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('save failed'));

    render(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('should cancel edits and restore form data', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Edit Profile/i));
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    expect((nameInput as HTMLInputElement).value).toBe('New Name');

    fireEvent.click(screen.getByText(/Cancel/i));
    expect((nameInput as HTMLInputElement).value).toBe('John Doe');
  });

  it('formatLastLogin should show Today/Yesterday/Days ago', async () => {
    // set 'now' to Jan 3 2024
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2024-01-03T12:00:00Z'));

    const veryRecent = { ...mockUser, metadata: { lastLogin: '2024-01-03T00:00:00Z' } };
    const yesterday = { ...mockUser, metadata: { lastLogin: '2024-01-02T00:00:00Z' } };
    const threeDaysAgo = { ...mockUser, metadata: { lastLogin: '2023-12-31T00:00:00Z' } };

    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(veryRecent);
    const { rerender } = render(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText('Today')).toBeInTheDocument());

    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(yesterday);
    rerender(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText('Yesterday')).toBeInTheDocument());

    (api.fetchUserData as jest.Mock).mockResolvedValueOnce(threeDaysAgo);
    rerender(<UserProfile userId="1" />);
    await waitFor(() => expect(screen.getByText(/days ago/i)).toBeInTheDocument());

    jest.useRealTimers();
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
