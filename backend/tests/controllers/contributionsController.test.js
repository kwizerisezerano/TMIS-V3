/**
 * Contributions Controller Tests
 * Comprehensive testing for all contributions endpoints
 */

const ContributionsController = require('../../controllers/contributionsController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('ContributionsController', () => {
  let testDb;
  let testHelpers;
  let contributionsController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    contributionsController = new ContributionsController(testDb);
    
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

  describe('GET /api/contributions', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all contributions successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            contributions: expect.any(Array),
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

    test('should get contributions with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'Approved',
          type: 'contribution',
          userId: testData.users[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            contributions: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get contribution by ID successfully', async () => {
      const testContribution = testData.contributions[0];
      const req = {
        params: { contributionId: testContribution.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributionById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testContribution.id
          })
        })
      );
    });

    test('should return 404 for non-existent contribution', async () => {
      const req = {
        params: { contributionId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributionById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid contribution ID', async () => {
      const req = {
        params: { contributionId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributionById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid contribution ID is required')
        })
      );
    });
  });

  describe('POST /api/contributions', () => {
    let testUser;
    let testTontine;
    let testMembership;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testMembership = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });
    });

    test('should create contribution successfully', async () => {
      const contributionData = {
        userId: testUser.id,
        tontineId: testTontine.id,
        amount: 20000.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'TEST123' }
      };

      const req = {
        body: contributionData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            contributionId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify contribution was created in database
      await testHelpers.assertRecordExists('contributions', {
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: contributionData.amount,
        payment_status: 'Pending'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          userId: testUser.id,
          // Missing other required fields
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid amount', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: -1000, // Invalid amount
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid contribution amount is required')
        })
      );
    });

    test('should return foreign key error for non-existent user', async () => {
      const req = {
        body: {
          userId: 99999, // Non-existent user
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
    });

    test('should return foreign key error for non-existent tontine', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: 99999, // Non-existent tontine
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine not found')
        })
      );
    });

    test('should return error for non-member user', async () => {
      const nonMemberUser = await testHelpers.createTestUser({
        role: 'member'
      });

      const req = {
        body: {
          userId: nonMemberUser.id, // Not a member
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User is not an approved member of this tontine')
        })
      );
    });

    test('should return error for inactive tontine', async () => {
      const inactiveTontine = await testHelpers.createTestTontine({
        status: 'inactive'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: inactiveTontine.id, // Inactive tontine
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine is not active')
        })
      );
    });

    test('should return duplicate error for same day contribution', async () => {
      // Create existing contribution for today
      const today = new Date().toISOString().split('T')[0];
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        contribution_date: today
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.createContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Contribution already recorded for today')
        })
      );
    });
  });

  describe('PUT /api/contributions/:id', () => {
    let testContribution;
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });
      testContribution = await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Pending'
      });
    });

    test('should update contribution status successfully', async () => {
      const req = {
        params: { contributionId: testContribution.id },
        body: { 
          status: 'Approved',
          notes: 'Contribution approved after verification'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.updateContributionStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify contribution was updated in database
      const updatedContribution = await testHelpers.assertRecordExists('contributions', {
        id: testContribution.id,
        payment_status: 'Approved'
      });
    });

    test('should return validation error for invalid contribution ID', async () => {
      const req = {
        params: { contributionId: 'invalid' },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.updateContributionStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid contribution ID is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        params: { contributionId: testContribution.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.updateContributionStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return 404 for non-existent contribution', async () => {
      const req = {
        params: { contributionId: 99999 },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.updateContributionStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('DELETE /api/contributions/:id', () => {
    let testContribution;
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });
      testContribution = await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Pending'
      });
    });

    test('should delete contribution successfully', async () => {
      const req = {
        params: { contributionId: testContribution.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.deleteContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify contribution was deleted from database
      await testHelpers.assertRecordNotExists('contributions', {
        id: testContribution.id
      });
    });

    test('should return validation error for invalid contribution ID', async () => {
      const req = {
        params: { contributionId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.deleteContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid contribution ID is required')
        })
      );
    });

    test('should return 404 for non-existent contribution', async () => {
      const req = {
        params: { contributionId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.deleteContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete approved contributions', async () => {
      // Create approved contribution
      const approvedContribution = await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Approved'
      });

      const req = {
        params: { contributionId: approvedContribution.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.deleteContribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot delete approved contribution')
        })
      );
    });
  });

  describe('Contribution Statistics', () => {
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });
    });

    test('should get contribution statistics', async () => {
      // Create multiple contributions
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 20000,
        payment_status: 'Approved'
      });
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 15000,
        payment_status: 'Pending'
      });

      const req = {
        query: { 
          tontineId: testTontine.id,
          userId: testUser.id,
          period: 'monthly'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributionStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalContributions: expect.any(Number),
            totalAmount: expect.any(Number),
            approvedAmount: expect.any(Number),
            pendingAmount: expect.any(Number),
            averageAmount: expect.any(Number)
          })
        })
      );
    });

    test('should get user contribution history', async () => {
      // Create contributions for different months
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        contribution_date: '2024-01-15',
        payment_status: 'Approved'
      });
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        contribution_date: '2024-02-15',
        payment_status: 'Approved'
      });

      const req = {
        params: { userId: testUser.id },
        query: { 
          tontineId: testTontine.id,
          page: 1,
          limit: 10
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getUserContributionHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            contributions: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
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

      await contributionsController.getContributions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch contributions')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });
  });

  describe('Data Integrity', () => {
    test('should decrypt user data in responses', async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);

      const testContribution = testData.contributions[0];
      const req = {
        params: { contributionId: testContribution.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await contributionsController.getContributionById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that user_name is decrypted
      const response = res.json.mock.calls[0][0];
      expect(response.data.user_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.user_name).toBe('string');
      expect(response.data.user_name.length).toBeGreaterThan(0);
    });

    test('should generate unique transaction references', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });

      // Create first contribution
      const req1 = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res1 = { json: jest.fn(), status: jest.fn(() => res1) };

      await contributionsController.createContribution(req1, res1);

      // Create second contribution
      const req2 = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res2 = { json: jest.fn(), status: jest.fn(() => res2) };

      await contributionsController.createContribution(req2, res2);

      // Get both contributions and verify different transaction refs
      const [contributions] = await testDb.execute(
        'SELECT transaction_ref FROM contributions WHERE user_id = ? AND tontine_id = ?',
        [testUser.id, testTontine.id]
      );

      expect(contributions).toHaveLength(2);
      expect(contributions[0].transaction_ref).not.toBe(contributions[1].transaction_ref);
    });
  });
});
