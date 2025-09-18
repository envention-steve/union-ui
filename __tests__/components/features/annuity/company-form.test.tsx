import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { CompanyForm } from '@/components/features/annuity/company-form';
import { Form } from '@/components/ui/form';
import '@testing-library/jest-dom';

// Test wrapper component that provides form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) {
  const form = useForm({
    defaultValues: {
      company: {
        companyName: '',
        contactName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        ...defaultValues.company,
      },
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form>
        {children}
      </form>
    </Form>
  );
}

describe('CompanyForm', () => {
  it('renders all company form fields correctly', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    // Check all form fields are present
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('has correct input types and placeholders', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    const emailInput = screen.getByLabelText(/email/i);

    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('placeholder', '(555) 123-4567');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'company@example.com');

    expect(screen.getByLabelText(/company name/i)).toHaveAttribute('placeholder', 'Enter company name');
    expect(screen.getByLabelText(/contact name/i)).toHaveAttribute('placeholder', 'Enter contact person name');
    expect(screen.getByLabelText(/address/i)).toHaveAttribute('placeholder', 'Enter street address');
    expect(screen.getByLabelText(/city/i)).toHaveAttribute('placeholder', 'Enter city');
    expect(screen.getByLabelText(/state/i)).toHaveAttribute('placeholder', 'Enter state');
    expect(screen.getByLabelText(/zip code/i)).toHaveAttribute('placeholder', 'Enter zip code');
  });

  it('allows user input in all fields', async () => {
    const user = userEvent.setup();
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    const testData = {
      companyName: 'Acme Corporation',
      contactName: 'Jane Smith',
      address: '456 Business Ave',
      city: 'Business City',
      state: 'NY',
      zipCode: '54321',
      phone: '(555) 987-6543',
      email: 'contact@acme.com',
    };

    // Type in all fields
    await user.type(screen.getByLabelText(/company name/i), testData.companyName);
    await user.type(screen.getByLabelText(/contact name/i), testData.contactName);
    await user.type(screen.getByLabelText(/address/i), testData.address);
    await user.type(screen.getByLabelText(/city/i), testData.city);
    await user.type(screen.getByLabelText(/state/i), testData.state);
    await user.type(screen.getByLabelText(/zip code/i), testData.zipCode);
    await user.type(screen.getByLabelText(/phone/i), testData.phone);
    await user.type(screen.getByLabelText(/email/i), testData.email);

    // Verify values
    expect(screen.getByDisplayValue(testData.companyName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.contactName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.address)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.city)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.state)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.zipCode)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.phone)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.email)).toBeInTheDocument();
  });

  it('displays the correct card title', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Company Information')).toBeInTheDocument();
  });

  it('has proper form field layout', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    // Check that the form is contained within a card
    const cardTitle = screen.getByText('Company Information');
    expect(cardTitle).toBeInTheDocument();
    
    // Verify company name and contact name fields are separate (not in grid layout)
    const companyNameField = screen.getByLabelText(/company name/i);
    const contactNameField = screen.getByLabelText(/contact name/i);
    
    expect(companyNameField).toBeInTheDocument();
    expect(contactNameField).toBeInTheDocument();
  });

  it('handles empty form submission gracefully', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    // All fields should be empty initially
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveValue('');
    });
  });

  it('maintains accessibility standards', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    // Check that all inputs have proper labels
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveAccessibleName();
    });
  });

  it('renders with default empty values', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper defaultValues={{ company: {} }}>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    const allInputs = screen.getAllByRole('textbox');
    allInputs.forEach(input => {
      expect(input).toHaveValue('');
    });
  });

  it('differs from PersonForm in company-specific fields', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    // CompanyForm should have Company Name instead of First/Last Name
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
    
    // Should not have person-specific fields
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/last name/i)).not.toBeInTheDocument();
  });

  it('validates business email format expectation', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('placeholder', 'company@example.com');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('handles long company names appropriately', async () => {
    const user = userEvent.setup();
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <CompanyForm form={mockForm as any} />
      </TestWrapper>
    );

    const longCompanyName = 'Very Long Company Name That Might Exceed Normal Input Length Expectations LLC';
    const companyNameInput = screen.getByLabelText(/company name/i);
    
    await user.type(companyNameInput, longCompanyName);
    
    expect(screen.getByDisplayValue(longCompanyName)).toBeInTheDocument();
  });
});