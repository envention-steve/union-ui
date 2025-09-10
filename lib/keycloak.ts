import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';

export interface KeycloakConfig {
  serverUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
}

export interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
}

export interface KeycloakUser {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

export class KeycloakClient {
  private config: KeycloakConfig;
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: KeycloakConfig) {
    this.config = config;
    this.jwks = createRemoteJWKSet(
      new URL(`${config.serverUrl}/realms/${config.realm}/protocol/openid-connect/certs`)
    );
  }

  /**
   * Exchange username/password for Keycloak tokens
   */
  async authenticateUser(username: string, password: string): Promise<KeycloakTokenResponse> {
    const tokenUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      username,
      password,
      scope: 'openid profile email',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    const tokenUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<KeycloakUser> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `${this.config.serverUrl}/realms/${this.config.realm}`,
        // Keycloak often uses 'account' as the audience for password grant flows
        audience: ['account', this.config.clientId],
      });

      return payload as KeycloakUser;
    } catch (error) {
      throw new Error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout user from Keycloak
   */
  async logoutUser(refreshToken: string): Promise<void> {
    const logoutUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/logout`;
    
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        // Log the error but don't throw - logout should proceed even if Keycloak call fails
        console.warn(`Keycloak logout failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Log network errors but don't throw - logout should proceed even if network fails
      console.warn(`Keycloak logout network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user info from Keycloak
   */
  async getUserInfo(accessToken: string): Promise<KeycloakUser> {
    const userInfoUrl = `${this.config.serverUrl}/realms/${this.config.realm}/protocol/openid-connect/userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Create singleton instance
export const keycloakClient = new KeycloakClient({
  serverUrl: process.env.KEYCLOAK_SERVER_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
});
