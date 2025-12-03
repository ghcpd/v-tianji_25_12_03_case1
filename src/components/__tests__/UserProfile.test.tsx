import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../UserProfile';
import * as api from '@/services/api';
import * as validation from '@/utils/validation';

jest.mock('@/services/api');
jest.mock('@/utils/validation');
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

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

const mockAdminUser = {
  ...mockUser,
  id: '2',
  name: 'Admin User',
  role: 'admin' as const,
};

const mockInactiveUser = {
  ...mockUser,
  id: '3',
  name: 'Inactive User',
  status: 'inactive' as const,
};

const mockSuspendedUser = {
  ...mockUser,
  id: '4',
  name: 'Suspended User',
  status: 'suspended' as const,
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validation.validateEmail as jest.Mock).mockReturnValue(true);
    (validation.validatePhone as jest.Mock).mockReturnValue(true);
  });

  describe('Loading and Error States', () => {
    it('should render loading state initially', () => {
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

    it('should handle generic error without message', async () => {
      (api.fetchUserData as jest.Mock).mockRejectedValue('String error');
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load user/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (api.fetchUserData as jest.Mock).mockRejectedValue(new Error('Network error'));
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });

    it('should reload user when retry button is clicked', async () => {
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

    it('should show empty state when no user found', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(null);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/No user found/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Display', () => {
    it('should display user name', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display user role badge', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('user')).toBeInTheDocument();
      });
    });

    it('should display user status badge', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });

    it('should display correct role badge color for admin', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockAdminUser);
      render(<UserProfile userId="2" />);
      
      await waitFor(() => {
        const badge = screen.getByText('admin');
        expect(badge).toHaveClass('red');
      });
    });

    it('should display correct role badge color for guest', async () => {
      const guestUser = { ...mockUser, role: 'guest' as const };
      (api.fetchUserData as jest.Mock).mockResolvedValue(guestUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        const badge = screen.getByText('guest');
        expect(badge).toHaveClass('gray');
      });
    });

    it('should display correct status badge color for inactive', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockInactiveUser);
      render(<UserProfile userId="3" />);
      
      await waitFor(() => {
        const badge = screen.getByText('inactive');
        expect(badge).toHaveClass('yellow');
      });
    });

    it('should display correct status badge color for suspended', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockSuspendedUser);
      render(<UserProfile userId="4" />);
      
      await waitFor(() => {
        const badge = screen.getByText('suspended');
        expect(badge).toHaveClass('red');
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByText(/Edit Profile/i);
      fireEvent.click(editButton);
      
      expect(screen.getByText(/Save/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    it('should not show edit button in readonly mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" readonly={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
    });

    it('should exit edit mode when cancel is clicked', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      expect(screen.getByText(/Save/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Cancel/i));
      expect(screen.queryByText(/Save/i)).not.toBeInTheDocument();
    });

    it('should reset form data when cancel is clicked', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      fireEvent.click(screen.getByText(/Cancel/i));
      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      expect(nameInput.value).toBe('John Doe');
    });

    it('should clear validation errors when cancel is clicked', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (validation.validateEmail as jest.Mock).mockReturnValue(false);
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Cancel/i));
      expect(screen.queryByText(/Invalid email format/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email on change', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (validation.validateEmail as jest.Mock).mockReturnValue(false);
      
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

    it('should show error for name less than 2 characters', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'A' } });
      
      fireEvent.submit(screen.getByRole('form') || screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty name', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate phone format', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (validation.validatePhone as jest.Mock).mockReturnValue(false);
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const phoneInput = screen.getByLabelText(/Phone/i);
      fireEvent.change(phoneInput, { target: { value: 'invalid' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid phone format/i)).toBeInTheDocument();
      });
    });

    it('should not show phone error if phone is empty', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const phoneInput = screen.getByLabelText(/Phone/i);
      fireEvent.change(phoneInput, { target: { value: '' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.queryByText(/Invalid phone format/i)).not.toBeInTheDocument();
      });
    });

    it('should disable save button when validation errors exist', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (validation.validateEmail as jest.Mock).mockReturnValue(false);
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      
      await waitFor(() => {
        const saveButton = screen.getByText(/Save/i) as HTMLButtonElement;
        expect(saveButton.disabled).toBe(true);
      });
    });

    it('should mark invalid inputs with aria-invalid', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (validation.validateEmail as jest.Mock).mockReturnValue(false);
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      
      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with updated data', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Jane Doe' });
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(api.updateUserProfile).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Jane Doe' }));
      });
    });

    it('should exit edit mode after successful save', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Jane Doe' });
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.queryByText(/Save/i)).not.toBeInTheDocument();
      });
    });

    it('should call onUpdate callback after successful save', async () => {
      const onUpdate = jest.fn();
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockResolvedValue(updatedUser);
      
      render(<UserProfile userId="1" onUpdate={onUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(updatedUser);
      });
    });

    it('should show error message on save failure', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('Save failed'));
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Save failed/i)).toBeInTheDocument();
      });
    });

    it('should handle generic error on save', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockRejectedValue('Generic error');
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to update user/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'A' } });
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(api.updateUserProfile).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during save', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Role Management', () => {
    it('should allow changing role in edit mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const guestRadio = screen.getByRole('radio', { name: /guest/i });
      expect(guestRadio).toBeInTheDocument();
    });

    it('should not allow admin to change their own role', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockAdminUser);
      render(<UserProfile userId="2" />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const adminRadio = screen.getByRole('radio', { name: /admin/i }) as HTMLInputElement;
      expect(adminRadio.disabled).toBe(true);
    });

    it('should not allow role change in readonly mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" readonly={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    it('should toggle status when checkbox is clicked', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const statusCheckbox = screen.getByRole('checkbox', { name: /Active Status/i }) as HTMLInputElement;
      expect(statusCheckbox.checked).toBe(true);
      
      fireEvent.click(statusCheckbox);
      expect(statusCheckbox.checked).toBe(false);
    });

    it('should not allow status toggle in readonly mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" readonly={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByRole('checkbox', { name: /Active Status/i })).not.toBeInTheDocument();
    });
  });

  describe('Last Login Display', () => {
    it('should format last login as "Today"', async () => {
      const today = new Date().toISOString();
      const userWithTodayLogin = { ...mockUser, metadata: { lastLogin: today } };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithTodayLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Today/i)).toBeInTheDocument();
      });
    });

    it('should format last login as "Yesterday"', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const userWithYesterdayLogin = { ...mockUser, metadata: { lastLogin: yesterday } };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithYesterdayLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Yesterday/i)).toBeInTheDocument();
      });
    });

    it('should format last login as "X days ago"', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const userWithOldLogin = { ...mockUser, metadata: { lastLogin: threeDaysAgo } };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithOldLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: 3 days ago/i)).toBeInTheDocument();
      });
    });

    it('should show date for logins older than 7 days', async () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const userWithOldLogin = { ...mockUser, metadata: { lastLogin: oldDate } };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithOldLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login:/i)).toBeInTheDocument();
      });
    });

    it('should show "Never" when no last login', async () => {
      const userWithoutLogin = { ...mockUser, metadata: {} };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithoutLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Never/i)).toBeInTheDocument();
      });
    });

    it('should show "Never" when metadata is undefined', async () => {
      const userWithoutMetadata = { ...mockUser, metadata: undefined };
      
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithoutMetadata);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Never/i)).toBeInTheDocument();
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme by default', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        const profile = screen.getByTestId('user-profile');
        expect(profile).toHaveClass('light');
      });
    });

    it('should apply dark theme when specified', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" theme="dark" />);
      
      await waitFor(() => {
        const profile = screen.getByTestId('user-profile');
        expect(profile).toHaveClass('dark');
      });
    });
  });

  describe('Debounced Email Validation', () => {
    it('should use debounced email value for validation', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // Debounce is mocked to return value immediately
      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com');
      });
    });
  });

  describe('Input Disabling', () => {
    it('should disable inputs when loading', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockImplementation(() => new Promise(() => {}));
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
        expect(nameInput.disabled).toBe(true);
      });
    });

    it('should disable inputs when not in edit mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
        expect(nameInput.disabled).toBe(true);
      });
    });
  });

  describe('Error Banner', () => {
    it('should show error banner during edit mode if error occurs', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));
      
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      fireEvent.submit(screen.getByTestId('user-profile').querySelector('form')!);
      
      await waitFor(() => {
        const banner = screen.getByRole('alert');
        expect(banner).toHaveTextContent('Update failed');
      });
    });
  });
});
