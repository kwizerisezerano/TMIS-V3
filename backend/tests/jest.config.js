/**
 * Jest Configuration for TMIS Backend Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'utils/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Transform patterns (if needed for ES6+)
  transform: {},

  // Global variables
  globals: {
    'process.env.NODE_ENV': 'test'
  }
};
