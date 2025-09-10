# Testing Framework Plan for Union UI

## Overview

This document outlines a comprehensive testing strategy for the Union Benefits UI application, focusing on the newly implemented Keycloak authentication system and future feature development.

## Testing Stack Recommendation

### Core Testing Framework
- **Jest** - JavaScript testing framework (already compatible with Next.js)
- **React Testing Library** - Component testing with focus on user behavior
- **MSW (Mock Service Worker)** - API mocking for reliable tests
- **Playwright** - End-to-end testing for critical user flows

### Additional Tools
- **@testing-library/jest-dom** - Custom DOM matchers
- **@testing-library/user-event** - Realistic user interactions
- **jest-environment-jsdom** - DOM testing environment
- **@jest/globals** - Modern Jest globals for TypeScript

## Testing Architecture

### 1. Unit Tests (`__tests__/unit/`)
**Purpose**: Test individual functions, components, and utilities in isolation

**Coverage Areas**:
- **Authentication utilities** (`lib/keycloak.ts`, `lib/session.ts`)
  - Token validation logic
  - Session creation/verification
  - Cookie handling utilities
  - Error handling scenarios

- **API Client** (`lib/api-client.ts`)
  - Request/response handling
  - Error scenarios
  - Auth token attachment
  - Client separation (auth vs backend)

- **Zustand Store** (`store/auth-store.ts`)
  - State management logic
  - Action dispatching
  - Persistence behavior
  - Error state handling

- **Utility Functions** (`lib/utils.ts`)
  - Helper functions
  - Data transformations
  - Validation logic

### 2. Integration Tests (`__tests__/integration/`)
**Purpose**: Test how multiple components work together

**Coverage Areas**:
- **Authentication Flow**
  - Login form → API routes → Keycloak → Session creation
  - Token refresh workflow
  - Logout process
  - Session validation

- **API Route Testing**
  - `/api/auth/login` - Full authentication flow
  - `/api/auth/logout` - Session cleanup
  - `/api/auth/refresh` - Token refresh
  - `/api/auth/me` - Session validation

- **Component Integration**
  - AuthProvider + useAuthStore interaction
  - Login form + authentication store
  - Route protection (middleware + components)

### 3. Component Tests (`__tests__/components/`)
**Purpose**: Test React components in isolation with mocked dependencies

**Coverage Areas**:
- **Authentication Components**
  - `LoginForm` - Form validation, error handling, loading states
  - `AuthProvider` - Session management, auto-refresh
  - Protected route wrappers

- **UI Components**
  - Form components with validation
  - Error boundary components
  - Loading states and feedback

- **Layout Components**
  - Header/navigation with auth state
  - Protected layout rendering

### 4. End-to-End Tests (`__tests__/e2e/`)
**Purpose**: Test complete user journeys in a browser environment

**Critical User Flows**:
- **Authentication Journey**
  - Visit protected route → redirect to login → successful login → redirect to original page
  - Login → navigate around → automatic token refresh → logout
  - Failed login attempts → error messages → successful retry

- **Session Management**
  - Session expiration handling
  - "Remember me" functionality (if implemented)
  - Cross-tab session sync (if needed)

- **Error Scenarios**
  - Network failures during authentication
  - Keycloak server unavailable
  - Invalid credentials
  - Session corruption recovery

## Test Environment Setup

### Mock Strategy

#### 1. Keycloak API Mocking (MSW)
```typescript
// Mock Keycloak token endpoint
rest.post('/realms/union/protocol/openid-connect/token', (req, res, ctx) => {
  // Return mock JWT tokens for testing
})

// Mock Keycloak JWKS endpoint
rest.get('/realms/union/protocol/openid-connect/certs', (req, res, ctx) => {
  // Return mock public keys
})
```

#### 2. Next.js API Route Testing
- Use Next.js built-in testing utilities
- Mock Keycloak client for isolation
- Test both success and error paths

#### 3. Environment Variables
- Separate test environment configuration
- Mock/test Keycloak server setup
- Isolated test database (if needed)

### Test Data Management

#### 1. User Fixtures
```typescript
export const testUsers = {
  validUser: {
    username: 'test_user1',
    password: 'envention',
    email: 'test_user1@gmail.com',
    roles: ['client_admin']
  },
  invalidUser: {
    username: 'invalid_user',
    password: 'wrong_password'
  }
}
```

#### 2. JWT Token Fixtures
- Pre-generated valid tokens for testing
- Expired tokens for expiration testing
- Invalid tokens for error scenarios

#### 3. Session Data Fixtures
- Valid session objects
- Corrupted session data
- Different user roles and permissions

## Testing Implementation Phases

### Phase 1: Foundation (Week 1)
**Priority: HIGH** - Essential for current authentication system

1. **Setup Testing Infrastructure**
   - Install and configure Jest, React Testing Library, MSW
   - Setup test scripts and configurations
   - Create test utilities and helpers

2. **Authentication Core Tests**
   - Unit tests for Keycloak client (`lib/keycloak.ts`)
   - Unit tests for session management (`lib/session.ts`)
   - Integration tests for API routes (`/api/auth/*`)

3. **Basic Component Tests**
   - LoginForm component testing
   - AuthProvider functionality
   - Basic error handling

### Phase 2: Component Coverage (Week 2)
**Priority: MEDIUM** - Important for UI reliability

1. **Component Testing Suite**
   - All authentication-related components
   - Form validation and user interactions
   - Loading states and error displays

2. **Store Testing**
   - Complete auth-store test coverage
   - State transitions and side effects
   - Persistence behavior

3. **Utility Testing**
   - API client comprehensive testing
   - Helper function coverage

### Phase 3: Integration & E2E (Week 3)
**Priority: MEDIUM** - Critical user flow validation

1. **Integration Test Suite**
   - Full authentication flow testing
   - Component interaction testing
   - Middleware integration

2. **End-to-End Test Suite**
   - Critical user journeys
   - Cross-browser testing setup
   - Error scenario coverage

### Phase 4: Advanced & CI/CD (Week 4)
**Priority: LOW** - Optimization and automation

1. **Advanced Testing Features**
   - Performance testing
   - Accessibility testing
   - Visual regression testing (optional)

2. **CI/CD Integration**
   - GitHub Actions setup
   - Pre-commit testing hooks
   - Coverage reporting

## File Structure

```
union-ui/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── utils/                      # Test utilities and helpers
│   │   ├── test-utils.tsx          # React Testing Library setup
│   │   ├── mocks/                  # Mock data and fixtures
│   │   │   ├── keycloak.ts         # Keycloak API mocks
│   │   │   ├── users.ts            # User test fixtures
│   │   │   └── tokens.ts           # JWT token fixtures
│   │   └── msw/                    # MSW handlers
│   │       ├── auth-handlers.ts    # Auth API mock handlers
│   │       └── keycloak-handlers.ts # Keycloak mock handlers
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── keycloak.test.ts    # Keycloak client tests
│   │   │   ├── session.test.ts     # Session management tests
│   │   │   └── api-client.test.ts  # API client tests
│   │   └── store/
│   │       └── auth-store.test.ts  # Auth store tests
│   ├── integration/
│   │   ├── auth-flow.test.ts       # Complete auth flow tests
│   │   └── api/
│   │       ├── auth-login.test.ts  # Login API integration
│   │       ├── auth-logout.test.ts # Logout API integration
│   │       └── auth-me.test.ts     # Session validation API
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.test.tsx  # Login form tests
│   │   │   └── AuthProvider.test.tsx # Auth provider tests
│   │   └── ui/                     # UI component tests
│   └── e2e/
│       ├── auth-journey.spec.ts    # Complete auth user journey
│       ├── session-management.spec.ts # Session handling E2E
│       └── error-scenarios.spec.ts # Error handling E2E
├── jest.config.js                  # Jest configuration
├── playwright.config.ts            # Playwright configuration
└── package.json                    # Testing dependencies
```

## Configuration Files

### Jest Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'store/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    'app/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Test Setup (`__tests__/setup.ts`)
```typescript
import '@testing-library/jest-dom'
import { server } from './__tests__/utils/msw/server'

// Setup MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock environment variables
process.env.KEYCLOAK_SERVER_URL = 'http://localhost:8080'
process.env.KEYCLOAK_REALM = 'union'
process.env.KEYCLOAK_CLIENT_ID = 'union-ui-client'
process.env.JWT_SECRET = 'test-secret-key'
```

## Benefits of This Testing Strategy

### 1. **Confidence in Authentication**
- Every part of the authentication flow is tested
- Regression prevention for security-critical code
- Error scenarios are covered

### 2. **Development Velocity**
- Tests catch bugs early in development
- Safe refactoring with confidence
- Clear documentation through test cases

### 3. **Maintainability**
- Tests serve as documentation
- Breaking changes are immediately apparent
- Code quality enforcement

### 4. **User Experience**
- Critical user flows are guaranteed to work
- Error handling is properly tested
- Performance regressions are caught

## Success Metrics

### Coverage Targets
- **Unit Tests**: 90% code coverage for utilities and business logic
- **Integration Tests**: 100% coverage for critical authentication flows
- **Component Tests**: 85% coverage for all React components
- **E2E Tests**: 100% coverage for critical user journeys

### Quality Gates
- All tests must pass before merge
- No decrease in coverage percentage
- Performance tests within acceptable limits
- No accessibility violations in tested components

## Dependencies to Add

### Core Testing Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@jest/globals": "^29.0.0",
    "msw": "^2.0.0",
    "@playwright/test": "^1.40.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Optional Enhancements
```json
{
  "devDependencies": {
    "jest-axe": "^8.0.0",
    "@storybook/testing-library": "^0.2.0",
    "lighthouse": "^11.0.0",
    "pa11y": "^6.0.0"
  }
}
```

This comprehensive testing plan ensures robust, maintainable code while supporting rapid development of new features. The phased approach allows for immediate testing of critical authentication functionality while building toward comprehensive coverage.
