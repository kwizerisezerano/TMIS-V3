/**
 * Payments Controller Tests
 * Comprehensive testing for all payments endpoints
 */

const PaymentsController = require('../../controllers/paymentsController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('PaymentsController', () => {
  let testDb;
  let testHelpers;
  let paymentsController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    paymentsController = new PaymentsController(testDb);
    
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

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all payments successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            payments: expect.any(Array),
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

    test('should get payments with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'Approved',
          type: 'loan_payment',
          userId: testData.users[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            payments: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get payment by ID successfully', async () => {
      const testPayment = testData.payments[0];
      const req = {
        params: { paymentId: testPayment.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPaymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testPayment.id
          })
        })
      );
    });

    test('should return 404 for non-existent payment', async () => {
      const req = {
        params: { paymentId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPaymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid payment ID', async () => {
      const req = {
        params: { paymentId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPaymentById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid payment ID is required')
        })
      );
    });
  });

  describe('POST /api/payments/contributions', () => {
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

    test('should process contribution payment successfully', async () => {
      const paymentData = {
        userId: testUser.id,
        tontineId: testTontine.id,
        amount: 20000.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'CONTRIB123' }
      };

      const req = {
        body: paymentData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.processContributionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paymentId: expect.any(Number)
          }),
          message: expect.stringContaining('processed successfully')
        })
      );

      // Verify payment was created in database
      await testHelpers.assertRecordExists('payments', {
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: paymentData.amount,
        payment_type: 'contribution',
        status: 'pending'
      });

      // Verify contribution record was created
      await testHelpers.assertRecordExists('contributions', {
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: paymentData.amount,
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

      await paymentsController.processContributionPayment(req, res);

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

      await paymentsController.processContributionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid payment amount is required')
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

      await paymentsController.processContributionPayment(req, res);

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

      await paymentsController.processContributionPayment(req, res);

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

      await paymentsController.processContributionPayment(req, res);

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

      await paymentsController.processContributionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine is not active')
        })
      );
    });

    test('should return duplicate error for same transaction reference', async () => {
      // Create existing payment with same transaction ref
      const transactionRef = `PAY-${Date.now()}-${testUser.id}-${testTontine.id}`;
      await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        transaction_ref: transactionRef
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

      // Mock the transaction reference generation to return the same value
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => parseInt(transactionRef.split('-')[1]));

      await paymentsController.processContributionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Transaction reference conflict')
        })
      );

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('POST /api/payments/loans', () => {
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

    test('should process loan payment successfully', async () => {
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

      await paymentsController.processLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paymentId: expect.any(Number)
          }),
          message: expect.stringContaining('processed successfully')
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

      await paymentsController.processLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return foreign key error for non-existent loan', async () => {
      const req = {
        body: {
          userId: testUser.id,
          loanId: 99999, // Non-existent loan
          amount: 19500,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.processLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan not found')
        })
      );
    });

    test('should return error for loan not owned by user', async () => {
      const otherUser = await testHelpers.createTestUser({
        role: 'member'
      });
      const otherLoan = await testHelpers.createTestLoan({
        user_id: otherUser.id,
        tontine_id: testTontine.id,
        status: 'Approved'
      });

      const req = {
        body: {
          userId: testUser.id, // Different user
          loanId: otherLoan.id, // Loan owned by other user
          amount: 19500,
          paymentMethod: 'mobile_money'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.processLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan not found or not eligible for payment')
        })
      );
    });

    test('should return error for ineligible loan status', async () => {
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

      await paymentsController.processLoanPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Loan not found or not eligible for payment')
        })
      );
    });
  });

  describe('PUT /api/payments/:id/status', () => {
    let testPayment;
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
      testPayment = await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Pending'
      });
    });

    test('should update payment status successfully', async () => {
      const req = {
        params: { paymentId: testPayment.id },
        body: { 
          status: 'Approved',
          notes: 'Payment verified and approved'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify payment was updated in database
      const updatedPayment = await testHelpers.assertRecordExists('payments', {
        id: testPayment.id,
        status: 'Approved'
      });
    });

    test('should return validation error for invalid payment ID', async () => {
      const req = {
        params: { paymentId: 'invalid' },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid payment ID is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        params: { paymentId: testPayment.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return 404 for non-existent payment', async () => {
      const req = {
        params: { paymentId: 99999 },
        body: { status: 'Approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.updatePaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('DELETE /api/payments/:id', () => {
    let testPayment;
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
      testPayment = await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Pending'
      });
    });

    test('should delete payment successfully', async () => {
      const req = {
        params: { paymentId: testPayment.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify payment was deleted from database
      await testHelpers.assertRecordNotExists('payments', {
        id: testPayment.id
      });
    });

    test('should return validation error for invalid payment ID', async () => {
      const req = {
        params: { paymentId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid payment ID is required')
        })
      );
    });

    test('should return 404 for non-existent payment', async () => {
      const req = {
        params: { paymentId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete approved payments', async () => {
      // Create approved payment
      const approvedPayment = await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        payment_status: 'Approved'
      });

      const req = {
        params: { paymentId: approvedPayment.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.deletePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot delete approved payment')
        })
      );
    });
  });

  describe('Payment Statistics', () => {
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

    test('should get payment statistics', async () => {
      // Create multiple payments
      await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 20000,
        payment_status: 'Approved'
      });
      await testHelpers.createTestPayment({
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

      await paymentsController.getPaymentStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalPayments: expect.any(Number),
            totalAmount: expect.any(Number),
            approvedAmount: expect.any(Number),
            pendingAmount: expect.any(Number),
            averageAmount: expect.any(Number)
          })
        })
      );
    });

    test('should get user payment history', async () => {
      // Create payments for user
      await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 20000,
        payment_status: 'Approved'
      });
      await testHelpers.createTestPayment({
        user_id: testUser.id,
        tontine_id: testTontine.id,
        amount: 15000,
        payment_status: 'Pending'
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

      await paymentsController.getUserPaymentHistory(req, res);

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

      await paymentsController.getPayments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch payments')
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

      const testPayment = testData.payments[0];
      const req = {
        params: { paymentId: testPayment.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.getPaymentById(req, res);

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

      // Create first payment
      const req1 = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res1 = { json: jest.fn(), status: jest.fn(() => res1) };

      await paymentsController.processContributionPayment(req1, res1);

      // Wait a bit to ensure different timestamp
      await testHelpers.wait(10);

      // Create second payment
      const req2 = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'mobile_money'
        }
      };
      const res2 = { json: jest.fn(), status: jest.fn(() => res2) };

      await paymentsController.processContributionPayment(req2, res2);

      // Get both payments and verify different transaction refs
      const [payments] = await testDb.execute(
        'SELECT transaction_ref FROM payments WHERE user_id = ? AND tontine_id = ?',
        [testUser.id, testTontine.id]
      );

      expect(payments).toHaveLength(2);
      expect(payments[0].transaction_ref).not.toBe(payments[1].transaction_ref);
    });

    test('should validate payment method', async () => {
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

      const req = {
        body: {
          userId: testUser.id,
          tontineId: testTontine.id,
          amount: 20000,
          paymentMethod: 'invalid_method' // Invalid payment method
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await paymentsController.processContributionPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid payment method')
        })
      );
    });
  });
});
