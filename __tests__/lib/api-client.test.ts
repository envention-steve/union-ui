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
  });
});
