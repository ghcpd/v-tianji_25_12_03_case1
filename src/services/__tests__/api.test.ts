import axios from 'axios';
import { fetchUserData, updateUserProfile, deleteUser, fetchUsers } from '../api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser = {
  id: '1',
  name: 'John',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user' as const,
  status: 'active' as const,
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

    it('should fetch user with metadata', async () => {
      const userWithMetadata = {
        ...mockUser,
        metadata: {
          lastLogin: '2024-01-01T00:00:00Z',
          preferences: { theme: 'dark' },
        },
      };

      mockedAxios.get.mockResolvedValue({ data: userWithMetadata });

      const result = await fetchUserData('1');
      expect(result).toEqual(userWithMetadata);
      expect(result.metadata?.lastLogin).toBe('2024-01-01T00:00:00Z');
    });

    it('should handle different user roles', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      mockedAxios.get.mockResolvedValue({ data: adminUser });

      const result = await fetchUserData('1');
      expect(result.role).toBe('admin');
    });

    it('should handle different user statuses', async () => {
      const inactiveUser = { ...mockUser, status: 'inactive' as const };
      mockedAxios.get.mockResolvedValue({ data: inactiveUser });

      const result = await fetchUserData('1');
      expect(result.status).toBe('inactive');
    });

    it('should throw error when request fails', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toThrow('Network error');
    });

    it('should throw error for 404 not found', async () => {
      const error = { response: { status: 404 } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('999')).rejects.toEqual(error);
    });

    it('should throw error for 500 server error', async () => {
      const error = { response: { status: 500 } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toEqual(error);
    });

    it('should handle empty user ID', async () => {
      mockedAxios.get.mockResolvedValue({ data: null });

      const result = await fetchUserData('');
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users/');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedData = { name: 'Jane' };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.patch).toHaveBeenCalledWith('https://api.example.com/users/1', updatedData);
    });

    it('should update user email', async () => {
      const updatedData = { email: 'newemail@example.com' };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.email).toBe('newemail@example.com');
    });

    it('should update user phone', async () => {
      const updatedData = { phone: '+9876543210' };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.phone).toBe('+9876543210');
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

    it('should update multiple fields at once', async () => {
      const updatedData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+9876543210',
      };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.name).toBe('Jane Doe');
      expect(result.email).toBe('jane@example.com');
      expect(result.phone).toBe('+9876543210');
    });

    it('should update user metadata', async () => {
      const updatedData = {
        metadata: { preferences: { theme: 'dark' } },
      };
      const mockResponse = { ...mockUser, ...updatedData };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.metadata?.preferences).toEqual({ theme: 'dark' });
    });

    it('should handle partial updates', async () => {
      const updatedData = { name: 'Updated Name' };
      const mockResponse = { ...mockUser, name: 'Updated Name' };

      mockedAxios.patch.mockResolvedValue({ data: mockResponse });

      const result = await updateUserProfile('1', updatedData);
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw error when update fails', async () => {
      const error = new Error('Update failed');
      mockedAxios.patch.mockRejectedValue(error);

      await expect(updateUserProfile('1', { name: 'Jane' })).rejects.toThrow('Update failed');
    });

    it('should throw error for validation failures', async () => {
      const error = { response: { status: 400, data: { message: 'Invalid email' } } };
      mockedAxios.patch.mockRejectedValue(error);

      await expect(updateUserProfile('1', { email: 'invalid' })).rejects.toEqual(error);
    });

    it('should throw error for unauthorized access', async () => {
      const error = { response: { status: 401 } };
      mockedAxios.patch.mockRejectedValue(error);

      await expect(updateUserProfile('1', { name: 'Jane' })).rejects.toEqual(error);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteUser('1');
      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/1');
    });

    it('should handle successful deletion with no response data', async () => {
      mockedAxios.delete.mockResolvedValue({ data: null });

      await expect(deleteUser('1')).resolves.toBeUndefined();
    });

    it('should throw error when delete fails', async () => {
      const error = new Error('Delete failed');
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteUser('1')).rejects.toThrow('Delete failed');
    });

    it('should throw error for 404 not found', async () => {
      const error = { response: { status: 404 } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteUser('999')).rejects.toEqual(error);
    });

    it('should throw error for unauthorized deletion', async () => {
      const error = { response: { status: 403 } };
      mockedAxios.delete.mockRejectedValue(error);

      await expect(deleteUser('1')).rejects.toEqual(error);
    });

    it('should handle empty user ID', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await deleteUser('');
      expect(mockedAxios.delete).toHaveBeenCalledWith('https://api.example.com/users/');
    });
  });

  describe('fetchUsers', () => {
    const mockUsers = [
      mockUser,
      { ...mockUser, id: '2', name: 'Jane', email: 'jane@example.com' },
      { ...mockUser, id: '3', name: 'Bob', email: 'bob@example.com' },
    ];

    it('should fetch users list successfully', async () => {
      const mockResponse = { users: mockUsers, total: 3 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers();
      expect(result).toEqual(mockResponse);
      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', { params: undefined });
    });

    it('should fetch users with pagination parameters', async () => {
      const mockResponse = { users: mockUsers.slice(0, 2), total: 3 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ page: 1, limit: 2 });
      expect(result.users).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { page: 1, limit: 2 },
      });
    });

    it('should fetch users with search parameter', async () => {
      const mockResponse = { users: [mockUsers[0]], total: 1 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ search: 'John' });
      expect(result.users).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { search: 'John' },
      });
    });

    it('should fetch users with all parameters', async () => {
      const mockResponse = { users: mockUsers.slice(0, 1), total: 1 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ page: 2, limit: 10, search: 'test' });
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.example.com/users', {
        params: { page: 2, limit: 10, search: 'test' },
      });
    });

    it('should handle empty users list', async () => {
      const mockResponse = { users: [], total: 0 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers();
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle large page numbers', async () => {
      const mockResponse = { users: [], total: 100 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ page: 100, limit: 10 });
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(100);
    });

    it('should throw error when fetch fails', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUsers()).rejects.toThrow('Network error');
    });

    it('should throw error for server errors', async () => {
      const error = { response: { status: 500 } };
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUsers()).rejects.toEqual(error);
    });

    it('should handle search with no results', async () => {
      const mockResponse = { users: [], total: 0 };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchUsers({ search: 'nonexistent' });
      expect(result.users).toHaveLength(0);
    });
  });

  describe('API Base URL', () => {
    it('should use correct base URL for all endpoints', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockUser });
      mockedAxios.patch.mockResolvedValue({ data: mockUser });
      mockedAxios.delete.mockResolvedValue({});

      await fetchUserData('1');
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('https://api.example.com'));

      await updateUserProfile('1', {});
      expect(mockedAxios.patch).toHaveBeenCalledWith(expect.stringContaining('https://api.example.com'), {});

      await deleteUser('1');
      expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('https://api.example.com'));

      await fetchUsers();
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('https://api.example.com'), expect.anything());
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const error = new Error('timeout of 5000ms exceeded');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toThrow('timeout of 5000ms exceeded');
    });

    it('should handle CORS errors', async () => {
      const error = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toThrow('Network Error');
    });

    it('should handle connection refused', async () => {
      const error = { code: 'ECONNREFUSED' };
      mockedAxios.get.mockRejectedValue(error);

      await expect(fetchUserData('1')).rejects.toEqual(error);
    });
  });
});
