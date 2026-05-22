/**
 * Loans Controller Tests
 * Comprehensive testing for all loans endpoints
 */

const LoansController = require('../../controllers/loansController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('LoansController', () => {
  let testDb;
  let testHelpers;
  let loansController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    loansController = new LoansController(testDb);
    
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

  describe('GET /api/loans', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all loans successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoans(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            loans: expect.any(Array),
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

    test('should get loans with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'Pending',
          userId: testData.users[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoans(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            loans: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get loan by ID successfully', async () => {
      const testLoan = testData.loans[0];
      const req = {
        params: { loanId: testLoan.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoanById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testLoan.id
          })
        })
      );
    });

    test('should return 404 for non-existent loan', async () => {
      const req = {
        params: { loanId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid loan ID', async () => {
      const req = {
        params: { loanId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoanById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid loan ID is required')
        })
      );
    });
  });

  describe('POST /api/loans', () => {
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
      // Create some contributions for loan eligibility
      await testHelpers.createTestContribution({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 50000,
        payment_status: 'Approved'
      });
    });

    test('should create loan request successfully', async () => {
      const loanData = {
        userId: testUser.id,
        tontineId: testTontine.id,
        loanAmount: 25000.00,
        phoneNumber: '+250788123456',
        purpose: 'Emergency medical expenses',
        repaymentPeriod: 6
      };

      const req = {
        body: loanData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            loanId: expect.any(Number)
          }),
          message: expect.stringContaining('submitted successfully')
        })
      );

      // Verify loan was created in database
      await testHelpers.assertRecordExists('loan_requests', {
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: loanData.loanAmount,
        status: 'Pending'
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

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid loan amount', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanAmount: -1000, // Invalid amount
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid loan amount is required')
        })
      );
    });

    test('should return validation error for invalid phone number', async () => {
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanAmount: 25000,
          phoneNumber: 'invalid-phone'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid phone number')
        })
      );
    });

    test('should return foreign key error for non-existent user', async () => {
      const req = {
        body: {
          userId: 99999, // Non-existent user
          tontineId: testTontine.id,
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

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
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

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
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

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
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine is not active')
        })
      );
    });

    test('should return duplicate error for existing pending loan', async () => {
      // Create existing pending loan
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Pending'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User already has an active loan request for this tontine')
        })
      );
    });

    test('should return duplicate error for existing approved loan', async () => {
      // Create existing approved loan
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanAmount: 25000,
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User already has an approved loan for this tontine')
        })
      );
    });
  });

  describe('PUT /api/loans/:id/status', () => {
    let testLoan;
    let testUser;
    let testTontine;
    let adminUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      adminUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Pending'
      });
    });

    test('should update loan status successfully', async () => {
      const req = {
        params: { loanId: testLoan.id },
        body: { 
          status: 'Approved',
          notes: 'Loan approved after review',
          approvedBy: adminUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.updateLoanStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify loan was updated in database
      const updatedLoan = await testHelpers.assertRecordExists('loan_requests', {
        id: testLoan.id,
        status: 'Approved'
      });
    });

    test('should return validation error for invalid loan ID', async () => {
      const req = {
        params: { loanId: 'invalid' },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.updateLoanStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid loan ID is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        params: { loanId: testLoan.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.updateLoanStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return foreign key error for non-existent loan', async () => {
      const req = {
        params: { loanId: 99999 },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.updateLoanStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan not found')
        })
      );
    });

    test('should return foreign key error for non-existent approver', async () => {
      const req = {
        params: { loanId: testLoan.id },
        body: { 
          status: 'Approved',
          approvedBy: 99999 // Non-existent user
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.updateLoanStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Approving user not found')
        })
      );
    });
  });

  describe('Loan Payments', () => {
    let testLoan;
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
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });
    });

    test('should create loan payment successfully', async () => {
      const paymentData = {
        userId: testUser.id,
        loanId: testLoan.id,
        amount: 19500.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'LOANPAY123' }
      };

      const req = {
        body: paymentData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.createLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paymentId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify payment was created in database
      await testHelpers.assertRecordExists('loan_payments', {
        user_id: testUser.id,
        loan_id: testLoan.id,
        amount: paymentData.amount,
        payment_status: 'Pending'
      });
    });

    test('should return validation error for invalid loan status', async () => {
      // Create loan with rejected status
      const rejectedLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Rejected'
      });

      const req = {
        body: {
          userId: testUser.id,
          loanId: rejectedLoan.id,
          amount: 19500,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.createLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan is not eligible for payment')
        })
      );
    });

    test('should get loan payment history', async () => {
      // Create some payments
      await testHelpers.createTestLoanPayment({
        user_id: testUser.id,
        loan_id: testLoan.id,
        amount: 19500,
        payment_status: 'Approved'
      });
      await testHelpers.createTestLoanPayment({
        user_id: testUser.id,
        loan_id: testLoan.id,
        amount: 19500,
        payment_status: 'Pending'
      });

      const req = {
        params: { loanId: testLoan.id },
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoanPaymentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            payments: expect.any(Array),
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

  describe('DELETE /api/loans/:id', () => {
    let testLoan;
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
      testLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Pending'
      });
    });

    test('should delete loan successfully', async () => {
      const req = {
        params: { loanId: testLoan.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.deleteLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify loan was deleted from database
      await testHelpers.assertRecordNotExists('loan_requests', {
        id: testLoan.id
      });
    });

    test('should return validation error for invalid loan ID', async () => {
      const req = {
        params: { loanId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.deleteLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid loan ID is required')
        })
      );
    });

    test('should return 404 for non-existent loan', async () => {
      const req = {
        params: { loanId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.deleteLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete approved loans', async () => {
      // Create approved loan
      const approvedLoan = await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      const req = {
        params: { loanId: approvedLoan.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.deleteLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot delete approved loan')
        })
      );
    });
  });

  describe('Loan Statistics', () => {
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

    test('should get loan statistics', async () => {
      // Create multiple loans
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 25000,
        status: 'Pending'
      });
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 35000,
        status: 'Approved'
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

      await loansController.getLoanStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalLoans: expect.any(Number),
            totalAmount: expect.any(Number),
            pendingLoans: expect.any(Number),
            approvedLoans: expect.any(Number),
            averageAmount: expect.any(Number)
          })
        })
      );
    });

    test('should get user loan history', async () => {
      // Create loans for user
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });
      await testHelpers.createTestLoan({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        status: 'Pending'
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

      await loansController.getUserLoanHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            loans: expect.any(Array),
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

      await loansController.getLoans(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch loans')
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

      const testLoan = testData.loans[0];
      const req = {
        params: { loanId: testLoan.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.getLoanById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that user_name is decrypted
      const response = res.json.mock.calls[0][0];
      expect(response.data.user_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.user_name).toBe('string');
      expect(response.data.user_name.length).toBeGreaterThan(0);
    });

    test('should validate loan eligibility based on contributions', async () => {
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
      
      // User with no contributions should not be eligible for large loans
      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          loanAmount: 100000, // Large amount without contributions
          phoneNumber: '+250788123456'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await loansController.requestLoan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Insufficient contributions')
        })
      );
    });
  });
});
