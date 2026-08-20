export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: './src/__tests__/setup.ts',
  globalTeardown: './src/__tests__/teardown.ts',
};
