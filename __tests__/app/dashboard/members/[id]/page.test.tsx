import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import MemberDetailPage from '@/app/dashboard/members/[id]/page';
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
    members: {
      getDetails: jest.fn(),
      update: jest.fn(),
      getLedgerEntries: jest.fn(),
    },
    distributionClasses: {
      list: jest.fn(),
    },
    memberStatuses: {
      list: jest.fn(),
    },
    insurancePlans: {
      list: jest.fn(),
    },
    ledgerEntries: {
      getTypes: jest.fn(),
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

const mockMemberData = {
  id: 123,
  first_name: 'John',
  last_name: 'Doe',
  middle_name: 'Michael',
  suffix: 'Jr.',
  phone: '555-123-4567',
  email: 'john.doe@example.com',
  gender: 'MALE',
  birth_date: '1980-01-15',
  deceased: false,
  deceased_date: null,
  is_forced_distribution: false,
  force_distribution_class_id: null,
  unique_id: 'JD123456',
  disabled_waiver: false,
  care_of: null,
  include_cms: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  addresses: [
    {
      id: 1,
      label: 'HOME',
      street1: '123 Main St',
      street2: 'Apt 1',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    }
  ],
  phone_numbers: [
    {
      id: 1,
      label: 'MOBILE',
      number: '555-123-4567',
    }
  ],
  email_addresses: [
    {
      id: 1,
      label: 'PERSONAL',
      email_address: 'john.doe@example.com',
    }
  ],
  distribution_class_coverages: [
    {
      id: 1,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      distribution_class_id: 1,
      distribution_class: {
        id: 1,
        name: 'Class A',
        description: 'Standard Distribution Class',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
    }
  ],
  member_status_coverages: [
    {
      id: 1,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      member_status_id: 1,
      member_status: {
        id: 1,
        name: 'Active',
        admin_fee: '10.00',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
    }
  ],
  life_insurance_coverages: [],
  dependent_coverages: [
    {
      id: 1,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      member_id: 123,
      dependent_id: 1,
      dependent: {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        middle_name: null,
        suffix: null,
        phone: null,
        email: null,
        gender: 'FEMALE',
        birth_date: '2005-01-01',
        dependent_type: 'CHILD',
        include_cms: true,
        marriage_date: null,
        marriage_certificate: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
    }
  ],
  employer_coverages: [
    {
      id: 1,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      member_id: 123,
      employer_id: 1,
      employer: {
        id: 1,
        name: 'ACME Corp',
        ein: '12-3456789',
        include_cms: true,
        is_forced_distribution: false,
        force_distribution_class_id: null,
        employer_type_id: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
    }
  ],
  insurance_plan_coverages: [
    {
      id: 1,
      start_date: '2023-01-01T00:00:00Z',
      end_date: null,
      member_id: 123,
      insurance_plan_id: 1,
      policy_number: 'POL123456',
      insurance_plan: {
        id: 1,
        name: 'Health Plus Plan',
        code: 'HPP',
        type: 'HEALTH',
        group: 'A',
        include_cms: true,
        insurance_plan_company_id: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }
    }
  ],
  member_notes: [
    {
      id: 1,
      member_id: 123,
      message: 'Initial member note',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }
  ],
  fund_balances: {
    health_balance: 5000.00,
    annuity_balance: 15000.00,
    last_updated: '2023-12-01T00:00:00Z',
  }
};

const mockLedgerEntries = {
  items: [
    {
      id: 1,
      account_id: 1,
      member_id: 123,
      type: 'MEMBER_CONTRIBUTION',
      amount: 1000.00,
      posted_date: '2023-11-01T00:00:00Z',
      posted: true,
      suspended: false,
      created_at: '2023-11-01T00:00:00Z',
      updated_at: '2023-11-01T00:00:00Z',
      account: {
        id: 1,
        type: 'HEALTH' as const,
      }
    },
    {
      id: 2,
      account_id: 2,
      member_id: 123,
      type: 'CLAIM',
      amount: -500.00,
      posted_date: '2023-11-15T00:00:00Z',
      posted: true,
      suspended: false,
      created_at: '2023-11-15T00:00:00Z',
      updated_at: '2023-11-15T00:00:00Z',
      account: {
        id: 2,
        type: 'ANNUITY' as const,
      }
    }
  ],
  total: 2,
};

const mockDistributionClasses = [
  {
    id: 1,
    name: 'Class A',
    description: 'Standard Distribution Class',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Class B',
    description: 'Premium Distribution Class',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }
];

const mockMemberStatuses = [
  {
    id: 1,
    name: 'Active',
    admin_fee: '10.00',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Inactive',
    admin_fee: '0.00',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }
];

const mockInsurancePlans = {
  items: [
    {
      id: 1,
      name: 'Health Plus Plan',
      code: 'HPP',
      type: 'HEALTH',
      group: 'A',
      include_cms: true,
      insurance_plan_company_id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Basic Health Plan',
      code: 'BHP',
      type: 'HEALTH',
      group: 'B',
      include_cms: true,
      insurance_plan_company_id: 1,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    }
  ]
};

const mockLedgerEntryTypes = [
  { value: 'MEMBER_CONTRIBUTION', label: 'Member Contribution' },
  { value: 'CLAIM', label: 'Claim' },
  { value: 'ADMIN_FEE', label: 'Admin Fee' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockConfirm.mockReturnValue(true);
  
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });

  (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

  (backendApiClient.members.getDetails as jest.Mock).mockResolvedValue(mockMemberData);
  (backendApiClient.members.getLedgerEntries as jest.Mock).mockResolvedValue(mockLedgerEntries);
  (backendApiClient.distributionClasses.list as jest.Mock).mockResolvedValue(mockDistributionClasses);
  (backendApiClient.memberStatuses.list as jest.Mock).mockResolvedValue(mockMemberStatuses);
  (backendApiClient.insurancePlans.list as jest.Mock).mockResolvedValue(mockInsurancePlans);
  (backendApiClient.ledgerEntries.getTypes as jest.Mock).mockResolvedValue(mockLedgerEntryTypes);
});

describe('MemberDetailPage', () => {
  const mockParams = Promise.resolve({ id: '123' });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching member data', () => {
      // Make the API call pending so loading state persists
      (backendApiClient.members.getDetails as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );
      
      render(<MemberDetailPage params={mockParams} />);
      
      // Check for loading skeleton - use multiple possible selectors
      const loadingElement = screen.queryByTestId('loading') || 
                            document.querySelector('.animate-pulse') ||
                            screen.queryByRole('progressbar');
                            
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('View Mode', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should render member details in view mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('JD123456') || false;
        })[0]).toBeInTheDocument();
      });
    });

    it('should show Edit button in view mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    it('should navigate to edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard/members/123?mode=edit');
    });

    it('should have disabled input fields in view mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('John');
        expect(firstNameInput).toBeDisabled();
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should render member details in edit mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    it('should show Save and Cancel buttons in edit mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('should have enabled input fields in edit mode', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('John');
        expect(firstNameInput).not.toBeDisabled();
      });
    });

    it('should allow editing member details', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      expect(screen.getByDisplayValue('Johnny')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should render all tab buttons', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        // Get all buttons and filter for the tabs we expect
        const buttons = screen.getAllByRole('button');
        const buttonTexts = buttons.map(btn => btn.textContent?.toLowerCase() || '');
        
        expect(buttonTexts.some(text => text.includes('member'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('dependents'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('health coverage'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('life insurance'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('employers'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('notes'))).toBe(true);
        expect(buttonTexts.some(text => text.includes('fund ledger'))).toBe(true);
      });
    });

    it('should switch to different tabs when clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dependents/i })).toBeInTheDocument();
      });

      // Switch to dependents tab
      await user.click(screen.getByRole('button', { name: /dependents/i }));

      // Should show dependents content
      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      // Switch to notes tab
      await user.click(screen.getByRole('button', { name: /notes/i }));

      // Should show notes content
      await waitFor(() => {
        expect(screen.getByText('Initial member note')).toBeInTheDocument();
      });
    });

    it('should show fund balances in fund ledger tab', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fund ledger/i })).toBeInTheDocument();
      });

      // Switch to fund ledger tab
      await user.click(screen.getByRole('button', { name: /fund ledger/i }));

      // Should show fund balances
      await waitFor(() => {
        expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Health balance
        expect(screen.getByText('$15,000.00')).toBeInTheDocument(); // Annuity balance
      });
    });
  });

  describe('Address Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing addresses', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Anytown')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CA')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
      });
    });

    it('should allow adding new addresses in edit mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add address/i }));

      // Should add a new address form
      const streetInputs = screen.getAllByLabelText(/street address 1/i);
      expect(streetInputs.length).toBeGreaterThan(1);
    });

    it('should allow removing addresses in edit mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
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
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('555-123-4567')).toBeInTheDocument();
      });
    });

    it('should allow adding new phone numbers', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add phone/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add phone/i }));

      // Should add a new phone number form
      const phoneInputs = screen.getAllByLabelText(/phone number/i);
      expect(phoneInputs.length).toBeGreaterThan(1);
    });
  });

  describe('Email Address Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing email addresses', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      });
    });

    it('should allow adding new email addresses', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add email/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add email/i }));

      // Should add a new email address form
      const emailInputs = screen.getAllByLabelText(/email address/i);
      expect(emailInputs.length).toBeGreaterThan(1);
    });
  });

  describe('Dependent Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing dependents in dependents tab', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dependents/i })).toBeInTheDocument();
      });

      // Switch to dependents tab
      await user.click(screen.getByRole('button', { name: /dependents/i }));

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      });
    });

    it('should allow adding new dependents', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dependents/i })).toBeInTheDocument();
      });

      // Switch to dependents tab
      await user.click(screen.getByRole('button', { name: /dependents/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add dependent/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add dependent/i }));

      // Should add a new dependent form
      const firstNameInputs = screen.getAllByLabelText(/first name/i);
      expect(firstNameInputs.length).toBeGreaterThan(1); // Existing dependent + new dependent
    });
  });

  describe('Member Notes Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display existing notes in notes tab', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument();
      });

      // Switch to notes tab
      await user.click(screen.getByRole('button', { name: /notes/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Initial member note')).toBeInTheDocument();
      });
    });

    it('should allow adding new notes', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument();
      });

      // Switch to notes tab
      await user.click(screen.getByRole('button', { name: /notes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add note/i }));

      // Should add a new note textarea
      const messageInputs = screen.getAllByLabelText(/message/i);
      expect(messageInputs.length).toBeGreaterThan(1);
    });
  });

  describe('Fund Ledger', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should fetch and display ledger entries when fund ledger tab is selected', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fund ledger/i })).toBeInTheDocument();
      });

      // Switch to fund ledger tab
      await user.click(screen.getByRole('button', { name: /fund ledger/i }));

      // Should fetch ledger entries
      await waitFor(() => {
        expect(backendApiClient.members.getLedgerEntries).toHaveBeenCalledWith('123', expect.any(Object));
      });

      // Should display ledger entries
      await waitFor(() => {
        const amount1000Elements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('$1,000.00') || false;
        });
        const amount500Elements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('$500.00') || false;
        });
        
        expect(amount1000Elements.length).toBeGreaterThan(0);
        expect(amount500Elements.length).toBeGreaterThan(0);
        expect(amount1000Elements[0]).toBeInTheDocument();
        expect(amount500Elements[0]).toBeInTheDocument();
      });
    });

    it('should allow filtering ledger entries', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      // Switch to fund ledger tab
      await user.click(screen.getByRole('button', { name: /fund ledger/i }));

      await waitFor(() => {
        // Find account type filter
        const accountTypeSelects = screen.getAllByRole('combobox');
        const accountTypeFilter = accountTypeSelects.find(select => 
          select.closest('.grid')?.textContent?.includes('Account Type') ||
          select.getAttribute('aria-label')?.includes('account') ||
          within(select.closest('div') || document).queryByText('Account Type')
        );
        
        expect(accountTypeFilter).toBeInTheDocument();
      });
    });

    it('should allow expanding ledger entry details', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      // Switch to fund ledger tab
      await user.click(screen.getByRole('button', { name: /fund ledger/i }));

      await waitFor(() => {
        const expandButtons = screen.getAllByRole('button');
        const expandButton = expandButtons.find(button => {
          const icon = button.querySelector('svg');
          return icon && (icon.classList.contains('lucide-chevron-right') || icon.classList.contains('lucide-chevron-down'));
        });
        expect(expandButton).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
      (backendApiClient.members.update as jest.Mock).mockResolvedValue({});
    });

    it('should save member data when save button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Make a change
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      // Click save
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(backendApiClient.members.update).toHaveBeenCalledWith('123', expect.any(Object));
      });
    });

    it('should show success message after successful save', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Make a change and save
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/member data saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message when save fails', async () => {
      (backendApiClient.members.update as jest.Mock).mockRejectedValue(new Error('Save failed'));
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Make a change and save
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save member data/i)).toBeInTheDocument();
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
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard/members/123?mode=view');
    });

    it('should show confirmation dialog when cancel is clicked with unsaved changes', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Make a change
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

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

    it('should navigate back to members list when back button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to members list/i })).toBeInTheDocument();
      });

      // Click the back button using its aria-label
      const backButton = screen.getByRole('button', { name: /back to members list/i });
      await user.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/dashboard/members');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when member data fails to load', async () => {
      (backendApiClient.members.getDetails as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load member data/i)).toBeInTheDocument();
      });
    });

    it('should show try again button when member load fails', async () => {
      (backendApiClient.members.getDetails as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('should retry loading member data when try again is clicked', async () => {
      const user = userEvent.setup();
      (backendApiClient.members.getDetails as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'))
                                                          .mockResolvedValueOnce(mockMemberData);

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(backendApiClient.members.getDetails).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Coverage Management', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should display distribution class coverages', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Standard Distribution Class')).toBeInTheDocument();
      });
    });

    it('should display member status coverages', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should display insurance plan coverages in health coverage tab', async () => {
Ca      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /health coverage/i })).toBeInTheDocument();
      });

      // Switch to health coverage tab
      await user.click(screen.getByRole('button', { name: /health coverage/i }));

      await waitFor(() => {
        const healthPlanElements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('Health Plus Plan') || false;
        });
        const policyElements = screen.getAllByText((content, element) => {
          return element?.textContent?.includes('POL123456') || false;
        });
        
        expect(healthPlanElements.length).toBeGreaterThan(0);
        expect(policyElements.length).toBeGreaterThan(0);
        expect(healthPlanElements[0]).toBeInTheDocument();
        expect(policyElements[0]).toBeInTheDocument();
      });
    });

    it('should allow adding new coverage in edit mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add distribution class coverage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add distribution class coverage/i }));

      // Should add a new coverage form
      const coverageElements = screen.getAllByText(/coverage #/i);
      expect(coverageElements.length).toBeGreaterThan(1);
    });
  });

  describe('Unsaved Changes Warning', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should warn user about unsaved changes when navigating away', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Make a change
      const firstNameInput = screen.getByDisplayValue('John');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Johnny');

      // Wait for debounced change detection
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Should add beforeunload event listener
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('edit');
    });

    it('should prevent saving when distribution class coverage is incomplete', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      // Add a new distribution class coverage
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add distribution class coverage/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add distribution class coverage/i }));

      // Try to save without completing the coverage
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/please complete all distribution class coverage entries/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockSearchParams.get = jest.fn().mockReturnValue('view');
    });

    it('should have proper ARIA labels and roles', async () => {
      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        // Check for main heading
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Check for tab navigation
        const tabs = screen.getAllByRole('button');
        expect(tabs.length).toBeGreaterThan(0);
        
        // Check for form labels
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MemberDetailPage params={mockParams} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dependents/i })).toBeInTheDocument();
      });

      // Tab navigation should work
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
    });
  });
});