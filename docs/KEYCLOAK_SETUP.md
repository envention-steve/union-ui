# Keycloak Authentication Setup Guide

## Overview

This UI implements secure authentication using Keycloak with server-side token validation. The architecture includes:

- **Client-side**: React components and stores for UI state management
- **Server-side**: Next.js API routes for secure token exchange and validation
- **Middleware**: Route protection with server-side session validation
- **Session Management**: Automatic token refresh and session monitoring

## Architecture Flow

```
User Login → Next.js API Route → Keycloak → JWT Tokens → Secure Cookies → Protected Routes
```

1. User submits credentials via login form
2. Next.js API route exchanges credentials with Keycloak
3. Keycloak returns JWT access & refresh tokens
4. Server validates tokens and creates secure session cookies
5. Middleware protects routes by validating session server-side
6. Automatic token refresh before expiration

## Environment Configuration

Update your `.env.local` file with your Keycloak settings:

```bash
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm-name
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret

# JWT Configuration (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_ISSUER=union-benefits-ui
JWT_AUDIENCE=union-benefits-api

# Session Configuration
SESSION_COOKIE_NAME=union-session
SESSION_MAX_AGE=86400
```

## Keycloak Client Configuration

In your Keycloak admin console, configure your client:

1. **Client Type**: OpenID Connect
2. **Client Authentication**: On (for confidential client)
3. **Authentication Flow**: 
   - Standard Flow: Enabled
   - Direct Access Grants: Enabled (for username/password flow)
4. **Valid Redirect URIs**: `http://localhost:3000/*`
5. **Web Origins**: `http://localhost:3000`

## File Structure

```
├── app/
│   ├── api/auth/
│   │   ├── login/route.ts       # Login endpoint
│   │   ├── logout/route.ts      # Logout endpoint
│   │   ├── refresh/route.ts     # Token refresh endpoint
│   │   └── me/route.ts          # Current user endpoint
│   └── (auth)/login/page.tsx    # Login page
├── lib/
│   ├── keycloak.ts              # Keycloak client integration
│   ├── session.ts               # Session management utilities
│   └── api-client.ts            # Updated API client
├── store/
│   └── auth-store.ts            # Authentication state management
├── components/
│   ├── auth-provider.tsx        # Session management provider
│   ├── providers.tsx            # Main providers wrapper
│   └── features/auth/
│       └── login-form.tsx       # Login form component
└── middleware.ts                # Route protection middleware
```

## Key Features

### 🔐 **Secure Authentication**
- Password grant flow with Keycloak
- JWT token validation using Keycloak's public keys
- Secure HTTP-only cookies for session storage

### 🛡️ **Server-side Protection**
- Middleware validates sessions on every protected route
- No client-side token exposure
- Automatic redirects for unauthenticated users

### 🔄 **Automatic Token Management**
- Token refresh before expiration (configurable buffer)
- Automatic logout on refresh failure
- Periodic session validation

### 🎯 **User Experience**
- Callback URL preservation during login flow
- Error message handling for expired sessions
- Loading states and error feedback

## Testing the Authentication Flow

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Authentication Scenarios

#### **Successful Login**
1. Navigate to `http://localhost:3000/login`
2. Enter valid Keycloak credentials
3. Should redirect to dashboard or callback URL

#### **Route Protection**
1. Navigate to `http://localhost:3000/dashboard` (or any protected route)
2. Without authentication, should redirect to login with callback URL
3. After login, should redirect back to original URL

#### **Session Expiration**
1. Login successfully
2. Wait for session to expire (or manually expire in Keycloak)
3. Try accessing protected route - should redirect to login with error message

#### **Token Refresh**
1. Login successfully  
2. Session should automatically refresh before expiration
3. Check browser network tab for refresh API calls

#### **Logout**
1. Login successfully
2. Trigger logout (you'll need to add a logout button to test)
3. Should clear session and redirect appropriately

### 3. API Endpoint Testing

You can test the API endpoints directly:

```bash
# Login (replace with actual credentials)
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password"}'

# Check current user (requires session cookie)
curl -X GET http://localhost:3000/api/auth/me \\
  -H "Cookie: union-session=your-session-token"

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \\
  -H "Cookie: union-session=your-session-token"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \\
  -H "Cookie: union-session=your-session-token"
```

## Security Considerations

- **Environment Variables**: Never commit real secrets to version control
- **HTTPS**: Use HTTPS in production for secure cookie transmission  
- **Cookie Settings**: Secure, HttpOnly, SameSite cookies prevent XSS/CSRF
- **Token Validation**: All tokens validated against Keycloak's public keys
- **Session Expiration**: Configurable session timeouts with automatic cleanup

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**: Check Keycloak credentials and client configuration
2. **"Token validation failed"**: Verify Keycloak server URL and realm settings
3. **Middleware redirect loops**: Check protected/public route configuration
4. **Session not persisting**: Verify cookie settings and domain configuration

### Debug Mode:

Enable debug logging by adding to `.env.local`:
```bash
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## Integration with Backend API

Your backend API should validate the JWT tokens from the session cookies:

1. Extract token from `Authorization: Bearer <token>` header or session cookie
2. Validate token signature using Keycloak's public keys
3. Verify token claims (issuer, audience, expiration)
4. Extract user information from token payload

The middleware and API routes provide the foundation for this secure authentication flow!
