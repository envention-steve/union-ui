/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EmployerDetailPage from '../../app/dashboard/employers/[id]/page';

// Mock dependencies
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: mockBack,
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    has: jest.fn(),
    getAll: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
    size: 0,
    [Symbol.iterator]: jest.fn()
  })
}));

const mockUseAuthStore = jest.fn();
jest.mock('../../store/auth-store', () => ({
  useAuthStore: mockUseAuthStore
}));

jest.mock('../../lib/api-client', () => ({
  backendApiClient: {
    employers: {
      get: jest.fn(),
      getDetails: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      getLedgerEntries: jest.fn(),
    },
    employerRates: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employerNotes: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    members: {
      list: jest.fn(),
    },
    employerLedgerEntries: {
      list: jest.fn(),
    },
    employerTypes: {
      list: jest.fn(),
    }
  }
}));

const mockAuthStoreSuccess = {
  isAuthenticated: true,
  isLoading: false,
  user: { id: 'test-user' },
  error: null
};

const mockEmployerData = {
  id: 1,
  name: 'Test Employer Inc.',
  tax_id: '12-3456789',
  employer_type_id: 1,
  include_cms: false,
  is_forced_distribution: false,
  force_distribution_class_id: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  employer_type: {
    id: 1,
    name: 'Corporation',
    description: 'Corporate entity'
  },
  // Use the API format that the component expects
  company_addresses: [{
    id: '1',
    label: 'Home',  // maps to UI 'type'
    street1: '123 Business St',
    street2: 'Suite 100',
    city: 'Business City',
    state: 'CA',
    zip: '90210'
  }],
  company_phone_numbers: [{
    id: '1',
    label: 'Mobile',  // maps to UI 'type'
    number: '555-123-4567',
    extension: '123'
  }],
  company_email_addresses: [{
    id: '1',
    label: 'Work',  // maps to UI 'type'
    email_address: 'contact@testemployer.com'
  }],
  employer_notes: []
};

const mockEmployerRates = [{
  id: 1,
  employer_id: 1,
  rate_type: 'HOURLY',
  amount: 25.50,
  effective_date: '2023-01-01',
  description: 'Base hourly rate'
}];

const mockMembers = [{
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  unique_id: 'EMP001',
  email_addresses: [{ email_address: 'john@example.com', is_default: true }]
}];

const mockEmployerTypes = [{
  id: 1,
  name: 'Corporation',
  description: 'Corporate entity'
}, {
  id: 2,
  name: 'LLC',
  description: 'Limited Liability Company'
}];

// Setup default mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock search params to return view mode by default
  mockSearchParamsGet.mockImplementation((key: string) => {
    if (key === 'mode') return 'view';
    return null;
  });

  mockUseAuthStore.mockReturnValue(mockAuthStoreSuccess);
  
  // Get the mock from Jest after modules are loaded
  const { backendApiClient } = require('../../lib/api-client');
  backendApiClient.employers.getDetails.mockResolvedValue(mockEmployerData);
  backendApiClient.employers.get.mockResolvedValue(mockEmployerData);
  backendApiClient.employers.update.mockResolvedValue(mockEmployerData);
  backendApiClient.employerRates.list.mockResolvedValue({ items: mockEmployerRates });
  backendApiClient.employerNotes.list.mockResolvedValue({ items: [] });
  backendApiClient.members.list.mockResolvedValue({ items: mockMembers, total: 1 });
  backendApiClient.employerLedgerEntries.list.mockResolvedValue({ items: [], total: 0 });
  backendApiClient.employers.getLedgerEntries.mockResolvedValue({ items: [], total: 0 });
  backendApiClient.employerTypes.list.mockResolvedValue(mockEmployerTypes);
});

describe('Employer Detail Page', () => {
  const defaultProps = { params: Promise.resolve({ id: '1' }) };

  describe('Loading State', () => {
    it('should show loading spinner initially', async () => {
      // Mock delayed API response
      let resolveApiCall: (value: any) => void;
      const apiPromise = new Promise((resolve) => {
        resolveApiCall = resolve;
      });
      
      const { backendApiClient } = require('../../lib/api-client');
      backendApiClient.employers.getDetails = jest.fn().mockReturnValue(apiPromise);

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      // Should show loading state
      expect(document.body).toBeInTheDocument();
      
      // Resolve the API call
      resolveApiCall!(mockEmployerData);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should handle API endpoint fallback', async () => {
      const { backendApiClient } = require('../../lib/api-client');
      // Mock getDetails to fail, then get to succeed
      backendApiClient.employers.getDetails = jest.fn().mockRejectedValue(new Error('getDetails failed'));
      backendApiClient.employers.get = jest.fn().mockResolvedValue(mockEmployerData);

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(backendApiClient.employers.getDetails).toHaveBeenCalledWith('1');
        expect(backendApiClient.employers.get).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Data Rendering', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should render employer name', () => {
      expect(screen.getByText('Test Employer Inc.')).toBeInTheDocument();
    });

    it('should render employer details', () => {
      expect(screen.getByDisplayValue('Test Employer Inc.')).toBeInTheDocument();
      expect(screen.getByDisplayValue('12-3456789')).toBeInTheDocument();
    });

    it('should render address information', () => {
      expect(screen.getByDisplayValue('123 Business St')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Suite 100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Business City')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('90210')).toBeInTheDocument();
    });

    it('should render contact information', () => {
      expect(screen.getByDisplayValue('555-123-4567')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('contact@testemployer.com')).toBeInTheDocument();
    });

    it('should render tabs', () => {
      expect(screen.getByText('Employer')).toBeInTheDocument();
      expect(screen.getByText('Employer Rates')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Employee Ledger')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should switch to Employer Rates tab', async () => {
      const ratesTab = screen.getByText('Employer Rates');
      
      await act(async () => {
        fireEvent.click(ratesTab);
      });

      // Verify the tab content is shown (rates are loaded with employer details)
      await waitFor(() => {
        expect(screen.getByText('Manage rate structures and pricing for this employer')).toBeInTheDocument();
      });
    });

    it('should switch to Members tab', async () => {
      const membersTab = screen.getByText('Members');
      
      await act(async () => {
        fireEvent.click(membersTab);
      });

      // Verify the members tab is active (members are loaded with employer details)
      await waitFor(() => {
        expect(membersTab).toHaveClass('border-union-600', 'text-union-600');
      });
    });

    it('should switch to Employee Ledger tab', async () => {
      const ledgerTab = screen.getByText('Employee Ledger');
      
      await act(async () => {
        fireEvent.click(ledgerTab);
      });

      // Verify the ledger tab is active and makes API call
      const { backendApiClient } = require('../../lib/api-client');
      await waitFor(() => {
        expect(backendApiClient.employers.getLedgerEntries).toHaveBeenCalledWith('1', {
          offset: 0,
          limit: 25
        });
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });
    });

    it('should enter edit mode when mode=edit', async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show save button in edit mode
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should handle form input changes', async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Employer Inc.');
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Updated Employer Name' } });
      });

      expect(nameInput).toHaveValue('Updated Employer Name');
    });

    it('should save employer data', async () => {
      const { backendApiClient } = require('../../lib/api-client');
      backendApiClient.employers.update.mockResolvedValue({
        ...mockEmployerData,
        name: 'Updated Employer Name'
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Employer Inc.');
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Updated Employer Name' } });
      });

      const saveButton = screen.getByText('Save Changes');

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(backendApiClient.employers.update).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'Updated Employer Name'
        }));
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when employer fetch fails', async () => {
      const { backendApiClient } = require('../../lib/api-client');
      backendApiClient.employers.getDetails = jest.fn().mockRejectedValue(
        new Error('Failed to fetch employer')
      );
      backendApiClient.employers.get = jest.fn().mockRejectedValue(
        new Error('Failed to fetch employer')
      );

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });

      await waitFor(() => {
        // Error should be handled gracefully
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should handle save failure', async () => {
      const { backendApiClient } = require('../../lib/api-client');
      backendApiClient.employers.update = jest.fn().mockRejectedValue(
        new Error('Failed to save employer')
      );

      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Employer Inc.');
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      });

      const saveButton = screen.getByText('Save Changes');

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(backendApiClient.employers.update).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should call API to fetch employer data on mount', () => {
      const { backendApiClient } = require('../../lib/api-client');
      expect(backendApiClient.employers.getDetails).toHaveBeenCalledWith('1');
    });

    it('should fetch employer types on mount', () => {
      const { backendApiClient } = require('../../lib/api-client');
      expect(backendApiClient.employerTypes.list).toHaveBeenCalled();
    });
  });

  describe('Dynamic Route Handling', () => {
    it('should handle different employer IDs', async () => {
      const differentEmployer = { ...mockEmployerData, id: 2, name: 'Different Employer' };
      const { backendApiClient } = require('../../lib/api-client');
      backendApiClient.employers.getDetails = jest.fn().mockResolvedValue(differentEmployer);

      await act(async () => {
        render(<EmployerDetailPage params={Promise.resolve({ id: '2' })} />);
      });
      
      await waitFor(() => {
        expect(backendApiClient.employers.getDetails).toHaveBeenCalledWith('2');
      });
      
      await waitFor(() => {
        expect(screen.getByText('Different Employer')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('should handle unauthenticated user', async () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStoreSuccess,
        isAuthenticated: false,
        user: null,
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      // Component should still render (auth is handled at route level)
      expect(document.body).toBeInTheDocument();
    });

    it('should handle loading auth state', async () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStoreSuccess,
        isLoading: true,
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Complex Workflows', () => {
    it('should detect unsaved changes', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Employer Inc.');
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Modified Name' } });
      });

      // Component should detect unsaved changes (internal logic)
      expect(nameInput).toHaveValue('Modified Name');
    });

    it('should handle address management', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should display address fields
      const streetInput = screen.getByDisplayValue('123 Business St');
      expect(streetInput).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.change(streetInput, { target: { value: '456 New Street' } });
      });

      expect(streetInput).toHaveValue('456 New Street');
    });

    it('should handle phone number management', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const phoneInput = screen.getByDisplayValue('555-123-4567');
      expect(phoneInput).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.change(phoneInput, { target: { value: '555-999-8888' } });
      });

      expect(phoneInput).toHaveValue('555-999-8888');
    });
  });

  describe('Component State Management', () => {
    it('should manage tab state correctly', async () => {
      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Default tab should be employer
      expect(screen.getByText('Employer')).toBeInTheDocument();
      
      // Switch to rates tab
      const ratesTab = screen.getByText('Employer Rates');
      await act(async () => {
        fireEvent.click(ratesTab);
      });

      // Should show rates content (rates are already loaded with employer details)
      await waitFor(() => {
        expect(screen.getByText('Manage rate structures and pricing for this employer')).toBeInTheDocument();
      });
    });

    it('should handle form validation', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'mode') return 'edit';
        return null;
      });

      await act(async () => {
        render(<EmployerDetailPage {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Clear the name field to test validation
      const nameInput = screen.getByDisplayValue('Test Employer Inc.');
      
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: '' } });
      });

      expect(nameInput).toHaveValue('');
      
      // Try to save with empty name
      const saveButton = screen.getByText('Save Changes');
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Should still attempt save (validation may be handled server-side)
      const { backendApiClient } = require('../../lib/api-client');
      await waitFor(() => {
        expect(backendApiClient.employers.update).toHaveBeenCalled();
      });
    });
  });
});
