// Alternative refactor - more testable but less optimal
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
// ... other imports

export default function MemberDetailPage() {
  // Instead of use(params), use useParams()
  const params = useParams();
  const memberId = params.id as string;
  
  // ... rest of the component logic stays the same
  
  const fetchMember = useCallback(async () => {
    if (!memberId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await backendApiClient.members.getDetails(memberId);
      // ... rest stays the same
    } catch (err) {
      console.error('Error fetching member:', err);
      setError('Failed to load member data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);
  
  // ... rest of component
}