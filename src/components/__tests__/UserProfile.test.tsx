import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
    jest.useRealTimers();
  });

  it('renders loading state', () => {
    (api.fetchUserData as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<UserProfile userId="1" />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders user data after loading', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays error on load failure and retries', async () => {
    (api.fetchUserData as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockUser);
    render(<UserProfile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Retry/i));
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('enters edit mode when edit button is clicked', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);

    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.click(screen.getByText(/Edit Profile/i));
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });

  it('validates email with debounce and clears error when valid', async () => {
    jest.useFakeTimers();
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);

    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.click(screen.getByText(/Edit Profile/i));

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText(/Invalid email format/i)).not.toBeInTheDocument();
  });

  it('validates form fields and prevents submit on errors', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (api.updateUserProfile as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.click(screen.getByText(/Edit Profile/i));

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: 'abc' } });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
    expect(api.updateUserProfile).not.toHaveBeenCalled();
  });

  it('handles role change and status toggle in edit mode', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue({ ...mockUser, role: 'user', status: 'inactive' });
    render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.click(screen.getByText(/Edit Profile/i));
    // Change role to guest
    fireEvent.click(screen.getByDisplayValue('guest'));
    expect((screen.getByDisplayValue('guest') as HTMLInputElement).checked).toBe(true);

    // Toggle status to active
    const statusCheckbox = screen.getByRole('checkbox');
    fireEvent.click(statusCheckbox);
    expect((statusCheckbox as HTMLInputElement).checked).toBe(true);
  });

  it('prevents role change when user is admin or readonly', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue({ ...mockUser, role: 'admin' });
    const { unmount } = render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.click(screen.getByText(/Edit Profile/i));

    // Admin role radio should remain checked and disabled
    const adminRadio = screen.getByDisplayValue('admin') as HTMLInputElement;
    expect(adminRadio.disabled).toBe(true);

    unmount();

    // Render readonly
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" readonly />);
    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
  });

  it('calls onUpdate and shows error banner on update failure', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    const onUpdate = jest.fn();

    // Success
    (api.updateUserProfile as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Jane' });
    render(<UserProfile userId="1" onUpdate={onUpdate} />);
    await waitFor(() => screen.getByText('John Doe'));
    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText(/Save/i));
    await waitFor(() => screen.getByText('Jane'));
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jane' }));

    // Failure
    (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));
    fireEvent.click(screen.getByText(/Edit Profile/i));
    fireEvent.click(screen.getByText(/Save/i));
    await waitFor(() => screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('Update failed');
  });

  it('cancels edits and restores original values', async () => {
    (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));

    fireEvent.click(screen.getByText(/Edit Profile/i));
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText(/Cancel/i));

    expect((screen.getByLabelText(/Name/i) as HTMLInputElement).value).toBe('John Doe');
    expect(screen.queryByText(/Save/i)).not.toBeInTheDocument();
  });

  it('formats last login (Today/Yesterday/Days ago)', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-02T12:00:00Z'));
    (api.fetchUserData as jest.Mock).mockResolvedValue({
      ...mockUser,
      metadata: { lastLogin: '2024-01-02T08:00:00Z' }, // same day
    });
    const { unmount } = render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.getByText(/Last Login: Today/)).toBeInTheDocument();

    unmount();

    (api.fetchUserData as jest.Mock).mockResolvedValue({
      ...mockUser,
      metadata: { lastLogin: '2024-01-01T08:00:00Z' },
    });
    render(<UserProfile userId="1" />);
    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.getByText(/Last Login: Yesterday/)).toBeInTheDocument();
  });
});
