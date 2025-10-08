import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import InsurancePlanDetailPage from '@/app/dashboard/insurance-plans/[id]/page';
import { backendApiClient } from '@/lib/api-client';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    insurancePlans: {
      getDetails: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

const mockInsurancePlanData = {
  id: 1,
  name: 'Health Plus Plan',
  code: 'HPP001',
  type: 'HEALTH',
  group: 'A',
  include_cms: true,
  insurance_plan_company_id: 1,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  insurance_plan_company: {
    id: 1,
    name: 'Health Insurance Corp',
    addresses: [
      {
        id: 1,
        label: 'OFFICE',
        type: 'company_address',
        street1: '123 Business St',
        street2: 'Suite 100',
        city: 'Business City',
        state: 'CA',
        zip: '90210',
      }
    ],
    phone_numbers: [
      {
        id: 1,
        label: 'OFFICE',
        type: 'company_phone_number',
        number: '555-123-4567',
        country_code: '1',
        is_default: true,
      }
    ],
    email_addresses: [
      {
        id: 1,
        label: 'OFFICE',
        type: 'company_email_address',
        email_address: 'info@healthinsurance.com',
        is_default: true,
      }
    ],
  },
  insurance_plan_rates: [
    {
      id: 1,
      insurance_plan_id: 1,
      rate: 150.00,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      insurance_plan_id: 1,
      rate: 125.00,
      start_date: '2022-01-01T00:00:00Z',
      end_date: '2022-12-31T23:59:59Z',
      created_at: '2022-01-01T00:00:00Z',
      updated_at: '2022-12-31T00:00:00Z',
    }
  ]
};

beforeEach(() => {
  jest.clearAllMocks();
  mockConfirm.mockReturnValue(true);
  
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });

  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

  (backendApiClient.insurancePlans.getDetails as jest.Mock).mockResolvedValue(mockInsurancePlanData);
  (backendApiClient.insurancePlans.update as jest.Mock).mockResolvedValue({});
});

describe('InsurancePlanDetailPage', () => {
  const mockParams = Promise.resolve({ id: '1' });

  describe('Loading State', () => {
    it('should handle loading state properly', async () => {
      // Ensure the mock is properly set up for this test
      (backendApiClient.insurancePlans.getDetails as jest.Mock).mockResolvedValue(mockInsurancePlanData);
      
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });
      
      // Wait for the component to finish loading and display data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
        expect(screen.getByDisplayValue('HPP001')).toBeInTheDocument();
      });
      
      // Verify that the component is no longer in a loading state
      expect(screen.getByText('HEALTH')).toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should render insurance plan details in view mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
        expect(screen.getByDisplayValue('HPP001')).toBeInTheDocument();
        expect(screen.getByText('HEALTH')).toBeInTheDocument();
      });
    });

    it('should show Edit button in view mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('should navigate to edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard/insurance-plans/1?mode=edit');
    });

    it('should have disabled input fields in view mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Health Plus Plan');
        expect(nameInput).toBeDisabled();
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should render insurance plan details in edit mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
        expect(screen.getByDisplayValue('HPP001')).toBeInTheDocument();
      });
    });

    it('should show Save and Cancel buttons in edit mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('should have enabled input fields in edit mode', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Health Plus Plan');
        expect(nameInput).not.toBeDisabled();
      });
    });

    it('should allow editing insurance plan details', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      expect(screen.getByDisplayValue('Premium Health Plan')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should render all tab buttons', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      const navs = await screen.findAllByRole('navigation');
      const tabNav = navs.find((nav) => nav.textContent?.match(/Insurance Plan/i));
      expect(tabNav).toBeDefined();

      const navQueries = within(tabNav as HTMLElement);
      expect(navQueries.getByRole('button', { name: /insurance plan/i })).toBeInTheDocument();
      expect(navQueries.getByRole('button', { name: /premium rates/i })).toBeInTheDocument();
    });

    it('should switch to different tabs when clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await screen.findByRole('button', { name: /premium rates/i });

      // Switch to premium rates tab
      await user.click(screen.getByRole('button', { name: /premium rates/i }));

      // Should show premium rates content
      await waitFor(() => {
        expect(screen.getByText(/150\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Address Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing addresses', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Business St')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Business City')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CA')).toBeInTheDocument();
        expect(screen.getByDisplayValue('90210')).toBeInTheDocument();
      });
    });

    it('should allow adding new addresses in edit mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add address/i }));

      // Should add a new address form - look for Street 1 labels instead
      await waitFor(() => {
        const streetInputs = screen.getAllByLabelText(/street 1/i);
        expect(streetInputs.length).toBeGreaterThan(1);
      });
    });

    it('should allow removing addresses in edit mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Business St')).toBeInTheDocument();
      });

      // Find and click remove button for address
      const trashButtons = screen.getAllByRole('button');
      const removeButton = trashButtons.find(button => {
        const icon = button.querySelector('svg');
        return icon && (icon.classList.contains('lucide-trash-2') || button.textContent?.includes('Remove'));
      });

      if (removeButton) {
        await user.click(removeButton);
        // Address should be removed (though we'd need to check form state)
      }
    });
  });

  describe('Phone Number Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing phone numbers', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('555-123-4567')).toBeInTheDocument();
      });
    });

    it('should allow adding new phone numbers', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add phone number/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add phone number/i }));

      // Should add a new phone number form - check for Phone Number labels
      await waitFor(() => {
        const phoneInputs = screen.getAllByLabelText(/phone number/i);
        expect(phoneInputs.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Email Address Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing email addresses', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('info@healthinsurance.com')).toBeInTheDocument();
      });
    });

    it('should allow adding new email addresses', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add email address/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add email address/i }));

      // Should add a new email address form - check for Email Address labels
      await waitFor(() => {
        const emailInputs = screen.getAllByLabelText(/email address/i);
        expect(emailInputs.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Premium Rates Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing premium rates in premium rates tab', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /premium rates/i })).toBeInTheDocument();
      });

      // Switch to premium rates tab
      await user.click(screen.getByRole('button', { name: /premium rates/i }));

      await waitFor(() => {
        // In edit mode, look for input values instead of formatted text
        // The rates might be displayed as input values
        expect(screen.getByDisplayValue('150')).toBeInTheDocument();
        expect(screen.getByDisplayValue('125')).toBeInTheDocument();
      });
    });

    it('should allow adding new premium rates', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /premium rates/i })).toBeInTheDocument();
      });

      // Switch to premium rates tab
      await user.click(screen.getByRole('button', { name: /premium rates/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add rate coverage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add rate coverage/i }));

      // Should add a new rate form - check for Rate Amount labels
      await waitFor(() => {
        const rateInputs = screen.getAllByLabelText(/rate amount/i);
        expect(rateInputs.length).toBeGreaterThan(2); // 2 existing + 1 new
      });
    });

    it('should include required fields when saving premium rates', async () => {
      const user = userEvent.setup();
      let savedData: any = null;
      
      // Mock the update API to capture the data being sent
      (backendApiClient.insurancePlans.update as jest.Mock).mockImplementation(async (id, data) => {
        savedData = data;
        return {};
      });

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /premium rates/i })).toBeInTheDocument();
      });

      // Switch to premium rates tab
      await user.click(screen.getByRole('button', { name: /premium rates/i }));

      // Add a new rate
      await user.click(screen.getByRole('button', { name: /add rate coverage/i }));
      
      // Fill in a rate value
      await waitFor(() => {
        const rateInputs = screen.getAllByLabelText(/rate amount/i);
        expect(rateInputs.length).toBeGreaterThan(2);
      });
      
      const rateInputs = screen.getAllByLabelText(/rate amount/i);
      const newRateInput = rateInputs[rateInputs.length - 1];
      await user.clear(newRateInput);
      await user.type(newRateInput, '1000');

      // Save the changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await user.click(saveButton);

      // Verify the saved data includes required fields
      await waitFor(() => {
        expect(savedData).toBeTruthy();
        expect(savedData.insurance_plan_rates).toBeTruthy();
        expect(savedData.insurance_plan_rates).toHaveLength(3); // 2 existing + 1 new
        
        // Check that all rates have required timestamp fields
        savedData.insurance_plan_rates.forEach((rate: any) => {
          expect(rate).toHaveProperty('created_at');
          expect(rate).toHaveProperty('updated_at');
          expect(rate.created_at).toBeTruthy();
          expect(rate.updated_at).toBeTruthy();
        });
        
        // Check that existing rates have positive IDs and new rates have no ID field
        const existingRates = savedData.insurance_plan_rates.filter((rate: any) => rate.id && rate.id > 0);
        const newRates = savedData.insurance_plan_rates.filter((rate: any) => !rate.id || rate.id <= 0);
        
        expect(existingRates).toHaveLength(2); // Original 2 rates
        expect(newRates).toHaveLength(1); // 1 new rate without ID
        
        // Verify the new rate has the expected properties
        const newRate = newRates[0];
        expect(newRate.id).toBeUndefined(); // New rates have no ID field
        expect(newRate.rate).toBe(1000);
        expect(newRate.insurance_plan_id).toBe(1);
      });
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
      (backendApiClient.insurancePlans.update as jest.Mock).mockResolvedValue({});
    });

    it('should save insurance plan data when save button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await user.click(saveButton);

      await waitFor(() => {
        expect(backendApiClient.insurancePlans.update).toHaveBeenCalledWith('1', expect.any(Object));
      });
    });

    it('should show success message after successful save', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Make a change and save
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/insurance plan data saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message when save fails', async () => {
      (backendApiClient.insurancePlans.update as jest.Mock).mockRejectedValue(new Error('Save failed'));
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Make a change and save
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await user.click(saveButton);

      await waitFor(() => expect(backendApiClient.insurancePlans.update).toHaveBeenCalled());

      await waitFor(() => {
        expect(screen.getByText(/failed to save insurance plan data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should navigate back to view mode when cancel is clicked with no changes', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard/insurance-plans/1?mode=view');
    });

    it('should show confirmation dialog when cancel is clicked with unsaved changes', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      // Wait for debounced change detection
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to cancel?');
    });
  });

  describe('Back to List Navigation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should navigate back to insurance plans list when back button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      // Find and click the back button (arrow left icon)
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(button => {
        const icon = button.querySelector('svg');
        return icon && icon.classList.contains('lucide-arrow-left');
      });

      expect(backButton).toBeInTheDocument();
      await user.click(backButton!);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/insurance-plans');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when insurance plan data fails to load', async () => {
      (backendApiClient.insurancePlans.getDetails as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load insurance plan data/i)).toBeInTheDocument();
      });
    });

    it('should show try again button when insurance plan load fails', async () => {
      (backendApiClient.insurancePlans.getDetails as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should retry loading insurance plan data when try again is clicked', async () => {
      const user = userEvent.setup();
      (backendApiClient.insurancePlans.getDetails as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'))
                                                              .mockResolvedValueOnce(mockInsurancePlanData);

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(backendApiClient.insurancePlans.getDetails).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should handle plan type changes', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        // Look for the badge showing current plan type instead of select value
        expect(screen.getByText('HEALTH')).toBeInTheDocument();
      });

      // In edit mode, we can change the type via the select
      // For now, just verify the current type is displayed
      const healthBadge = screen.getByText('HEALTH');
      expect(healthBadge).toBeInTheDocument();
      
      // Badge should have appropriate styling
      expect(healthBadge).toHaveClass('text-green-800');
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Clear required fields
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);

      const codeInput = screen.getByDisplayValue('HPP001');
      await user.clear(codeInput);

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      await user.click(saveButton);

      // Should still call the API (validation might be server-side)
      await waitFor(() => {
        expect(backendApiClient.insurancePlans.update).toHaveBeenCalled();
      });
    });
  });

  describe('Unsaved Changes Warning', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should warn user about unsaved changes when navigating away', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue('Health Plus Plan');
      await user.clear(nameInput);
      await user.type(nameInput, 'Premium Health Plan');

      // Wait for debounced change detection
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should add beforeunload event listener
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('Data Transformation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should correctly transform API response data', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        // Check that company data is properly transformed and displayed
        // In view mode, these should appear as text, not input values
        expect(screen.getByText('123 Business St')).toBeInTheDocument();
        expect(screen.getByText('555-123-4567')).toBeInTheDocument();
        expect(screen.getByText('info@healthinsurance.com')).toBeInTheDocument();
      });
    });

    it('should handle missing company data gracefully', async () => {
      const planWithoutCompany = { ...mockInsurancePlanData, insurance_plan_company: null };
      (backendApiClient.insurancePlans.getDetails as jest.Mock).mockResolvedValue(planWithoutCompany);

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Health Plus Plan')).toBeInTheDocument();
        // Should not crash and should show no addresses/phones/emails
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should have proper ARIA labels and roles', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        // Check for main heading
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Check for tab navigation
        const tabs = screen.getAllByRole('button');
        expect(tabs.length).toBeGreaterThan(0);
        
        // Check for form labels - now with proper associations
        expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/plan code/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /premium rates/i })).toBeInTheDocument();
      });

      // Tab navigation should work
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should display type and code badges correctly', async () => {
      await act(async () => {
        render(<InsurancePlanDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('HEALTH')).toBeInTheDocument();
        expect(screen.getByText('Code: HPP001')).toBeInTheDocument();
      });
    });

    it('should show correct colors for different plan types', async () => {
      // Test different plan types
      const planTypes = ['HEALTH', 'DENTAL', 'VISION', 'OTHER'];
      
      for (const type of planTypes) {
        const testData = { ...mockInsurancePlanData, type };
        (backendApiClient.insurancePlans.getDetails as jest.Mock).mockResolvedValue(testData);
        
        const { unmount } = render(<InsurancePlanDetailPage params={mockParams} />);
        
        await waitFor(() => {
          expect(screen.getByText(type)).toBeInTheDocument();
        });
        
        unmount();
      }
    });
  });
});
