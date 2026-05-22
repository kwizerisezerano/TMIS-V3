/**
 * Users Controller Tests
 * Comprehensive testing for all users endpoints
 */

const UsersController = require('../../controllers/usersController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('UsersController', () => {
  let testDb;
  let testHelpers;
  let usersController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    usersController = new UsersController(testDb);
    
    // Get test data
    testData = require('../seeders/testDataSeeder').getTestData();
  });

  afterAll(async () => {
    // Cleanup test database
    if (testDb) {
      await testDb.end();
    }
  });

  beforeEach(async () => {
    // Reset database before each test
    await testHelpers.cleanupTestData();
  });

  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all users successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number),
              pages: expect.any(Number)
            })
          })
        })
      );
    });

    test('should get users with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          role: 'member',
          search: 'Jane'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should get user by ID successfully', async () => {
      const testUser = testData.users[0];
      const req = {
        params: { userId: testUser.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testUser.id
          })
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid user ID', async () => {
      const req = {
        params: { userId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid user ID is required')
        })
      );
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
    });

    test('should update user profile successfully', async () => {
      const updateData = {
        names: 'Updated Name',
        phone: '+250788777888',
        id_number: '1199080077788999'
      };

      const req = {
        params: { userId: testUser.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify user was updated in database
      const updatedUser = await testHelpers.assertRecordExists('users', {
        id: testUser.id
      });
    });

    test('should update only provided fields', async () => {
      const updateData = {
        names: 'Partially Updated Name'
        // Only updating names
      };

      const req = {
        params: { userId: testUser.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should return validation error for invalid user ID', async () => {
      const req = {
        params: { userId: 'invalid' },
        body: { names: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid user ID is required')
        })
      );
    });

    test('should return validation error for invalid names', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { names: '123' } // Invalid names
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Names must contain only letters')
        })
      );
    });

    test('should return validation error for invalid phone', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { phone: 'invalid-phone' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid phone number')
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: 99999 },
        body: { names: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return duplicate error for existing phone', async () => {
      // Create another user with existing phone
      const existingUser = await testHelpers.createTestUser({
        phone: '+250788555666'
      });

      const req = {
        params: { userId: testUser.id },
        body: { phone: '+250788555666' } // Same phone as existing user
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Phone number already exists')
        })
      );
    });

    test('should return duplicate error for existing ID number', async () => {
      // Create another user with existing ID number
      const existingUser = await testHelpers.createTestUser({
        id_number: '1199080099887766'
      });

      const req = {
        params: { userId: testUser.id },
        body: { id_number: '1199080099887766' } // Same ID number as existing user
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('ID number already exists')
        })
      );
    });

    test('should allow updating to same phone number (self)', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { phone: testUser.phone } // Same phone as current user
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should allow updating to same ID number (self)', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { id_number: testUser.id_number } // Same ID number as current user
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser();
    });

    test('should delete user successfully', async () => {
      const req = {
        params: { userId: testUser.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify user was deleted from database
      await testHelpers.assertRecordNotExists('users', {
        id: testUser.id
      });
    });

    test('should return validation error for invalid user ID', async () => {
      const req = {
        params: { userId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid user ID is required')
        })
      );
    });

    test('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('POST /api/users/register', () => {
    test('should register user successfully', async () => {
      const userData = {
        names: testHelpers.generateRandomName(),
        email: testHelpers.generateRandomEmail(),
        phone: testHelpers.generateRandomPhone(),
        password: 'test123',
        role: 'member',
        id_number: testHelpers.generateRandomIdNumber()
      };

      const req = {
        body: userData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            userId: expect.any(Number)
          }),
          message: expect.stringContaining('registered successfully')
        })
      );

      // Verify user was created in database
      await testHelpers.assertRecordExists('users', {
        role: 'member'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          names: 'Test User',
          email: 'test@example.com'
          // Missing phone, password
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return duplicate error for existing email', async () => {
      // Create existing user
      const existingUser = await testHelpers.createTestUser({
        email: 'existing@test.com'
      });

      const req = {
        body: {
          names: 'New User',
          email: 'existing@test.com', // Same email
          phone: '+250788999888',
          password: 'test123',
          role: 'member',
          id_number: '1199080099887766'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User with this email already exists')
        })
      );
    });

    test('should return duplicate error for existing phone', async () => {
      // Create existing user
      const existingUser = await testHelpers.createTestUser({
        phone: '+250788555666'
      });

      const req = {
        body: {
          names: 'New User',
          email: 'new@test.com',
          phone: '+250788555666', // Same phone
          password: 'test123',
          role: 'member',
          id_number: '1199080099887766'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User with this phone already exists')
        })
      );
    });

    test('should hash password before storage', async () => {
      const userData = {
        names: 'Test User',
        email: 'test@example.com',
        phone: '+250788123456',
        password: 'plainpassword',
        role: 'member',
        id_number: '1199080012345678'
      };

      const req = {
        body: userData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      // Verify password is hashed in database
      const [records] = await testDb.execute(
        'SELECT password FROM users WHERE id = ?',
        [res.json.mock.calls[0][0].data.userId]
      );

      const storedPassword = records[0].password;
      
      // Hashed password should not match plain text
      expect(storedPassword).not.toBe(userData.password);
      expect(storedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database to throw error
      const originalExecute = testDb.execute;
      testDb.execute = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch users')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });
  });

  describe('Data Integrity', () => {
    test('should encrypt sensitive data before storage', async () => {
      const userData = {
        names: 'Test User',
        email: 'test@example.com',
        phone: '+250788123456',
        password: 'test123',
        role: 'member',
        id_number: '1199080012345678'
      };

      const req = {
        body: userData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await usersController.register(req, res);

      // Verify data is encrypted in database
      const [records] = await testDb.execute(
        'SELECT names, email, phone, id_number FROM users WHERE id = ?',
        [res.json.mock.calls[0][0].data.userId]
      );

      const storedRecord = records[0];
      
      // Encrypted data should not match plain text
      expect(storedRecord.names).not.toBe(userData.names);
      expect(storedRecord.email).not.toBe(userData.email);
      expect(storedRecord.phone).not.toBe(userData.phone);
      expect(storedRecord.id_number).not.toBe(userData.id_number);
      
      // Password should be hashed, not encrypted
      expect(storedRecord.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });
});
