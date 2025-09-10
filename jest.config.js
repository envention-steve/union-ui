const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'store/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    'app/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!app/**/layout.tsx', // Usually don't need to test layouts
    '!app/**/loading.tsx', // Loading components are simple
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{js,ts,tsx}',
  ],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/__tests__/e2e/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
