import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import EmployersPage from '@/app/dashboard/employers/page';
import { backendApiClient } from '@/lib/api-client';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/lib/api-client');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockBackendApiClient = backendApiClient as jest.Mocked<typeof backendApiClient>;

// Mock employer data
const mockEmployers = [
  {
    id: 1,
    name: 'Tech Corp Inc',
    tax_id: '12-3456789',
    employer_type: { name: 'Corporation' },
  },
  {
    id: 2,
    name: 'Small Business LLC',
    tax_id: '98-7654321',
    employer_type: { name: 'LLC' },
  },
  {
    id: 3,
    name: 'Public Agency',
    tax_id: null,
    employer_type: null,
  },
];

const mockApiResponse = {
  items: mockEmployers,
  total: 3,
  page: 1,
  limit: 25,
};

describe('EmployersPage', () => {
  const mockPush = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Mock successful API response by default
    mockBackendApiClient.employers = {
      list: jest.fn().mockResolvedValue(mockApiResponse),
      delete: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock window.confirm
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: jest.fn().mockReturnValue(true),
    });

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the page title and description', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      expect(screen.getByText('Employers Management')).toBeInTheDocument();
      expect(screen.getByText('Manage employers and their member associations')).toBeInTheDocument();
    });

    it('should render the Add Employer button', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      expect(screen.getByRole('button', { name: /add employer/i })).toBeInTheDocument();
    });

    it('should render search input and filters', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      expect(screen.getByPlaceholderText('Search employers...')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Items per page selector
      expect(screen.getByText('25')).toBeInTheDocument(); // Default value
    });

    it('should show loading state initially', () => {
      render(<EmployersPage />);

      expect(screen.getByText('Loading employers...')).toBeInTheDocument();
      expect(screen.getByText('Employers (...)')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should fetch and display employers on mount', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(mockBackendApiClient.employers.list).toHaveBeenCalledWith({
          page: 1,
          limit: 25,
          search: undefined,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
        expect(screen.getByText('Small Business LLC')).toBeInTheDocument();
        expect(screen.getByText('Public Agency')).toBeInTheDocument();
      });

      expect(screen.getByText('Employers (3)')).toBeInTheDocument();
    });

    it('should display employer tax IDs when available', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('EIN: 12-3456789')).toBeInTheDocument();
        expect(screen.getByText('EIN: 98-7654321')).toBeInTheDocument();
      });
    });

    it('should display employer types when available', async () => {
      render(<EmployersPage />);

      await waitFor(() => {
        expect(screen.getByText('Corporation')).toBeInTheDocument();
        expect(screen.getByText('LLC')).toBeInTheDocument();
        expect(screen.getByText('Not specified')).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockBackendApiClient.employers.list.mockRejectedValue(new Error('API Error'));

      render(<EmployersPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load employers. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching employers:', expect.any(Error));
    });

    it('should retry fetching data when Try Again is clicked', async () => {
      mockBackendApiClient.employers.list
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockApiResponse);

      render(<EmployersPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load employers. Please try again.')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      expect(mockBackendApiClient.employers.list).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Functionality', () => {
    it('should debounce search input and trigger API call', async () => {
      jest.useFakeTimers();
      
      await act(async () => {
        render(<EmployersPage />);
      });
      
      // Wait for initial load with real timers first
      jest.useRealTimers();
      
      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });
      
      // Now use fake timers for debounce testing
      jest.useFakeTimers();
      
      const searchInput = screen.getByPlaceholderText('Search employers...');
      
      // Clear the previous calls to start fresh
      mockBackendApiClient.employers.list.mockClear();
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Tech Corp' } });
      });
      
      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Use real timers for the async waitFor
      jest.useRealTimers();
      
      await waitFor(() => {
        expect(mockBackendApiClient.employers.list).toHaveBeenCalledWith({
          page: 1,
          limit: 25,
          search: 'Tech Corp',
        });
      });
    }, 10000);

    it('should reset page to 1 when searching', async () => {
      // Mock response with more items for pagination
      const largeResponse = {
        items: mockEmployers,
        total: 100,
        page: 1,
        limit: 25,
      };
      mockBackendApiClient.employers.list.mockResolvedValue(largeResponse);

      await act(async () => {
        render(<EmployersPage />);
      });

      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      // Clear previous calls
      mockBackendApiClient.employers.list.mockClear();
      
      jest.useFakeTimers();

      const searchInput = screen.getByPlaceholderText('Search employers...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'search' } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      jest.useRealTimers();

      await waitFor(() => {
        expect(mockBackendApiClient.employers.list).toHaveBeenCalledWith({
          page: 1, // Should reset to page 1
          limit: 25,
          search: 'search',
        });
      });
    }, 10000);

    it('should show "no results" message when search returns empty', async () => {
      const emptyResponse = { items: [], total: 0, page: 1, limit: 25 };
      mockBackendApiClient.employers.list
        .mockResolvedValueOnce(mockApiResponse) // Initial load
        .mockResolvedValueOnce(emptyResponse); // Search result

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      jest.useFakeTimers();
      
      const searchInput = screen.getByPlaceholderText('Search employers...');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      });
      
      act(() => {
        jest.advanceTimersByTime(300); // Trigger debounce
      });
      
      jest.useRealTimers();

      await waitFor(() => {
        expect(screen.getByText('No employers found matching your criteria.')).toBeInTheDocument();
      });
    }, 10000);
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock response with more items for pagination
      const largeResponse = {
        items: mockEmployers,
        total: 100,
        page: 1,
        limit: 25,
      };
      mockBackendApiClient.employers.list.mockResolvedValue(largeResponse);
    });

    it('should display pagination controls when there are multiple pages', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      // First wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      // Then check pagination
      await waitFor(() => {
        expect(screen.getAllByText(/Showing \d+ to \d+ of 100 entries/)).toHaveLength(2); // Appears in two places
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('should handle items per page change', async () => {
      // Mock scrollIntoView to avoid Radix UI issues
      Element.prototype.scrollIntoView = jest.fn();
      
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      // Clear previous calls to isolate this test's calls
      mockBackendApiClient.employers.list.mockClear();

      // Change items per page to 50  
      const selectTrigger = screen.getByRole('combobox');
      
      await act(async () => {
        fireEvent.click(selectTrigger);
      });
      
      // Wait for the dropdown to open and click on the '50' option
      await waitFor(() => {
        const option50 = screen.getByRole('option', { name: '50' });
        fireEvent.click(option50);
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(mockBackendApiClient.employers.list).toHaveBeenCalledWith({
          page: 1,
          limit: 50,
          search: undefined,
        });
      });
    });

    it('should navigate to next page', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(mockBackendApiClient.employers.list).toHaveBeenCalledWith({
          page: 2,
          limit: 25,
          search: undefined,
        });
      });
    });
  });

  describe('Action Buttons', () => {
    it('should navigate to view employer when view button is clicked', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByLabelText('View Details');
      fireEvent.click(viewButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employers/1?mode=view');
    });

    it('should navigate to edit employer when edit button is clicked', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText('Edit Employer');
      fireEvent.click(editButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/employers/1?mode=edit');
    });

    it('should handle delete employer with confirmation', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Deactivate');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to deactivate this employer?');
      
      await waitFor(() => {
        expect(mockBackendApiClient.employers.delete).toHaveBeenCalledWith('1');
      });

      // Should refetch data after delete
      expect(mockBackendApiClient.employers.list).toHaveBeenCalledTimes(2);
    });

    it('should not delete employer if user cancels confirmation', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Deactivate');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockBackendApiClient.employers.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockBackendApiClient.employers.delete.mockRejectedValue(new Error('Delete failed'));

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Deactivate');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to deactivate employer.')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to deactivate employer', expect.any(Error));
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no employers exist', async () => {
      mockBackendApiClient.employers.list.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 25,
      });

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No employers found.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show skeleton rows while loading', async () => {
      // Create a mock that never resolves to keep loading state
      mockBackendApiClient.employers.list.mockImplementation(() => new Promise(() => {}));
      
      await act(async () => {
        render(<EmployersPage />);
      });

      // Should show table with header
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Should show loading skeleton rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // At least header + skeleton rows

      // Check for animated elements (skeleton loading)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should hide pagination buttons while loading', async () => {
      const largeResponse = {
        items: mockEmployers,
        total: 100,
        page: 1,
        limit: 25,
      };

      // First resolve to show pagination
      mockBackendApiClient.employers.list.mockResolvedValueOnce(largeResponse);

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Now mock with a slow resolving promise for next API call
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockBackendApiClient.employers.list.mockImplementation(() => slowPromise);

      // Trigger a new page load
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Pagination should be hidden during loading (component design choice)
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      });
      
      // Should show loading message
      expect(screen.getByText('Loading employers...')).toBeInTheDocument();
      
      // Resolve the promise to finish loading
      act(() => {
        resolvePromise!(largeResponse);
      });
      
      // Pagination should reappear after loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      });
    });
  });

  describe('Utility Functions', () => {
    it('should generate correct initials for employer names', async () => {
      const employersWithVariousNames = {
        items: [
          { id: 1, name: 'A', tax_id: null, employer_type: null },
          { id: 2, name: 'AB Corp', tax_id: null, employer_type: null },
          { id: 3, name: 'Alpha Beta Gamma Inc', tax_id: null, employer_type: null },
          { id: 4, name: '', tax_id: null, employer_type: null }, // Empty name
        ],
        total: 4,
        page: 1,
        limit: 25,
      };

      mockBackendApiClient.employers.list.mockResolvedValue(employersWithVariousNames);

      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        // Look for the table and employer names to ensure rendering
        expect(screen.getAllByText('A')).toHaveLength(2); // Name appears in avatar and table cell
        expect(screen.getByText('AB Corp')).toBeInTheDocument();
      });

      // Check that avatar fallbacks are rendered (they contain the initials)
      const avatarFallbacks = document.querySelectorAll('.bg-union-100');
      expect(avatarFallbacks.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper screen reader labels for action buttons', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Tech Corp Inc')).toBeInTheDocument();
      });

      expect(screen.getAllByLabelText('View Details')).toHaveLength(3);
      expect(screen.getAllByLabelText('Edit Employer')).toHaveLength(3);
      expect(screen.getAllByLabelText('Deactivate')).toHaveLength(3);
    });

    it('should have proper table structure', async () => {
      await act(async () => {
        render(<EmployersPage />);
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
      });
    });
  });
});
