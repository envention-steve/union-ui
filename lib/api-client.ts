class ApiClient {
  private baseURL: string;
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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

// Create separate API clients for different purposes

// Auth API Client - for authentication (points to current Next.js app)
export const authApiClient = new ApiClient(
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
);

// Add auth endpoints to authApiClient
authApiClient.auth = {
  login: (credentials: { email: string; password: string }) =>
    authApiClient.post<{ success: boolean; user: any; message: string }>('/api/auth/login', credentials),
  
  logout: () =>
    authApiClient.post<{ success: boolean; message: string }>('/api/auth/logout'),
  
  refreshToken: () =>
    authApiClient.post<{ success: boolean; user: any; message: string }>('/api/auth/refresh'),
  
  me: () =>
    authApiClient.get<{ success: boolean; user: any; expiresAt: number; isExpiringSoon: boolean }>('/api/auth/me'),
};

// Backend API Client - for business logic (points to your backend server)
export const backendApiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
);

// Add business endpoints to backendApiClient
backendApiClient.benefits = {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    backendApiClient.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/benefits', params),
  
  get: (id: string) =>
    backendApiClient.get<any>(`/api/v1/benefits/${id}`),
  
  create: (data: any) =>
    backendApiClient.post<any>('/api/v1/benefits', data),
  
  update: (id: string, data: any) =>
    backendApiClient.put<any>(`/api/v1/benefits/${id}`, data),
  
  delete: (id: string) =>
    backendApiClient.delete<{ message: string }>(`/api/v1/benefits/${id}`),
};

backendApiClient.members = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    backendApiClient.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/members', params),
  
  get: (id: string) =>
    backendApiClient.get<any>(`/api/v1/members/${id}`),
  
  create: (data: any) =>
    backendApiClient.post<any>('/api/v1/members', data),
  
  update: (id: string, data: any) =>
    backendApiClient.put<any>(`/api/v1/members/${id}`, data),
  
  delete: (id: string) =>
    backendApiClient.delete<{ message: string }>(`/api/v1/members/${id}`),
};

backendApiClient.plans = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    backendApiClient.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/plans', params),
  
  get: (id: string) =>
    backendApiClient.get<any>(`/api/v1/plans/${id}`),
  
  create: (data: any) =>
    backendApiClient.post<any>('/api/v1/plans', data),
  
  update: (id: string, data: any) =>
    backendApiClient.put<any>(`/api/v1/plans/${id}`, data),
  
  delete: (id: string) =>
    backendApiClient.delete<{ message: string }>(`/api/v1/plans/${id}`),
};

backendApiClient.dashboard = {
  getStats: () =>
    backendApiClient.get<{
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

// For backward compatibility, keep the main apiClient pointing to auth
export const apiClient = authApiClient;

export default apiClient;
