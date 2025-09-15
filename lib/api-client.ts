interface AuthEndpoints {
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user: any; message: string }>;
  logout: () => Promise<{ success: boolean; message: string }>;
  refreshToken: () => Promise<{ success: boolean; user: any; expiresAt: number; isExpiringSoon: boolean; message: string }>;
  me: () => Promise<{ success: boolean; user: any; expiresAt: number; isExpiringSoon: boolean }>;
}

interface BusinessEndpoints {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string }) => Promise<{ items: any[]; total: number; page: number; limit: number }>;
  get: (id: string) => Promise<any>;
  getDetails?: (id: string) => Promise<any>;
  getLedgerEntries?: (id: string, params?: {
    offset?: number;
    limit?: number;
    account_type?: 'HEALTH' | 'ANNUITY';
    entry_type?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<{ items: any[]; total: number; offset: number; limit: number }>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<{ message: string }>;
}

interface DashboardEndpoints {
  getStats: () => Promise<{
    totalMembers: number;
    activeBenefits: number;
    pendingClaims: number;
    totalPremiums: number;
    membersTrend: number;
    benefitsTrend: number;
    claimsTrend: number;
    premiumsTrend: number;
  }>;
}

class ApiClient {
  protected baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  clearAuthToken() {
    this.token = undefined;
  }

  protected lastResponse?: Response;

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Store the response for header access
    this.lastResponse = response;

    // If we get a 401 and this is not already a refresh request, try to refresh token
    if (response.status === 401 && !endpoint.includes('/auth/') && retryCount === 0) {
      try {
        // Attempt token refresh
        const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (refreshResponse.ok) {
          // Retry the original request with the new token
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      } catch (error) {
        // Token refresh failed, let the original 401 error propagate
      }
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }

  getLastResponseHeaders(): HeadersInit | undefined {
    return this.lastResponse?.headers;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return this.request<T>(url.pathname + url.search, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }


}

// Create properly typed API client classes

class AuthApiClient extends ApiClient {
  auth: AuthEndpoints;

  constructor(baseURL: string) {
    super(baseURL);
    this.auth = {
      login: (credentials: { email: string; password: string }) =>
        this.post<{ success: boolean; user: any; message: string }>('/api/auth/login', credentials),
      
      logout: () =>
        this.post<{ success: boolean; message: string }>('/api/auth/logout'),
      
      refreshToken: () =>
        this.post<{ success: boolean; user: any; expiresAt: number; isExpiringSoon: boolean; message: string }>('/api/auth/refresh'),
      
      me: () =>
        this.get<{ success: boolean; user: any; expiresAt: number; isExpiringSoon: boolean }>('/api/auth/me'),
    };
  }
}

class AuthenticatedBackendApiClient extends ApiClient {
  benefits!: BusinessEndpoints;
  members!: BusinessEndpoints;
  plans!: BusinessEndpoints;
  dashboard!: DashboardEndpoints;
  ledgerEntries!: {
    getTypes: () => Promise<{ value: string; label: string; }[]>;
  };
  distributionClasses!: {
    list: () => Promise<any[]>;
  };
  memberStatuses!: {
    list: () => Promise<any[]>;
  };
  insurancePlans!: {
    list: () => Promise<any[]>;
  };

  constructor(baseURL: string) {
    super(baseURL);
    
    // Initialize endpoints immediately
    this.initializeEndpoints();
    
    // Load auth token manager asynchronously
    import('@/lib/auth-token-manager').then(({ authTokenManager }) => {
      this.tokenManager = authTokenManager;
    });
  }
  
  private tokenManager?: any;

  /**
   * Get token with fallback if token manager isn't loaded yet
   */
  private async getAuthToken(): Promise<string | null> {
    if (this.tokenManager) {
      // Try cached token first
      let token = this.tokenManager.getCachedToken();
      if (!token) {
        // Try to get fresh token
        try {
          token = await this.tokenManager.getCurrentToken();
        } catch (error) {
          console.warn('Failed to get token from token manager:', error);
        }
      }
      return token;
    } else {
      // Fallback: try to get token directly
      try {
        const response = await fetch('/api/auth/token', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          return data.accessToken || null;
        }
      } catch (error) {
        console.warn('Failed to get token from fallback method:', error);
      }
    }
    
    return null;
  }

  /**
   * Override request method to automatically include auth tokens
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Get auth token
    const token = await this.getAuthToken();

    // Build headers safely (handle HeadersInit variants)
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (options.headers) {
      const incoming = new Headers(options.headers as any);
      incoming.forEach((value, key) => headers.set(key, value));
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    // Store the response for header access
    this.lastResponse = response;

    // Handle 401 - token might be expired, try refresh
    if (response.status === 401 && retryCount === 0 && this.tokenManager) {
      try {
        console.log('Backend request got 401, attempting token refresh...');
        const newToken = await this.tokenManager.refreshTokenIfNeeded();
        if (newToken) {
          // Retry request with new token
          return this.request<T>(endpoint, options, retryCount + 1);
        }
      } catch (error) {
        console.warn('Token refresh failed for backend request:', error);
      }
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }

  // Override the get method to use our authenticated request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return this.request<T>(url.pathname + url.search, { method: 'GET' });
  }

  // Override other methods to use our authenticated request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Add debugging for member updates
    if (endpoint.includes('/api/v1/members/') && data) {
      console.log('**** API CLIENT PUT REQUEST ****', {
        endpoint,
        hasBody: !!data,
        bodySize: data ? JSON.stringify(data).length : 0,
        dependentCoverages: data.dependent_coverages ? {
          count: data.dependent_coverages.length,
          data: data.dependent_coverages
        } : 'NOT INCLUDED'
      });
    }
    
    const result = this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    // Add debugging for member updates response
    if (endpoint.includes('/api/v1/members/')) {
      result.then(
        (response) => {
          console.log('**** API CLIENT PUT RESPONSE SUCCESS ****', {
            endpoint,
            response
          });
          return response;
        },
        (error) => {
          console.log('**** API CLIENT PUT RESPONSE ERROR ****', {
            endpoint,
            error
          });
          throw error;
        }
      );
    }
    
    return result;
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Initialize endpoints
  initializeEndpoints() {
    this.benefits = {
      list: async (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
        const queryParams: Record<string, any> = {};
        
        // Handle pagination - FastAPI uses skip/limit instead of page
        if (params?.page !== undefined && params?.limit !== undefined) {
          queryParams.skip = (params.page - 1) * params.limit;
          queryParams.limit = params.limit;
        } else {
          queryParams.limit = 25; // Default limit
        }
        
        // Add other params
        if (params?.search) {
          queryParams.search = params.search;
        }
        
        if (params?.category) {
          queryParams.category = params.category;
        }
        
        const response = await this.get<any[]>('/api/v1/benefits', queryParams);
        const headers = this.getLastResponseHeaders() as Headers;
        
        // Extract pagination info from headers
        const total = headers?.get('X-Total-Count') ? parseInt(headers.get('X-Total-Count')!) : response.length;
        
        return {
          items: response,
          total,
          page: params?.page || 1,
          limit: params?.limit || 25
        };
      },
      
      get: (id: string) =>
        this.get<any>(`/api/v1/benefits/${id}`),
      
      create: (data: any) =>
        this.post<any>('/api/v1/benefits', data),
      
      update: (id: string, data: any) =>
        this.put<any>(`/api/v1/benefits/${id}`, data),
      
      delete: (id: string) =>
        this.delete<{ message: string }>(`/api/v1/benefits/${id}`),
    };

    this.members = {
      list: async (params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams: Record<string, any> = {};
        
        // Handle pagination - FastAPI uses skip/limit instead of page
        if (params?.page !== undefined && params?.limit !== undefined) {
          queryParams.skip = (params.page - 1) * params.limit;
          queryParams.limit = params.limit;
        } else {
          queryParams.limit = 25; // Default limit
        }
        
        // Add other params
        if (params?.search) {
          queryParams.search = params.search;
        }
        
        const response = await this.get<any[]>('/api/v1/members', queryParams);
        const headers = this.getLastResponseHeaders() as Headers;
        
        // Extract pagination info from headers
        const total = headers?.get('X-Total-Count') ? parseInt(headers.get('X-Total-Count')!) : response.length;
        
        return {
          items: response,
          total,
          page: params?.page || 1,
          limit: params?.limit || 25
        };
      },
      
      get: (id: string) =>
        this.get<any>(`/api/v1/members/${id}`),
      
      getDetails: (id: string) =>
        this.get<any>(`/api/v1/members/${id}/details`),
      
      create: (data: any) =>
        this.post<any>('/api/v1/members', data),
      
      update: (id: string, data: any) =>
        this.put<any>(`/api/v1/members/${id}`, data),
      
      delete: (id: string) =>
        this.delete<any>(`/api/v1/members/${id}`),
      
      getLedgerEntries: async (id: string, params?: {
        offset?: number;
        limit?: number;
        account_type?: 'HEALTH' | 'ANNUITY';
        entry_type?: string;
        start_date?: string;
        end_date?: string;
      }) => {
        const queryParams: Record<string, any> = {};
        
        if (params?.offset !== undefined) queryParams.skip = params.offset;
        if (params?.limit !== undefined) queryParams.limit = params.limit;
        if (params?.account_type) queryParams.account_type = params.account_type;
        if (params?.entry_type) queryParams.entry_type = params.entry_type;
        if (params?.start_date) queryParams.start_date = params.start_date;
        if (params?.end_date) queryParams.end_date = params.end_date;
        
        const response = await this.get<any[]>(`/api/v1/members/${id}/ledger_entries`, queryParams);
        const headers = this.getLastResponseHeaders() as Headers;
        
        const total = headers?.get('X-Total-Count') ? parseInt(headers.get('X-Total-Count')!) : response.length;
        
        return {
          items: response,
          total,
          offset: params?.offset || 0, // Using offset here because we're just returning it to the UI
          limit: params?.limit || 25
        };
      },
    };

    this.plans = {
      list: async (params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams: Record<string, any> = {};
        
        // Handle pagination - FastAPI uses skip/limit instead of page
        if (params?.page !== undefined && params?.limit !== undefined) {
          queryParams.skip = (params.page - 1) * params.limit;
          queryParams.limit = params.limit;
        } else {
          queryParams.limit = 25; // Default limit
        }
        
        // Add other params
        if (params?.search) {
          queryParams.search = params.search;
        }
        
        const response = await this.get<any[]>('/api/v1/plans', queryParams);
        const headers = this.getLastResponseHeaders() as Headers;
        
        // Extract pagination info from headers
        const total = headers?.get('X-Total-Count') ? parseInt(headers.get('X-Total-Count')!) : response.length;
        
        return {
          items: response,
          total,
          page: params?.page || 1,
          limit: params?.limit || 25
        };
      },
      
      get: (id: string) =>
        this.get<any>(`/api/v1/plans/${id}`),
      
      create: (data: any) =>
        this.post<any>('/api/v1/plans', data),
      
      update: (id: string, data: any) =>
        this.put<any>(`/api/v1/plans/${id}`, data),
      
      delete: (id: string) =>
        this.delete<{ message: string }>(`/api/v1/plans/${id}`),
    };

    this.dashboard = {
      getStats: () =>
        this.get<{
          totalMembers: number;
          activeBenefits: number;
          pendingClaims: number;
          totalPremiums: number;
          membersTrend: number;
          benefitsTrend: number;
          claimsTrend: number;
          premiumsTrend: number;
        }>('/api/v1/dashboard/stats'),
    };
    
    this.ledgerEntries = {
      getTypes: () =>
        this.get<{ value: string; label: string; }[]>('/api/v1/ledger_entries/types'),
    };
    
    this.distributionClasses = {
      list: () =>
        this.get<any[]>('/api/v1/distribution_classes'),
    };
    
    this.memberStatuses = {
      list: () =>
        this.get<any[]>('/api/v1/member_statuses'),
    };
    
    this.insurancePlans = {
      list: () => {
        // Use skip/limit to get all plans - set limit to 1000
        return this.get<any[]>('/api/v1/insurance_plans', { skip: 0, limit: 1000 });
      },
    };
  }
  
  async initialize() {
    // Wait for token manager to be available
    if (!this.tokenManager) {
      const { authTokenManager } = await import('@/lib/auth-token-manager');
      this.tokenManager = authTokenManager;
    }
    
    this.initializeEndpoints();
  }
}

// Auth API Client - for authentication (points to current Next.js app)
export const authApiClient = new AuthApiClient(
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
);

// Backend API Client - for business logic (points to your FastAPI backend server)
export const backendApiClient = new AuthenticatedBackendApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8035'
);

// For backward compatibility, keep the main apiClient pointing to auth
export const apiClient = authApiClient;

export default apiClient;
