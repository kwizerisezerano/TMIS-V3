/**
 * Tontines Controller Tests
 * Comprehensive testing for all tontines endpoints
 */

const TontinesController = require('../../controllers/tontinesController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('TontinesController', () => {
  let testDb;
  let testHelpers;
  let tontinesController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    tontinesController = new TontinesController(testDb);
    
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

  describe('GET /api/tontines', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all tontines successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            tontines: expect.any(Array),
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

    test('should get tontines with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'active',
          search: 'Test',
          includeMembers: 'true',
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontines(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            tontines: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get tontine by ID successfully', async () => {
      const testTontine = testData.tontines[0];
      const req = {
        params: { id: testTontine.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontineById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testTontine.id,
            members: expect.any(Array)
          })
        })
      );
    });

    test('should return 404 for non-existent tontine', async () => {
      const req = {
        params: { id: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontineById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid tontine ID', async () => {
      const req = {
        params: { id: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontineById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid tontine ID is required')
        })
      );
    });
  });

  describe('POST /api/tontines', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
    });

    test('should create tontine successfully', async () => {
      const tontineData = {
        name: 'New Test Tontine',
        description: 'New tontine for testing',
        contributionAmount: 25000.00,
        contributionFrequency: 'monthly',
        maxMembers: 15,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        creatorId: testUser.id
      };

      const req = {
        body: tontineData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            tontineId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify tontine was created in database
      await testHelpers.assertRecordExists('tontines', {
        name: tontineData.name,
        creator_id: testUser.id
      });

      // Verify creator was added as member
      await testHelpers.assertRecordExists('tontine_members', {
        tontine_id: res.json.mock.calls[0][0].data.tontineId,
        user_id: testUser.id,
        status: 'approved'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          name: 'Test Tontine',
          // Missing other required fields
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid names', async () => {
      const req = {
        body: {
          name: '123', // Invalid names
          contributionAmount: 20000,
          maxMembers: 10,
          creatorId: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Names must contain only letters')
        })
      );
    });

    test('should return validation error for invalid contribution amount', async () => {
      const req = {
        body: {
          name: 'Test Tontine',
          contributionAmount: -1000, // Invalid amount
          maxMembers: 10,
          creatorId: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid contribution amount is required')
        })
      );
    });

    test('should return validation error for invalid max members', async () => {
      const req = {
        body: {
          name: 'Test Tontine',
          contributionAmount: 20000,
          maxMembers: 1, // Too few members
          creatorId: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Max members must be between 2 and 50')
        })
      );
    });

    test('should return error for non-admin creator', async () => {
      const memberUser = await testHelpers.createTestUser({
        role: 'member'
      });

      const req = {
        body: {
          name: 'Test Tontine',
          contributionAmount: 20000,
          maxMembers: 10,
          creatorId: memberUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Only admins and presidents can create tontines')
        })
      );
    });

    test('should return foreign key error for non-existent creator', async () => {
      const req = {
        body: {
          name: 'Test Tontine',
          contributionAmount: 20000,
          maxMembers: 10,
          creatorId: 99999 // Non-existent user
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
    });

    test('should return duplicate error for existing tontine name', async () => {
      // Create existing tontine
      const existingTontine = await testHelpers.createTestTontine({
        name: 'Existing Tontine',
        creator_id: testUser.id
      });

      const req = {
        body: {
          name: 'Existing Tontine', // Same name
          contributionAmount: 20000,
          maxMembers: 10,
          creatorId: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.createTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine with this name already exists for this creator')
        })
      );
    });
  });

  describe('PUT /api/tontines/:id', () => {
    let testTontine;
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        creator_id: testUser.id
      });
    });

    test('should update tontine successfully', async () => {
      const updateData = {
        name: 'Updated Tontine Name',
        description: 'Updated description',
        contributionAmount: 25000.00,
        maxMembers: 20,
        status: 'active'
      };

      const req = {
        params: { id: testTontine.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.updateTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify tontine was updated in database
      const updatedTontine = await testHelpers.assertRecordExists('tontines', {
        id: testTontine.id,
        name: updateData.name
      });
    });

    test('should return validation error for invalid tontine ID', async () => {
      const req = {
        params: { id: 'invalid' },
        body: { name: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.updateTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid tontine ID is required')
        })
      );
    });

    test('should return 404 for non-existent tontine', async () => {
      const req = {
        params: { id: 99999 },
        body: { name: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.updateTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return duplicate error for existing name', async () => {
      // Create another tontine with same creator
      const otherTontine = await testHelpers.createTestTontine({
        name: 'Other Tontine',
        creator_id: testUser.id
      });

      const req = {
        params: { id: testTontine.id },
        body: { name: 'Other Tontine' } // Same name as other tontine
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.updateTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine with this name already exists for this creator')
        })
      );
    });
  });

  describe('DELETE /api/tontines/:id', () => {
    let testTontine;
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        creator_id: testUser.id
      });
    });

    test('should delete tontine successfully', async () => {
      const req = {
        params: { id: testTontine.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.deleteTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify tontine was deleted from database
      await testHelpers.assertRecordNotExists('tontines', {
        id: testTontine.id
      });
    });

    test('should return validation error for invalid tontine ID', async () => {
      const req = {
        params: { id: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.deleteTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid tontine ID is required')
        })
      );
    });

    test('should return 404 for non-existent tontine', async () => {
      const req = {
        params: { id: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.deleteTontine(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('Member Management', () => {
    let testTontine;
    let testUser;
    let memberUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        creator_id: testUser.id
      });
      memberUser = await testHelpers.createTestUser({
        role: 'member'
      });
    });

    test('should add member successfully', async () => {
      const req = {
        params: { tontineId: testTontine.id },
        body: {
          userId: memberUser.id,
          shares: 2
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Member added successfully')
        })
      );

      // Verify member was added
      await testHelpers.assertRecordExists('tontine_members', {
        tontine_id: testTontine.id,
        user_id: memberUser.id,
        shares: 2
      });
    });

    test('should return duplicate error for existing member', async () => {
      // Add member first
      await tontinesController.addMember({
        params: { tontineId: testTontine.id },
        body: { userId: memberUser.id, shares: 1 }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { tontineId: testTontine.id },
        body: {
          userId: memberUser.id, // Same user
          shares: 2
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User is already a member of this tontine')
        })
      );
    });

    test('should remove member successfully', async () => {
      // Add member first
      await tontinesController.addMember({
        params: { tontineId: testTontine.id },
        body: { userId: memberUser.id, shares: 1 }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { 
          tontineId: testTontine.id,
          userId: memberUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Member removed successfully')
        })
      );

      // Verify member was removed
      await testHelpers.assertRecordNotExists('tontine_members', {
        tontine_id: testTontine.id,
        user_id: memberUser.id
      });
    });

    test('should update member status successfully', async () => {
      // Add member first
      await tontinesController.addMember({
        params: { tontineId: testTontine.id },
        body: { userId: memberUser.id, shares: 1 }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { 
          tontineId: testTontine.id,
          userId: memberUser.id
        },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.updateMemberStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Member status updated successfully')
        })
      );

      // Verify member status was updated
      const updatedMember = await testHelpers.assertRecordExists('tontine_members', {
        tontine_id: testTontine.id,
        user_id: memberUser.id,
        status: 'approved'
      });
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

      await tontinesController.getTontines(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch tontines')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });
  });

  describe('Data Integrity', () => {
    test('should decrypt user names in responses', async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);

      const testTontine = testData.tontines[0];
      const req = {
        params: { id: testTontine.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await tontinesController.getTontineById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that creator_name is decrypted (not encrypted format)
      const response = res.json.mock.calls[0][0];
      expect(response.data.creator_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.creator_name).toBe('string');
      expect(response.data.creator_name.length).toBeGreaterThan(0);
    });
  });
});
