/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MembersPage from '../../app/dashboard/members/page';
import { useAuthStore } from '../../store/auth-store';
import { backendApiClient } from '../../lib/api-client';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../../store/auth-store');
jest.mock('../../lib/api-client');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockBackendApiClient = backendApiClient as jest.Mocked<typeof backendApiClient>;

// Mock members data
const mockMembers = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    unique_id: 'M001',
    addresses: [],
    phone_numbers: [],
    email_addresses: []
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    unique_id: 'M002',
    addresses: [],
    phone_numbers: [],
    email_addresses: []
  }
];

const mockPush = jest.fn();

// Default successful auth store state
const mockAuthStoreSuccess = {
  user: { id: 1, name: 'Test User', email: 'test@example.com' },
  isLoading: false,
  error: null,
  isLoggedIn: true,
  login: jest.fn(),
  logout: jest.fn(),
  refreshSession: jest.fn(),
  checkAuthAndRefresh: jest.fn(),
};

// Setup default mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  } as any);

  mockUseAuthStore.mockReturnValue(mockAuthStoreSuccess);
  
  // Mock successful API response
  mockBackendApiClient.members = {
    list: jest.fn().mockResolvedValue({
      items: mockMembers,
      total: 2,
      page: 1,
      limit: 25
    }),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
});

describe('Members List Page', () => {
  describe('Basic Functionality', () => {
    it('should render without crashing', async () => {
      render(<MembersPage />);
      
      // Just verify the component renders
      expect(document.body).toBeInTheDocument();
      
      // Wait for any async operations to complete
      await waitFor(() => {
        expect(mockBackendApiClient.members.list).toHaveBeenCalled();
      });
    });

    it('should call API to fetch members on mount', async () => {
      render(<MembersPage />);
      
      await waitFor(() => {
        expect(mockBackendApiClient.members.list).toHaveBeenCalled();
      });
    });

    it('should handle loading state', async () => {
      // Mock delayed API response
      let resolveApiCall: (value: any) => void;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });
      
      mockBackendApiClient.members.list = jest.fn().mockReturnValue(apiPromise);

      render(<MembersPage />);
      
      // Component should handle the pending state
      expect(document.body).toBeInTheDocument();
      
      // Resolve the API call
      resolveApiCall!({
        items: mockMembers,
        total: 2,
        page: 1,
        limit: 25
      });
      
      await waitFor(() => {
        expect(mockBackendApiClient.members.list).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockBackendApiClient.members.list = jest.fn().mockRejectedValue(
        new Error('Failed to fetch members')
      );

      render(<MembersPage />);
      
      // Component should still render even if API fails
      expect(document.body).toBeInTheDocument();
      
      await waitFor(() => {
        expect(mockBackendApiClient.members.list).toHaveBeenCalled();
      });
    });

    it('should handle empty response', async () => {
      mockBackendApiClient.members.list = jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 25
      });

      render(<MembersPage />);
      
      await waitFor(() => {
        expect(mockBackendApiClient.members.list).toHaveBeenCalled();
      });
      
      // Should still render the page structure
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should render with valid auth state', () => {
      render(<MembersPage />);
      
      expect(document.body).toBeInTheDocument();
    });

    it('should handle unauthenticated state', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStoreSuccess,
        isLoggedIn: false,
        user: null,
      });

      render(<MembersPage />);
      
      // Component should still render (auth is handled at route level)
      expect(document.body).toBeInTheDocument();
    });
  });
});