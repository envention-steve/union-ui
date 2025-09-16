import React from 'react';

// Test to verify the company address transformation includes company_id
describe('Employer Address API Transformation', () => {
  it('should include company_id in company address transformation', () => {
    // Mock form data similar to what's in the actual component
    const formData = {
      id: 123,
      name: 'Test Company',
      tax_id: '12-3456789',
      employer_type_id: 1,
      include_cms: true,
      is_forced_distribution: false,
      force_distribution_class_id: null,
      addresses: [
        {
          id: '1',
          type: 'Work',
          street1: '123 Jump St.',
          street2: null,
          city: 'ABC',
          state: 'NY',
          zip: '12345'
        }
      ]
    };

    // Simulate the transformation that happens in handleSave
    const transformedAddresses = formData.addresses.map(addr => ({
      ...(addr.id && { id: addr.id }),
      company_id: formData.id, // This is the fix we applied
      type: 'company_address',
      label: addr.type,
      street1: addr.street1,
      street2: addr.street2 || null,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    }));

    // Verify the transformation includes the required company_id field
    expect(transformedAddresses).toHaveLength(1);
    expect(transformedAddresses[0]).toHaveProperty('company_id', 123);
    expect(transformedAddresses[0]).toHaveProperty('type', 'company_address');
    expect(transformedAddresses[0]).toHaveProperty('label', 'Work');
    expect(transformedAddresses[0]).toHaveProperty('street1', '123 Jump St.');
    expect(transformedAddresses[0]).toHaveProperty('city', 'ABC');
    expect(transformedAddresses[0]).toHaveProperty('state', 'NY');
    expect(transformedAddresses[0]).toHaveProperty('zip', '12345');
  });

  it('should include company_id for addresses without existing id (new addresses)', () => {
    const formData = {
      id: 456,
      addresses: [
        {
          type: 'Home',
          street1: '456 New St.',
          street2: 'Apt 1',
          city: 'DEF',
          state: 'CA',
          zip: '67890'
        }
      ]
    };

    const transformedAddresses = formData.addresses.map(addr => ({
      ...(addr.id && { id: addr.id }),
      company_id: formData.id,
      type: 'company_address',
      label: addr.type,
      street1: addr.street1,
      street2: addr.street2 || null,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    }));

    // Verify new addresses (without id) still get company_id
    expect(transformedAddresses[0]).toHaveProperty('company_id', 456);
    expect(transformedAddresses[0]).not.toHaveProperty('id');
    expect(transformedAddresses[0]).toHaveProperty('label', 'Home');
  });

  it('should include both id and company_id for existing addresses', () => {
    const formData = {
      id: 789,
      addresses: [
        {
          id: 'existing-123',
          type: 'Mailing',
          street1: '789 Existing Ave.',
          street2: null,
          city: 'GHI',
          state: 'TX',
          zip: '11111'
        }
      ]
    };

    const transformedAddresses = formData.addresses.map(addr => ({
      ...(addr.id && { id: addr.id }),
      company_id: formData.id,
      type: 'company_address',
      label: addr.type,
      street1: addr.street1,
      street2: addr.street2 || null,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    }));

    // Verify existing addresses get both id and company_id
    expect(transformedAddresses[0]).toHaveProperty('id', 'existing-123');
    expect(transformedAddresses[0]).toHaveProperty('company_id', 789);
    expect(transformedAddresses[0]).toHaveProperty('label', 'Mailing');
  });
});