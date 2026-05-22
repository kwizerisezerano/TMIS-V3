/**
 * Jest Setup File
 * Global test setup and teardown
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || 3306;
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'root';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || '';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'tmis_test_db';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test cleanup
afterEach(() => {
  // Clear any mocks after each test
  jest.clearAllMocks();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Mock console methods in tests to reduce noise
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console.log in tests unless explicitly needed
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  // Helper to create mock request/response objects
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  createMockRes: () => {
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
      send: jest.fn(() => res),
      redirect: jest.fn(() => res),
      cookie: jest.fn(() => res),
      clearCookie: jest.fn(() => res)
    };
    return res;
  },

  // Helper to wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test data
  generateTestData: () => ({
    user: {
      names: 'Test User',
      email: 'test@example.com',
      phone: '+250788123456',
      role: 'member',
      id_number: '1199080012345678'
    },
    tontine: {
      name: 'Test Tontine',
      description: 'Test tontine description',
      contribution_amount: 20000.00,
      contribution_frequency: 'monthly',
      max_members: 10,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'active'
    },
    application: {
      names: 'Test Applicant',
      email: 'applicant@test.com',
      phone: '+250788555666',
      id_number: '1199080055667788',
      status: 'pending'
    },
    contribution: {
      amount: 20000.00,
      payment_method: 'mobile_money',
      contribution_date: '2024-01-15',
      transaction_ref: 'CONTR-170512345678-1-1',
      payment_status: 'Approved'
    },
    loan: {
      amount: 100000.00,
      interest_rate: 1.70,
      total_amount: 117000.00,
      repayment_period: 6,
      phone_number: '+250788654321',
      status: 'Pending'
    }
  })
};

// Mock external dependencies that might not be available in test environment
jest.mock('../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendApplicationEmail: jest.fn().mockResolvedValue(true),
  sendLoanNotificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock file system operations if needed
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock encryption for testing (use deterministic encryption)
jest.mock('../../utils/encryption', () => ({
  encryptUserData: jest.fn((data) => ({
    ...data,
    encrypted: true
  })),
  decryptUserData: jest.fn((data) => ({
    ...data,
    decrypted: true
  }))
}));

console.log('Jest setup completed');
