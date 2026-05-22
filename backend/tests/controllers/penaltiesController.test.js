/**
 * Penalties Controller Tests
 * Comprehensive testing for all penalties endpoints with all possible scenarios
 */

const PenaltiesController = require('../../controllers/penaltiesController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('PenaltiesController', () => {
  let testDb;
  let testHelpers;
  let penaltiesController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    penaltiesController = new PenaltiesController(testDb);
    
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

  describe('GET /api/penalties', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all penalties successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            penalties: expect.any(Array),
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

    test('should get penalties with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'pending',
          userId: testData.users[0].id,
          tontineId: testData.tontines[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            penalties: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get penalty by ID successfully', async () => {
      const testPenalty = testData.penalties[0];
      const req = {
        params: { penaltyId: testPenalty.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenaltyById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testPenalty.id
          })
        })
      );
    });

    test('should return 404 for non-existent penalty', async () => {
      const req = {
        params: { penaltyId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenaltyById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid penalty ID', async () => {
      const req = {
        params: { penaltyId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenaltyById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid penalty ID is required')
        })
      );
    });

    test('should handle empty pagination parameters', async () => {
      const req = {
        query: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 1,
              limit: 20
            })
          })
        })
      );
    });

    test('should handle large pagination values', async () => {
      const req = {
        query: { page: 100, limit: 50 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 100,
              limit: 50
            })
          })
        })
      );
    });
  });

  describe('POST /api/penalties', () => {
    let testUser;
    let testTontine;
    let testLoan;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });
    });

    test('should create penalty successfully', async () => {
      const penaltyData = {
        userId: testUser.id,
        tontineId: testTontine.id,
        loanId: testLoan.id,
        amount: 5000.00,
        reason: 'Late payment penalty',
        status: 'pending'
      };

      const req = {
        body: penaltyData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            penaltyId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify penalty was created in database
      await testHelpers.assertRecordExists('penalties', {
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        amount: penaltyData.amount,
        reason: penaltyData.reason,
        status: 'pending'
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

      await penaltiesController.createPenalty(req, res);

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
          reason: 'Test penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid penalty amount is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 5000,
          reason: 'Test penalty',
          status: 'invalid_status'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return validation error for empty reason', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 5000,
          reason: '', // Empty reason
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Reason is required')
        })
      );
    });

    test('should return foreign key error for non-existent user', async () => {
      const req = {
        body: {
          userId: 99999, // Non-existent user
          tontineId: testTontine.id,
          amount: 5000,
          reason: 'Test penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

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
          amount: 5000,
          reason: 'Test penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine not found')
        })
      );
    });

    test('should return foreign key error for non-existent loan', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanId: 99999, // Non-existent loan
          amount: 5000,
          reason: 'Test penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan not found')
        })
      );
    });

    test('should return duplicate error for existing penalty', async () => {
      // Create existing penalty
      await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'pending'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanId: testLoan.id, // Same combination
          amount: 5000,
          reason: 'Another penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty already exists for this user and loan')
        })
      );
    });

    test('should allow penalty for same user with different loan', async () => {
      // Create another loan
      const anotherLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      // Create first penalty
      await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'pending'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanId: anotherLoan.id, // Different loan
          amount: 5000,
          reason: 'Another penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('created successfully')
        })
      );
    });

    test('should handle very large penalty amount', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 999999999.99, // Very large amount
          reason: 'Large penalty test',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty amount exceeds maximum allowed')
        })
      );
    });

    test('should handle zero penalty amount', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 0, // Zero amount
          reason: 'Zero penalty test',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty amount must be greater than 0')
        })
      );
    });
  });

  describe('PUT /api/penalties/:id', () => {
    let testPenalty;
    let testUser;
    let testTontine;
    let testLoan;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });
      testPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'pending'
      });
    });

    test('should update penalty successfully', async () => {
      const updateData = {
        amount: 7500.00,
        reason: 'Updated penalty reason',
        status: 'paid',
        notes: 'Paid after grace period'
      };

      const req = {
        params: { penaltyId: testPenalty.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify penalty was updated in database
      const updatedPenalty = await testHelpers.assertRecordExists('penalties', {
        id: testPenalty.id,
        amount: updateData.amount,
        reason: updateData.reason,
        status: 'paid'
      });
    });

    test('should return validation error for invalid penalty ID', async () => {
      const req = {
        params: { penaltyId: 'invalid' },
        body: { status: 'paid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid penalty ID is required')
        })
      );
    });

    test('should return 404 for non-existent penalty', async () => {
      const req = {
        params: { penaltyId: 99999 },
        body: { status: 'paid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        params: { penaltyId: testPenalty.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should allow partial update', async () => {
      const req = {
        params: { penaltyId: testPenalty.id },
        body: { status: 'paid' } // Only updating status
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should handle empty update body', async () => {
      const req = {
        params: { penaltyId: testPenalty.id },
        body: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No valid fields to update')
        })
      );
    });

    test('should set paid_at timestamp when status changes to paid', async () => {
      const req = {
        params: { penaltyId: testPenalty.id },
        body: { status: 'paid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      // Verify paid_at timestamp was set
      const [updatedPenalty] = await testDb.execute(
        'SELECT paid_at FROM penalties WHERE id = ?',
        [testPenalty.id]
      );
      
      expect(updatedPenalty[0].paid_at).not.toBeNull();
      expect(updatedPenalty[0].paid_at).toBeInstanceOf(Date);
    });

    test('should allow status change from pending to paid', async () => {
      const req = {
        params: { penaltyId: testPenalty.id },
        body: { status: 'paid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );
    });

    test('should allow status change from paid to pending (admin override)', async () => {
      // Create paid penalty
      const paidPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'paid'
      });

      const req = {
        params: { penaltyId: paidPenalty.id },
        body: { status: 'pending', notes: 'Admin override - payment dispute' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.updatePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('DELETE /api/penalties/:id', () => {
    let testPenalty;
    let testUser;
    let testTontine;
    let testLoan;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });
      testPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'pending'
      });
    });

    test('should delete penalty successfully', async () => {
      const req = {
        params: { penaltyId: testPenalty.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.deletePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify penalty was deleted from database
      await testHelpers.assertRecordNotExists('penalties', {
        id: testPenalty.id
      });
    });

    test('should return validation error for invalid penalty ID', async () => {
      const req = {
        params: { penaltyId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.deletePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid penalty ID is required')
        })
      );
    });

    test('should return 404 for non-existent penalty', async () => {
      const req = {
        params: { penaltyId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.deletePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete paid penalties', async () => {
      // Create paid penalty
      const paidPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'paid'
      });

      const req = {
        params: { penaltyId: paidPenalty.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.deletePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot delete paid penalty')
        })
      );
    });

    test('should allow deletion of pending penalties', async () => {
      const pendingPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'pending'
      });

      const req = {
        params: { penaltyId: pendingPenalty.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.deletePenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );
    });
  });

  describe('Penalty Statistics', () => {
    let testUser;
    let testTontine;
    let testLoan;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      // Create multiple penalties with different statuses
      await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        amount: 5000,
        status: 'pending'
      });
      await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        amount: 3000,
        status: 'paid'
      });
    });

    test('should get penalty statistics', async () => {
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

      await penaltiesController.getPenaltyStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalPenalties: expect.any(Number),
            pendingPenalties: expect.any(Number),
            paidPenalties: expect.any(Number),
            totalAmount: expect.any(Number),
            pendingAmount: expect.any(Number),
            paidAmount: expect.any(Number),
            averageAmount: expect.any(Number)
          })
        })
      );
    });

    test('should get user penalty history', async () => {
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

      await penaltiesController.getUserPenaltyHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            penalties: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should get loan penalties', async () => {
      const req = {
        params: { loanId: testLoan.id },
        query: { 
          page: 1,
          limit: 10
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getLoanPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            penalties: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should handle empty statistics', async () => {
      const emptyTontine = await testHelpers.createTestTontine({
        status: 'active'
      });

      const req = {
        query: { 
          tontineId: emptyTontine.id,
          period: 'monthly'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenaltyStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalPenalties: 0,
            pendingPenalties: 0,
            paidPenalties: 0,
            totalAmount: 0
          })
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    let testUser;
    let testTontine;
    let testLoan;
    let testPenalties;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      // Create multiple penalties
      testPenalties = await Promise.all([
        testHelpers.createTestPenalty({
          user_id: testUser.id,
          tontine_id: testTontine.id,
          loan_id: testLoan.id,
          status: 'pending'
        }),
        testHelpers.createTestPenalty({
          user_id: testUser.id,
          tontine_id: testTontine.id,
          loan_id: testLoan.id,
          status: 'pending'
        }),
        testHelpers.createTestPenalty({
          user_id: testUser.id,
          tontine_id: testTontine.id,
          loan_id: testLoan.id,
          status: 'pending'
        })
      ]);
    });

    test('should bulk update penalties', async () => {
      const req = {
        body: {
          penaltyIds: testPenalties.map(p => p.id),
          action: 'mark_paid',
          notes: 'Bulk payment processed'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Bulk update completed')
        })
      );

      // Verify all penalties were updated
      for (const penalty of testPenalties) {
        const updatedPenalty = await testHelpers.assertRecordExists('penalties', {
          id: penalty.id,
          status: 'paid'
        });
      }
    });

    test('should bulk delete pending penalties', async () => {
      const req = {
        body: {
          penaltyIds: testPenalties.map(p => p.id),
          action: 'delete_pending',
          notes: 'Bulk deletion of waived penalties'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify all penalties were deleted
      for (const penalty of testPenalties) {
        await testHelpers.assertRecordNotExists('penalties', {
          id: penalty.id
        });
      }
    });

    test('should return validation error for invalid bulk action', async () => {
      const req = {
        body: {
          penaltyIds: testPenalties.map(p => p.id),
          action: 'invalid_action'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid action is required')
        })
      );
    });

    test('should handle empty penalty IDs in bulk operation', async () => {
      const req = {
        body: {
          penaltyIds: [],
          action: 'mark_paid'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty IDs are required')
        })
      );
    });

    test('should handle mixed valid/invalid penalty IDs in bulk operation', async () => {
      const req = {
        body: {
          penaltyIds: [
            ...testPenalties.map(p => p.id),
            99999, // Invalid penalty ID
            88888  // Another invalid penalty ID
          ],
          action: 'mark_paid'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            processed: expect.any(Number),
            failed: expect.any(Number)
          })
        })
      );
    });

    test('should not delete paid penalties in bulk operation', async () => {
      // Create a paid penalty
      const paidPenalty = await testHelpers.createTestPenalty({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        loan_id: testLoan.id,
        status: 'paid'
      });

      const req = {
        body: {
          penaltyIds: [paidPenalty.id],
          action: 'delete_pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.bulkUpdatePenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            failed: expect.any(Number)
          })
        })
      );

      // Verify paid penalty was not deleted
      await testHelpers.assertRecordExists('penalties', {
        id: paidPenalty.id,
        status: 'paid'
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

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch penalties')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });

    test('should handle null database connection', async () => {
      const controller = new PenaltiesController(null);
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await expect(controller.getPenalties(req, res))
        .rejects.toThrow();
    });

    test('should handle malformed query parameters', async () => {
      const req = {
        query: {
          page: 'invalid_page',
          limit: 'invalid_limit',
          status: 123 // Invalid status type
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenalties(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid parameters')
        })
      );
    });
  });

  describe('Data Integrity', () => {
    test('should decrypt user data in responses', async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);

      const testPenalty = testData.penalties[0];
      const req = {
        params: { penaltyId: testPenalty.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.getPenaltyById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that user data is decrypted
      const response = res.json.mock.calls[0][0];
      expect(response.data.user_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.user_name).toBe('string');
      expect(response.data.user_name.length).toBeGreaterThan(0);
    });

    test('should validate loan status when creating penalty', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      
      // Create rejected loan
      const rejectedLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Rejected'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanId: rejectedLoan.id, // Rejected loan
          amount: 5000,
          reason: 'Test penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty can only be applied to approved loans')
        })
      );
    });

    test('should validate penalty amount against loan amount', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      
      // Create small loan
      const smallLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 10000,
        status: 'Approved'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanId: smallLoan.id,
          amount: 15000, // Penalty larger than loan amount
          reason: 'Excessive penalty',
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await penaltiesController.createPenalty(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty amount cannot exceed loan amount')
        })
      );
    });

    test('should handle concurrent penalty creation', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      const testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      const penaltyData = {
        userId: testUser.id,
        tontineId: testTontine.id,
        loanId: testLoan.id,
        amount: 5000,
        reason: 'Test penalty',
        status: 'pending'
      };

      const req1 = { body: penaltyData };
      const req2 = { body: penaltyData };
      const res1 = { json: jest.fn(), status: jest.fn(() => res1) };
      const res2 = { json: jest.fn(), status: jest.fn(() => res2) };

      // First request should succeed
      await penaltiesController.createPenalty(req1, res1);
      expect(res1.status).toHaveBeenCalledWith(201);

      // Second request should fail due to duplicate
      await penaltiesController.createPenalty(req2, res2);
      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Penalty already exists')
        })
      );
    });
  });

  describe('Performance Testing', () => {
    test('should handle large penalty lists efficiently', async () => {
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      const testUser = await testHelpers.createTestUser({
        role: 'member'
      });

      // Create many penalties
      const penalties = [];
      for (let i = 0; i < 50; i++) {
        const testLoan = await testHelpers.createTestLoan({
          user_id: testUser.id,
          tontine_id: testTontine.id,
          status: 'Approved',
          amount: 20000 + (i * 1000)
        });
        
        const penalty = await testHelpers.createTestPenalty({
          user_id: testUser.id,
          tontine_id: testTontine.id,
          loan_id: testLoan.id,
          amount: 1000 + (i * 100),
          status: 'pending'
        });
        penalties.push(penalty);
      }

      const req = {
        query: { 
          tontineId: testTontine.id,
          page: 1,
          limit: 20
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      const startTime = Date.now();
      await penaltiesController.getPenalties(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should handle complex filtering efficiently', async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);

      const req = {
        query: { 
          page: 1,
          limit: 10,
          status: 'pending',
          search: 'penalty',
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      const startTime = Date.now();
      await penaltiesController.getPenalties(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
