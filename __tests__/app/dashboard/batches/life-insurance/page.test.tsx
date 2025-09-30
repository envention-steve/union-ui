import React from 'react';
import { render, screen } from '@testing-library/react';
import { backendApiClient } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';
import LifeInsurancePage from '@/app/dashboard/batches/life-insurance/[id]/page';

// Mock API client similar to other tests in the repo so we can spy on lifeInsuranceBatches.get
jest.mock('@/lib/api-client', () => ({
  backendApiClient: {
    lifeInsuranceBatches: {
      get: jest.fn(),
    },
  },
}));

// Mock next/navigation hooks used by the page
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

describe('LifeInsurance batch page', () => {
  const sampleResponse = {
    id: 123,
    batch_number: 'BATCH-001',
    created_at: '2025-09-01T00:00:00Z',
    coverages: [
      {
        id: 1,
        life_insurance_person_id: 555,
        member: {
          first_name: 'Alice',
          last_name: 'Smith',
          unique_id: 'AS555',
          birth_date: '1980-01-01T00:00:00Z',
        },
        pending_health_balance: '$1,234.56',
        status: 'pending',
      },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders metadata and a member row', async () => {
  const getMock = jest.spyOn(backendApiClient.lifeInsuranceBatches, 'get').mockResolvedValue(sampleResponse as any);

    // Provide router/params mocks the page expects
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

    render(<LifeInsurancePage /> as any);

  // Wait for members table to populate
  expect(await screen.findByText('Life Insurance Members (1)')).toBeInTheDocument();

  // Member row should show formatted name (last, first) and unique id
  expect(screen.getByText('Smith, Alice')).toBeInTheDocument();
  expect(screen.getByText('AS555')).toBeInTheDocument();

    expect(getMock).toHaveBeenCalledWith('123');
  });
});
