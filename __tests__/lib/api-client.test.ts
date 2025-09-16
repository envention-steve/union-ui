import { authApiClient, backendApiClient } from '../../lib/api-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    authApiClient.clearAuthToken();
    backendApiClient.clearAuthToken();
  });

  describe('Core ApiClient functionality', () => {
    it('should set and clear authentication tokens', () => {
      const token = 'test-token-123';
      
      authApiClient.setAuthToken(token);
      
      // We can't directly access the private token, but we can test its effect
      // by mocking a request and checking the headers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      authApiClient.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );

      // Clear token
      authApiClient.clearAuthToken();
      mockFetch.mockClear();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      authApiClient.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });

    it('should handle GET requests with query parameters', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const params = { page: 1, limit: 10, search: 'test query' };
      const result = await authApiClient.get('/api/test', params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test+query'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should filter out null and undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });

      const params = { 
        page: 1, 
        search: null, 
        filter: undefined, 
        active: true 
      };
      
      await authApiClient.get('/api/test', params);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('active=true');
      expect(calledUrl).not.toContain('search=');
      expect(calledUrl).not.toContain('filter=');
    });

    it('should handle POST requests with data', async () => {
      const mockResponse = { id: 1, created: true };
      const postData = { name: 'Test', email: 'test@example.com' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.post('/api/users', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle PUT requests', async () => {
      const mockResponse = { id: 1, updated: true };
      const updateData = { name: 'Updated Name' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.put('/api/users/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle DELETE requests', async () => {
      const mockResponse = { message: 'Deleted successfully' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.delete('/api/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle PATCH requests', async () => {
      const mockResponse = { id: 1, patched: true };
      const patchData = { status: 'active' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.patch('/api/users/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle non-JSON responses', async () => {
      const mockTextResponse = 'Plain text response';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: async () => mockTextResponse,
      });

      const result = await authApiClient.get('/api/text');
      expect(result).toBe(mockTextResponse);
    });

    it('should throw errors for failed requests', async () => {
      const errorMessage = 'Not Found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => errorMessage,
      });

      await expect(authApiClient.get('/api/nonexistent')).rejects.toThrow(
        'API Error: 404 Not Found - Not Found'
      );
    });

    it('should handle requests without data body', async () => {
      const mockResponse = { created: true };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      await authApiClient.post('/api/action');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('Auth API Client endpoints', () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    it('should handle login requests', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        success: true,
        user: { id: '1', email: 'test@example.com', full_name: 'Test User' },
        message: 'Login successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.auth.login(credentials);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle logout requests', async () => {
      const mockResponse = { success: true, message: 'Logged out successfully' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.auth.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle refresh token requests', async () => {
      const mockResponse = {
        success: true,
        user: { id: '1', email: 'test@example.com' },
        message: 'Token refreshed',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.auth.refreshToken();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle me requests', async () => {
      const mockResponse = {
        success: true,
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() + 3600000,
        isExpiringSoon: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await authApiClient.auth.me();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Backend API Client endpoints', () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    describe('Benefits API', () => {
      it('should list benefits with parameters', async () => {
        const mockResponse = {
          items: [{ id: '1', name: 'Health Insurance' }],
          total: 1,
          page: 1,
          limit: 10,
        };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        // Mock main request
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '1']]),
          json: async () => [{ id: '1', name: 'Health Insurance' }],
        });

        const params = { page: 1, limit: 10, search: 'health', category: 'health' };
        const result = await backendApiClient.benefits.list(params);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/benefits'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should get a specific benefit', async () => {
        const mockBenefit = { id: '1', name: 'Health Insurance', description: 'Comprehensive health coverage' };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockBenefit,
        });

        const result = await backendApiClient.benefits.get('1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/benefits/1'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockBenefit);
      });

      it('should create a new benefit', async () => {
        const newBenefit = { name: 'Dental Insurance', category: 'dental', monthly_premium: 50 };
        const mockResponse = { id: '2', ...newBenefit };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.benefits.create(newBenefit);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/benefits'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newBenefit),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should update an existing benefit', async () => {
        const updateData = { monthly_premium: 60 };
        const mockResponse = { id: '1', ...updateData };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.benefits.update('1', updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/benefits/1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should delete a benefit', async () => {
        const mockResponse = { message: 'Benefit deleted successfully' };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.benefits.delete('1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/benefits/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Members API', () => {
      it('should list members', async () => {
        const mockResponse = {
          items: [{ id: '1', user_id: '1', member_number: 'M001' }],
          total: 1,
          page: 1,
          limit: 10,
        };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '1']]),
          json: async () => [{ id: '1', user_id: '1', member_number: 'M001' }],
        });

        const result = await backendApiClient.members.list();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual({
          items: [{ id: '1', user_id: '1', member_number: 'M001' }],
          total: 1,
          page: 1,
          limit: 25
        });
      });

      it('should handle CRUD operations for members', async () => {
        // Get member
        const mockMember = { id: '1', member_number: 'M001' };
        
        // Mock auth token endpoint (fallback) for first request
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockMember,
        });

        await backendApiClient.members.get('1');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members/1'),
          expect.objectContaining({ method: 'GET' })
        );

        // Create member
        const newMember = { user_id: '2', employment_status: 'active' };
        
        // Mock auth token endpoint (fallback) for second request
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ id: '2', ...newMember }),
        });

        await backendApiClient.members.create(newMember);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/members'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newMember),
          })
        );
      });
    });

    describe('Plans API', () => {
      it('should handle plan operations', async () => {
        const mockPlan = { id: '1', name: 'Basic Plan', plan_type: 'individual' };
        
        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockPlan,
        });

        const result = await backendApiClient.plans.get('1');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/plans/1'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockPlan);
      });
    });

    describe('Dashboard API', () => {
      it('should get dashboard statistics', async () => {
        const mockStats = {
          totalMembers: 150,
          activeBenefits: 8,
          pendingClaims: 12,
          totalPremiums: 45000,
          membersTrend: 5.2,
          benefitsTrend: 0,
          claimsTrend: -2.1,
          premiumsTrend: 8.7,
        };

        // Mock auth token endpoint (fallback)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockStats,
        });

        const result = await backendApiClient.dashboard.getStats();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/dashboard/stats'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApiClient.get('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(authApiClient.get('/api/test')).rejects.toThrow('Invalid JSON');
    });

    it('should handle server errors with details', async () => {
      const errorDetails = JSON.stringify({ error: 'Validation failed', details: { email: ['Invalid email'] } });
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => errorDetails,
      });

      await expect(authApiClient.post('/api/users', {})).rejects.toThrow(
        'API Error: 422 Unprocessable Entity'
      );
    });

    it('should handle token refresh on 401 error', async () => {
      // First request returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });
      
      // Token refresh succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true }),
      });
      
      // Retry original request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'success' }),
      });

      const result = await authApiClient.get('/api/test');
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry token refresh for auth endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      await expect(authApiClient.get('/api/auth/me')).rejects.toThrow(
        'API Error: 401 Unauthorized - Unauthorized'
      );
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should handle failed token refresh gracefully', async () => {
      // First request returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });
      
      // Token refresh fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Refresh failed',
      });

      await expect(authApiClient.get('/api/test')).rejects.toThrow(
        'API Error: 401 Unauthorized - Unauthorized'
      );
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should store last response for header access', async () => {
      const customHeaders = new Map([['X-Custom-Header', 'test-value'], ['content-type', 'application/json']]);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: customHeaders,
        json: async () => ({ data: 'test' }),
      });

      await authApiClient.get('/api/test');
      const lastHeaders = authApiClient.getLastResponseHeaders();
      
      expect(lastHeaders).toBe(customHeaders);
    });

    it('should return undefined for last response headers when no request made', () => {
      // Create fresh client instance to ensure no previous requests
      const freshClient = new (authApiClient.constructor as any)('http://test.com');
      expect(freshClient.getLastResponseHeaders()).toBeUndefined();
    });
  });

  describe('Extended Backend API Client functionality', () => {
    beforeEach(() => {
      mockFetch.mockClear();
    });

    describe('Employers extended methods', () => {
      beforeEach(() => {
        // Mock auth token fallback (always called first)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
      });

      it('should get employer details', async () => {
        const mockEmployer = { id: '1', name: 'Test Employer', details: 'Extended details' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockEmployer,
        });

        const result = await backendApiClient.employers.getDetails!('1');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1/details'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockEmployer);
      });

      it('should get employer rates', async () => {
        const mockRates = [{ id: '1', rate: 150, type: 'monthly' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockRates,
        });

        const result = await backendApiClient.employers.getRates!('1');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1/employer_rates'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockRates);
      });

      it('should create employer rate', async () => {
        const rateData = { rate: 200, type: 'annual' };
        const mockResponse = { id: '2', ...rateData };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.createRate!('1', rateData);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1/employer_rates'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(rateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should update employer rate', async () => {
        const updateData = { rate: 250 };
        const mockResponse = { id: '2', rate: 250 };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.updateRate!('1', '2', updateData);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employer_rates/2'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should delete employer rate', async () => {
        const mockResponse = { message: 'Rate deleted' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.deleteRate!('1', '2');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employer_rates/2'),
          expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should get employer notes', async () => {
        const mockNotes = [{ id: '1', content: 'Test note', author: 'Admin' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockNotes,
        });

        const result = await backendApiClient.employers.getNotes!('1');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1/employer_notes'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockNotes);
      });

      it('should create employer note', async () => {
        const noteData = { content: 'New note', author: 'Manager' };
        const mockResponse = { id: '2', ...noteData };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.createNote!('1', noteData);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1/employer_notes'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(noteData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should update employer note', async () => {
        const updateData = { content: 'Updated note' };
        const mockResponse = { id: '2', content: 'Updated note' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.updateNote!('1', '2', updateData);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employer_notes/2'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should delete employer note', async () => {
        const mockResponse = { message: 'Note deleted' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.deleteNote!('1', '2');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employer_notes/2'),
          expect.objectContaining({ method: 'DELETE' })
        );
        expect(result).toEqual(mockResponse);
      });

      it('should get employer members with parameters', async () => {
        const mockMembers = {
          items: [{ id: '1', name: 'John Doe' }],
          total: 1,
          page: 1,
          limit: 10
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '1']]),
          json: async () => mockMembers.items,
        });

        const result = await backendApiClient.employers.getMembers!('1', {
          page: 1,
          limit: 10,
          search: 'John'
        });
        
        const calledUrl = mockFetch.mock.calls[1][0];
        expect(calledUrl).toContain('/api/v1/employers/1/members');
        expect(calledUrl).toContain('skip=0');
        expect(calledUrl).toContain('limit=10');
        expect(calledUrl).toContain('search=John');
        expect(result.total).toBe(1);
      });

      it('should get employer ledger entries with filters', async () => {
        const mockEntries = {
          items: [{ id: '1', amount: 100, type: 'premium' }],
          total: 1,
          offset: 0,
          limit: 25
        };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '1']]),
          json: async () => mockEntries.items,
        });

        const result = await backendApiClient.employers.getLedgerEntries!('1', {
          offset: 0,
          limit: 25,
          account_type: 'HEALTH',
          entry_type: 'premium',
          start_date: '2023-01-01',
          end_date: '2023-12-31'
        });
        
        const calledUrl = mockFetch.mock.calls[1][0];
        expect(calledUrl).toContain('/api/v1/employers/1/ledger_entries');
        expect(calledUrl).toContain('account_type=HEALTH');
        expect(calledUrl).toContain('entry_type=premium');
        expect(calledUrl).toContain('start_date=2023-01-01');
        expect(calledUrl).toContain('end_date=2023-12-31');
        expect(result.total).toBe(1);
      });

      it('should update with nested data', async () => {
        const updateData = { 
          name: 'Updated Employer',
          nested: { addresses: [], rates: [] }
        };
        const mockResponse = { id: '1', ...updateData };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockResponse,
        });

        const result = await backendApiClient.employers.updateWithNested!('1', updateData);
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/employers/1'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Members extended methods', () => {
      beforeEach(() => {
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
      });

      it('should get member details', async () => {
        const mockMember = { id: '1', details: 'Extended member details' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockMember,
        });

        const result = await backendApiClient.members.getDetails!('1');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/members/1/details'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockMember);
      });

      it('should get member ledger entries with all parameters', async () => {
        const mockEntries = [{ id: '1', amount: 500 }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '10']]),
          json: async () => mockEntries,
        });

        const result = await backendApiClient.members.getLedgerEntries!('1', {
          offset: 20,
          limit: 10,
          account_type: 'ANNUITY',
          entry_type: 'withdrawal',
          start_date: '2023-06-01',
          end_date: '2023-06-30'
        });
        
        const calledUrl = mockFetch.mock.calls[1][0];
        expect(calledUrl).toContain('/api/v1/members/1/ledger_entries');
        expect(calledUrl).toContain('skip=20');
        expect(calledUrl).toContain('limit=10');
        expect(calledUrl).toContain('account_type=ANNUITY');
        expect(result.total).toBe(10);
        expect(result.offset).toBe(20);
      });
    });

    describe('Insurance Plans methods', () => {
      beforeEach(() => {
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
      });

      it('should list insurance plans with search', async () => {
        const mockPlans = [{ id: '1', name: 'Health Plan A', type: 'HEALTH' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json'], ['X-Total-Count', '5']]),
          json: async () => mockPlans,
        });

        const result = await backendApiClient.insurancePlans.list({
          page: 1,
          limit: 10,
          search: 'health'
        });
        
        const calledUrl = mockFetch.mock.calls[1][0];
        expect(calledUrl).toContain('/api/v1/insurance_plans');
        expect(calledUrl).toContain('search=health');
        expect(result.total).toBe(5);
      });

      it('should get insurance plan details', async () => {
        const mockPlan = { id: '1', name: 'Health Plan', details: 'Extended details' };
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockPlan,
        });

        const result = await backendApiClient.insurancePlans.getDetails('1');
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/insurance_plans/1/details'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockPlan);
      });
    });

    describe('Utility endpoints', () => {
      beforeEach(() => {
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
      });

      it('should get ledger entry types', async () => {
        const mockTypes = [{ value: 'premium', label: 'Premium Payment' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockTypes,
        });

        const result = await backendApiClient.ledgerEntries.getTypes();
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/ledger_entries/types'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockTypes);
      });

      it('should list distribution classes', async () => {
        const mockClasses = [{ id: '1', name: 'Class A' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockClasses,
        });

        const result = await backendApiClient.distributionClasses.list();
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/distribution_classes'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockClasses);
      });

      it('should list member statuses', async () => {
        const mockStatuses = [{ id: '1', name: 'Active' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockStatuses,
        });

        const result = await backendApiClient.memberStatuses.list();
        
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining('/api/v1/member_statuses'),
          expect.objectContaining({ method: 'GET' })
        );
        expect(result).toEqual(mockStatuses);
      });

      it('should list employer types with high limit', async () => {
        const mockTypes = [{ id: '1', name: 'Corporation' }];
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockTypes,
        });

        const result = await backendApiClient.employerTypes.list();
        
        const calledUrl = mockFetch.mock.calls[1][0];
        expect(calledUrl).toContain('/api/v1/employer_types');
        expect(calledUrl).toContain('limit=1000');
        expect(result).toEqual(mockTypes);
      });
    });

    describe('Edge cases and error conditions', () => {
      it('should handle missing X-Total-Count header gracefully', async () => {
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        const mockData = [{ id: '1' }, { id: '2' }];
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => mockData,
        });

        const result = await backendApiClient.benefits.list();
        
        expect(result.total).toBe(2); // Should fallback to array length
        expect(result.items).toEqual(mockData);
      });

      it('should handle empty parameters in list methods', async () => {
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => [],
        });

        const result = await backendApiClient.members.list();
        
        expect(result.limit).toBe(25); // Default limit
        expect(result.page).toBe(1); // Default page
      });

      it('should handle special member update logging', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        // Mock auth token fallback
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({}),
        });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ id: '123', updated: true }),
        });

        const memberData = {
          name: 'Test Member',
          dependent_coverages: [{ id: 1, coverage: 'health' }]
        };

        await backendApiClient.put('/api/v1/members/123', memberData);

        expect(consoleSpy).toHaveBeenCalledWith(
          '**** API CLIENT PUT REQUEST ****',
          expect.objectContaining({
            endpoint: '/api/v1/members/123',
            hasBody: true,
            dependentCoverages: expect.objectContaining({
              count: 1,
              data: memberData.dependent_coverages
            })
          })
        );

        consoleSpy.mockRestore();
      });
    });
  });
});
