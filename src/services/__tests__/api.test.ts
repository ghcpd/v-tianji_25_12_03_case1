import axios from 'axios';
import { fetchUserData, updateUserProfile, deleteUser, fetchUsers, User } from '../api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user',
  status: 'active',
};

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserData', () => {
    it('should fetch user data successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await fetchUserData('1');
      expect(result).toEqual(mockUser);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/1');
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toThrow('Network error');
    });

    it('should handle 404 errors', async () => {
      const error = new Error('Not found');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('nonexistent')).rejects.toThrow();
    });

    it('should call API with correct user ID', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      await fetchUserData('user-123');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/user-123');
    });

    it('should return user with metadata', async () => {
      const userWithMetadata: User = {
        ...mockUser,
        metadata: {
          lastLogin: '2024-01-01T00:00:00Z',
          preferences: { theme: 'dark' },
        },
      };
      mockedAxios.get.mockResolvedValue({ data: userWithMetadata });

      const result = await fetchUserData('1');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.lastLogin).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedData = { name: 'Jane' };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        updatedData
      );
    });

    it('should handle partial updates', async () => {
      const updatedData = { email: 'newemail@example.com' };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.email).toBe('newemail@example.com');
      expect(result.name).toBe(mockUser.name);
    });

    it('should update user role', async () => {
      const updatedData = { role: 'admin' as const };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.role).toBe('admin');
    });

    it('should update user status', async () => {
      const updatedData = { status: 'inactive' as const };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.status).toBe('inactive');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockedAxios.patch.mockRejectedValue(error);

      await expect(updateUserProfile('1', { name: 'Jane' })).rejects.toThrow('Update failed');
    });

    it('should send correct data structure', async () => {
      const updatedData = { name: 'Jane', email: 'jane@example.com' };
      mockedAxios.patch.mockResolvedValue({ data: mockUser });

      await updateUserProfile('1', updatedData);
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        updatedData
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteUser('1');
      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/1');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteUser('1')).rejects.toThrow('Delete failed');
    });

    it('should handle 404 on delete', async () => {
      const error = new Error('User not found');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteUser('nonexistent')).rejects.toThrow();
    });

    it('should call API with correct user ID', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteUser('user-456');
      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/user-456');
    });
  });

  describe('fetchUsers', () => {
    it('should fetch list of users', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers();
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', { params: undefined });
    });

    it('should fetch users with pagination', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 100,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { page: 1, limit: 10 },
      });
    });

    it('should fetch users with search query', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 1,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ search: 'john' });
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { search: 'john' },
      });
    });

    it('should fetch users with all parameters', async () => {
      const mockResponse = {
        users: [mockUser],
        total: 50,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ page: 2, limit: 20, search: 'active' });
      expect(result.total).toBe(50);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { page: 2, limit: 20, search: 'active' },
      });
    });

    it('should handle empty user list', async () => {
      const mockResponse = {
        users: [],
        total: 0,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers();
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Fetch failed');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUsers()).rejects.toThrow('Fetch failed');
    });

    it('should return multiple users', async () => {
      const mockResponse = {
        users: [mockUser, { ...mockUser, id: '2', name: 'Jane' }],
        total: 2,
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers();
      expect(result.users).toHaveLength(2);
    });
  });
});
