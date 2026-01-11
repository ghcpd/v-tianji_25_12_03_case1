import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';
import * as api from '@/services/api';

jest.mock('@/services/api');
jest.useFakeTimers();

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
  id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+0987654321',
  role: 'admin' as const,
  status: 'active' as const,
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      (api.fetchUserData as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<UserProfile userId="1" />);
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it('should show spinner while loading', () => {
      (api.fetchUserData as jest.Mock).mockImplementation(() => new Promise(() => {}));
      render(<UserProfile userId="1" />);
      const spinner = screen.getByText(/Loading/i);
      expect(spinner).toHaveClass('spinner');
    });
  });

  describe('Data Loading', () => {
    it('should render user data after loading', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should fetch user data with correct userId', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="123" />);
      
      await waitFor(() => {
        expect(api.fetchUserData).toHaveBeenCalledWith('123');
      });
    });

    it('should display user email', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });
    });

    it('should display user phone', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
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
        const statusBadges = screen.getAllByText('active');
        expect(statusBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on load failure', async () => {
      (api.fetchUserData as jest.Mock).mockRejectedValue(new Error('Network error'));
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (api.fetchUserData as jest.Mock).mockRejectedValue(new Error('Network error'));
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });
    });

    it('should retry loading on retry button click', async () => {
      (api.fetchUserData as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockUser);

      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByText(/Retry/i);
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display error banner', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane' } });
      fireEvent.click(screen.getByText(/Save/i));

      await waitFor(() => {
        expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
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

    it('should show role selection in edit mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const roleRadios = screen.getAllByName('role');
      expect(roleRadios.length).toBeGreaterThan(0);
    });

    it('should show status checkbox in edit mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const statusCheckbox = screen.getByRole('checkbox', { name: /Active Status/i });
      expect(statusCheckbox).toBeInTheDocument();
    });

    it('should not show edit button in readonly mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" readonly={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Edit Profile/i)).not.toBeInTheDocument();
    });

    it('should not allow editing in readonly mode', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" readonly={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Name/i);
      expect(nameInput).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate email on change', async () => {
      jest.useFakeTimers();
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should clear email error on valid input', async () => {
      jest.useFakeTimers();
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      jest.advanceTimersByTime(500);

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.queryByText(/Invalid email format/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should validate required name field', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.click(screen.getByText(/Save/i));

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate phone format if provided', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const phoneInput = screen.getByLabelText(/Phone/i);
      fireEvent.change(phoneInput, { target: { value: 'invalid' } });
      fireEvent.click(screen.getByText(/Save/i));

      await waitFor(() => {
        expect(screen.getByText(/Invalid phone format/i)).toBeInTheDocument();
      });
    });

    it('should disable save button when validation errors exist', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveBtn = screen.getByText(/Save/i);
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should update user profile on save', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockResolvedValue({
        ...mockUser,
        name: 'Jane Doe',
      });

      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Jane Doe' } });
      fireEvent.click(screen.getByText(/Save/i));

      await waitFor(() => {
        expect(api.updateUserProfile).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'Jane Doe',
        }));
      });
    });

    it('should call onUpdate callback after successful update', async () => {
      const onUpdate = jest.fn();
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      (api.updateUserProfile as jest.Mock).mockResolvedValue(mockUser);

      render(<UserProfile userId="1" onUpdate={onUpdate} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      fireEvent.click(screen.getByText(/Save/i));

      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should cancel edit and revert changes', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      fireEvent.click(screen.getByText(/Cancel/i));

      expect(nameInput.value).toBe('John Doe');
    });
  });

  describe('Role Management', () => {
    it('should prevent non-admin from changing role to admin', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const adminRadio = screen.getByDisplayValue('admin') as HTMLInputElement;
      expect(adminRadio).toBeDisabled();
    });

    it('should disable role change for admin users', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockAdminUser);
      render(<UserProfile userId="2" />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const roleRadios = screen.getAllByName('role') as HTMLInputElement[];
      roleRadios.forEach(radio => {
        expect(radio).toBeDisabled();
      });
    });
  });

  describe('Status Management', () => {
    it('should toggle status on checkbox change', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Edit Profile/i));
      
      const statusCheckbox = screen.getByRole('checkbox', { name: /Active Status/i });
      fireEvent.click(statusCheckbox);

      await waitFor(() => {
        expect(statusCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Metadata Display', () => {
    it('should display last login information', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login:/i)).toBeInTheDocument();
      });
    });

    it('should display "Never" for users without last login', async () => {
      const userWithoutLogin = { ...mockUser, metadata: {} };
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithoutLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Never/i)).toBeInTheDocument();
      });
    });

    it('should format recent last login as Today', async () => {
      const now = new Date();
      const userWithRecentLogin = {
        ...mockUser,
        metadata: { lastLogin: now.toISOString() },
      };
      (api.fetchUserData as jest.Mock).mockResolvedValue(userWithRecentLogin);
      render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Login: Today/i)).toBeInTheDocument();
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme by default', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      const { container } = render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const profile = container.querySelector('.user-profile.light');
      expect(profile).toBeInTheDocument();
    });

    it('should apply dark theme when specified', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      const { container } = render(<UserProfile userId="1" theme="dark" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const profile = container.querySelector('.user-profile.dark');
      expect(profile).toBeInTheDocument();
    });
  });

  describe('User ID Changes', () => {
    it('should reload user when userId prop changes', async () => {
      (api.fetchUserData as jest.Mock).mockResolvedValue(mockUser);
      const { rerender } = render(<UserProfile userId="1" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      (api.fetchUserData as jest.Mock).clearMocks();
      (api.fetchUserData as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: '2',
        name: 'Different User',
      });

      rerender(<UserProfile userId="2" />);

      await waitFor(() => {
        expect(api.fetchUserData).toHaveBeenCalledWith('2');
      });
    });
  });
});
