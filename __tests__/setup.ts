import '@testing-library/jest-dom'
// import { server } from './utils/msw/server'

// Setup MSW (Mock Service Worker) - temporarily disabled
// beforeAll(() => {
//   server.listen({ onUnhandledRequest: 'error' })
// })

// afterEach(() => {
//   server.resetHandlers()
// })

// afterAll(() => {
//   server.close()
// })

// Mock environment variables for testing
process.env.KEYCLOAK_SERVER_URL = 'http://localhost:8080'
process.env.KEYCLOAK_REALM = 'union'
process.env.KEYCLOAK_CLIENT_ID = 'union-ui-client'
process.env.KEYCLOAK_CLIENT_SECRET = 'test-client-secret'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-session-tokens'
process.env.JWT_ISSUER = 'union-benefits-ui'
process.env.JWT_AUDIENCE = 'union-benefits-api'
process.env.SESSION_COOKIE_NAME = 'union-session'
process.env.SESSION_MAX_AGE = '86400'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock

// Add TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


// Mock Next.js cookies() function
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  redirect: jest.fn(),
}))
