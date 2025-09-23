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

// Ensure Request and Response are available for Next.js
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = global.Request = class Request {
    constructor(input, init) {
      // Minimal mock for testing
      this._url = typeof input === 'string' ? input : input?.url || ''
      this._method = init?.method || 'GET'
      this._headers = new Map(Object.entries(init?.headers || {}))
    }
    get url() { return this._url }
    get method() { return this._method }
    get headers() { return this._headers }
    json() { return Promise.resolve({}) }
    text() { return Promise.resolve('') }
  }
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = global.Response = class Response {
    constructor(body, init) {
      this._body = body
      this._init = init || {}
      this.status = this._init.status || 200
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new Map(Object.entries(this._init.headers || {}))
    }
    json() { 
      if (typeof this._body === 'string') {
        return Promise.resolve(JSON.parse(this._body))
      }
      return Promise.resolve(this._body || {}) 
    }
    text() { return Promise.resolve(this._body || '') }
    
    // Static method for NextResponse.json()
    static json(body, init) {
      return new this(JSON.stringify(body), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {})
        }
      })
    }
  }
}

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
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  redirect: jest.fn(),
}))

// Mock Next.js NextResponse
jest.mock('next/server', () => {
  // Get the actual module first
  const originalModule = jest.requireActual('next/server')
  
  return {
    ...originalModule,
    NextResponse: {
      json: (body, init) => {
        const response = new global.Response(JSON.stringify(body), {
          status: init?.status || 200,
          statusText: init?.statusText || 'OK',
          headers: {
            'content-type': 'application/json',
            ...(init?.headers || {})
          }
        })
        return response
      },
      redirect: jest.fn(),
      rewrite: jest.fn(),
      next: jest.fn(),
    }
  }
})

// Polyfill for Pointer Events for Radix UI components in tests
// Polyfill MouseEvent if not present (Node environment)
if (typeof global.MouseEvent === 'undefined') {
  global.MouseEvent = class MouseEvent {
    constructor(type, params) {
      this.type = type;
      Object.assign(this, params);
    }
  };
}
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, params) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.width = params.width;
      this.height = params.height;
      this.pressure = params.pressure;
      this.tangentialPressure = params.tangentialPressure;
      this.tiltX = params.tiltX;
      this.tiltY = params.tiltY;
      this.twist = params.twist;
      this.pointerType = params.pointerType;
      this.isPrimary = params.isPrimary;
    }
  }
  global.PointerEvent = PointerEvent;
}

// Safely polyfill Element prototype methods when running in the Node/jsdom test
if (typeof global.Element !== 'undefined' && global.Element && typeof global.Element.prototype === 'object') {
  if (!global.Element.prototype.hasPointerCapture) {
    global.Element.prototype.hasPointerCapture = jest.fn();
  }
  if (!global.Element.prototype.setPointerCapture) {
    global.Element.prototype.setPointerCapture = jest.fn();
  }
  if (!global.Element.prototype.releasePointerCapture) {
    global.Element.prototype.releasePointerCapture = jest.fn();
  }
} else {
  // Provide a minimal Element mock so tests that reference Element.prototype don't crash
  // This keeps the runtime safe in environments where Element is not defined.
  global.Element = global.Element || function Element() {}
  global.Element.prototype = global.Element.prototype || {}
  global.Element.prototype.hasPointerCapture = jest.fn();
  global.Element.prototype.setPointerCapture = jest.fn();
  global.Element.prototype.releasePointerCapture = jest.fn();
}

if (!global.Element.prototype.scrollIntoView) {
  global.Element.prototype.scrollIntoView = jest.fn();
}

// Mock window.matchMedia for sonner component (only when `window` exists)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
