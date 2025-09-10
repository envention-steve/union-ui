// Setup for Next.js API Routes testing
// This file sets up the global environment needed for testing Next.js API routes

// Mock Web APIs that Next.js expects
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = input || 'http://localhost:3000';
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers || {});
      this._body = init.body;
    }

    async json() {
      if (this._body && typeof this._body === 'object') {
        return this._body;
      }
      try {
        return JSON.parse(this._body || '{}');
      } catch {
        return {};
      }
    }

    async text() {
      return this._body ? String(this._body) : '';
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this._body,
      });
    }
  };
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers || {});
      this._body = body;
    }

    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body);
      }
      return this._body;
    }

    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }

    static json(object, init) {
      return new Response(JSON.stringify(object), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
    }

    clone() {
      return new Response(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
  };
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          init._headers.forEach((value, key) => {
            this._headers.set(key, value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers.set(key.toLowerCase(), value);
          });
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => {
            this._headers.set(key.toLowerCase(), value);
          });
        }
      }
    }

    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }

    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }

    has(name) {
      return this._headers.has(name.toLowerCase());
    }

    delete(name) {
      this._headers.delete(name.toLowerCase());
    }

    forEach(callback) {
      this._headers.forEach(callback);
    }

    *entries() {
      yield* this._headers.entries();
    }

    *keys() {
      yield* this._headers.keys();
    }

    *values() {
      yield* this._headers.values();
    }

    [Symbol.iterator]() {
      return this.entries();
    }
  };
}

// Mock NextRequest and NextResponse if needed
if (typeof globalThis.NextRequest === 'undefined') {
  globalThis.NextRequest = globalThis.Request;
}

if (typeof globalThis.NextResponse === 'undefined') {
  globalThis.NextResponse = globalThis.Response;
}

// Mock URL and URLSearchParams if needed
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = class URL {
    constructor(url, base) {
      const fullUrl = base ? new URL(url, base).href : url;
      this.href = fullUrl;
      this.origin = fullUrl.split('/').slice(0, 3).join('/');
      this.protocol = fullUrl.split(':')[0] + ':';
      this.host = fullUrl.split('/')[2] || '';
      this.hostname = this.host.split(':')[0];
      this.port = this.host.split(':')[1] || '';
      this.pathname = '/' + fullUrl.split('/').slice(3).join('/').split('?')[0];
      this.search = fullUrl.includes('?') ? '?' + fullUrl.split('?')[1].split('#')[0] : '';
      this.hash = fullUrl.includes('#') ? '#' + fullUrl.split('#')[1] : '';
    }
  };
}

if (typeof globalThis.URLSearchParams === 'undefined') {
  globalThis.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this._params = new Map();
      if (typeof init === 'string') {
        init = init.startsWith('?') ? init.slice(1) : init;
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            this._params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
          }
        });
      }
    }

    get(name) {
      return this._params.get(name) || null;
    }

    set(name, value) {
      this._params.set(name, value);
    }

    has(name) {
      return this._params.has(name);
    }

    delete(name) {
      this._params.delete(name);
    }

    forEach(callback) {
      this._params.forEach(callback);
    }

    toString() {
      const params = [];
      this._params.forEach((value, key) => {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      return params.join('&');
    }
  };
}
