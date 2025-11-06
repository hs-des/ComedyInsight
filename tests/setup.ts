/**
 * Jest Setup - Global test configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/comedyinsight_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test timeout
jest.setTimeout(10000);

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: React') || args[0].includes('Not implemented'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

