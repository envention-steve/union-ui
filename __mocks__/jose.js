// Mock implementation of jose library for Jest
module.exports = {
  SignJWT: class MockSignJWT {
    constructor(payload) {
      this.payload = payload;
      this.headers = {};
    }

    setProtectedHeader(header) {
      this.headers = { ...this.headers, ...header };
      return this;
    }

    setIssuedAt() {
      this.iat = Math.floor(Date.now() / 1000);
      return this;
    }

    setIssuer(issuer) {
      this.issuer = issuer;
      return this;
    }

    setAudience(audience) {
      this.audience = audience;
      return this;
    }

    setExpirationTime(exp) {
      this.exp = exp;
      return this;
    }

    async sign(secret) {
      // Return a mock JWT token
      const header = Buffer.from(JSON.stringify(this.headers)).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        ...this.payload,
        iat: this.iat,
        iss: this.issuer,
        aud: this.audience,
        exp: this.exp,
      })).toString('base64url');
      const signature = 'mock_signature';
      return `${header}.${payload}.${signature}`;
    }
  },

  jwtVerify: jest.fn().mockImplementation(async (token, secret, options) => {
    // Extract payload from mock JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      // Check expiration if not bypassed by currentDate
      if (options?.currentDate) {
        // If currentDate is provided, use it for exp validation
        const currentTime = Math.floor(options.currentDate.getTime() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          throw new Error('Token expired');
        }
      } else {
        // Normal exp validation
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          throw new Error('Token expired');
        }
      }
      
      return { payload };
    } catch (error) {
      throw new Error('Invalid token: ' + error.message);
    }
  }),

  decodeJwt: jest.fn().mockImplementation((token) => {
    // Extract payload from mock JWT without verification
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch (error) {
      throw new Error('Invalid token payload');
    }
  }),

  createRemoteJWKSet: jest.fn().mockImplementation((url) => {
    // Mock JWKS
    return jest.fn().mockResolvedValue({
      keys: [{
        kty: 'RSA',
        kid: 'mock_key_id',
        n: 'mock_n',
        e: 'AQAB'
      }]
    });
  })
};