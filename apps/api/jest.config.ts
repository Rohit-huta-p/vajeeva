export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: './src/__tests__/setup.ts',
  globalTeardown: './src/__tests__/teardown.ts',
  setupFilesAfterEnv: ['./src/__tests__/jest.setup.ts'],
  // Run serially — all suites share one mongodb-memory-server instance and
  // multiple suites call User.deleteMany() in beforeAll; parallel workers
  // clobber each other's admin user, causing 403 failures.
  maxWorkers: 1,
};
