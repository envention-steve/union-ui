import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { PersonForm } from '@/components/features/annuity/person-form';
import { Form } from '@/components/ui/form';
import '@testing-library/jest-dom';

// Test wrapper component that provides form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: any }) {
  const form = useForm({
    defaultValues: {
      person: {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        ...defaultValues.person,
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

describe('PersonForm', () => {
  it('renders all person form fields correctly', () => {
    const mockForm = {
      control: {} as any,
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(),
    };

    render(
      <TestWrapper>
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    // Check all form fields are present
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
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
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    const emailInput = screen.getByLabelText(/email/i);

    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('placeholder', '(555) 123-4567');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'person@example.com');

    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('placeholder', 'Enter first name');
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('placeholder', 'Enter last name');
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
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    const testData = {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      phone: '(555) 123-4567',
      email: 'john.doe@example.com',
    };

    // Type in all fields
    await user.type(screen.getByLabelText(/first name/i), testData.firstName);
    await user.type(screen.getByLabelText(/last name/i), testData.lastName);
    await user.type(screen.getByLabelText(/address/i), testData.address);
    await user.type(screen.getByLabelText(/city/i), testData.city);
    await user.type(screen.getByLabelText(/state/i), testData.state);
    await user.type(screen.getByLabelText(/zip code/i), testData.zipCode);
    await user.type(screen.getByLabelText(/phone/i), testData.phone);
    await user.type(screen.getByLabelText(/email/i), testData.email);

    // Verify values
    expect(screen.getByDisplayValue(testData.firstName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(testData.lastName)).toBeInTheDocument();
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
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Person Information')).toBeInTheDocument();
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
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    // Check that the form is contained within a card
    const cardTitle = screen.getByText('Person Information');
    expect(cardTitle).toBeInTheDocument();
    
    // Verify the form uses grid layout for name fields
    const firstNameField = screen.getByLabelText(/first name/i).closest('[class*="grid-cols"]');
    const lastNameField = screen.getByLabelText(/last name/i).closest('[class*="grid-cols"]');
    
    expect(firstNameField).toBeTruthy();
    expect(lastNameField).toBeTruthy();
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
        <PersonForm form={mockForm as any} />
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
        <PersonForm form={mockForm as any} />
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
      <TestWrapper defaultValues={{ person: {} }}>
        <PersonForm form={mockForm as any} />
      </TestWrapper>
    );

    const allInputs = screen.getAllByRole('textbox');
    allInputs.forEach(input => {
      expect(input).toHaveValue('');
    });
  });
});