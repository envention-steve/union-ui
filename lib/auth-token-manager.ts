/**
 * Auth Token Manager
 * 
 * Bridges the frontend auth system with the backend API client
 * Handles automatic token injection and refresh for FastAPI calls
 */

import { authApiClient } from './api-client';

export class AuthTokenManager {
  private static instance: AuthTokenManager;
  private currentToken: string | null = null;

  private constructor() {}

  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  /**
   * Get the current access token from session
   */
  async getCurrentToken(): Promise<string | null> {
    try {
      // Call the /api/auth/me endpoint to get session data
      const response = await authApiClient.auth.me();
      
      if (response.success) {
        // We need to extract the Keycloak access token from the session
        // Since the session data includes the accessToken, we need to modify
        // the auth API to expose it or get it directly from cookies
        return await this.getTokenFromSession();
      }
    } catch (error) {
      console.warn('Failed to get current token:', error);
    }
    
    return null;
  }

  /**
   * Get token directly from session data by calling a new endpoint
   */
  private async getTokenFromSession(): Promise<string | null> {
    try {
      // We'll create a new endpoint that returns the access token
      const response = await fetch('/api/auth/token', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.accessToken || null;
      }
    } catch (error) {
      console.warn('Failed to get token from session:', error);
    }
    
    return null;
  }

  /**
   * Set the current token (called by auth store)
   */
  setToken(token: string | null) {
    this.currentToken = token;
  }

  /**
   * Get cached token (fast access)
   */
  getCachedToken(): string | null {
    return this.currentToken;
  }

  /**
   * Clear the token
   */
  clearToken() {
    this.currentToken = null;
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    try {
      // This will trigger a refresh if the session is expiring soon
      const response = await authApiClient.auth.refreshToken();
      
      if (response.success) {
        // The token will be updated in the session cookie
        return await this.getCurrentToken();
      }
    } catch (error) {
      console.warn('Token refresh failed:', error);
      this.clearToken();
    }
    
    return null;
  }
}

export const authTokenManager = AuthTokenManager.getInstance();
