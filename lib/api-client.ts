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

  // Authentication endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.post<{ access_token: string; token_type: string; user: any }>('/api/v1/auth/login', credentials),
    
    register: (userData: { email: string; password: string; full_name: string; [key: string]: any }) =>
      this.post<{ access_token: string; token_type: string; user: any }>('/api/v1/auth/register', userData),
    
    refreshToken: (refreshToken: string) =>
      this.post<{ access_token: string; token_type: string }>('/api/v1/auth/refresh', { refresh_token: refreshToken }),
    
    logout: () =>
      this.post<{ message: string }>('/api/v1/auth/logout'),
  };

  // Benefits endpoints
  benefits = {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
      this.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/benefits', params),
    
    get: (id: string) =>
      this.get<any>(`/api/v1/benefits/${id}`),
    
    create: (data: any) =>
      this.post<any>('/api/v1/benefits', data),
    
    update: (id: string, data: any) =>
      this.put<any>(`/api/v1/benefits/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/api/v1/benefits/${id}`),
  };

  // Members endpoints
  members = {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      this.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/members', params),
    
    get: (id: string) =>
      this.get<any>(`/api/v1/members/${id}`),
    
    create: (data: any) =>
      this.post<any>('/api/v1/members', data),
    
    update: (id: string, data: any) =>
      this.put<any>(`/api/v1/members/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/api/v1/members/${id}`),
  };

  // Plans endpoints
  plans = {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      this.get<{ items: any[]; total: number; page: number; limit: number }>('/api/v1/plans', params),
    
    get: (id: string) =>
      this.get<any>(`/api/v1/plans/${id}`),
    
    create: (data: any) =>
      this.post<any>('/api/v1/plans', data),
    
    update: (id: string, data: any) =>
      this.put<any>(`/api/v1/plans/${id}`, data),
    
    delete: (id: string) =>
      this.delete<{ message: string }>(`/api/v1/plans/${id}`),
  };

  // Dashboard endpoints
  dashboard = {
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
}

// Create and export the API client instance
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
);

export default apiClient;
