/**
 * API Integration Tests
 * End-to-end testing of API endpoints
 */

const request = require('supertest');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('API Integration Tests', () => {
  let app;
  let testDb;
  let testHelpers;
  let testData;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    app = require('../../server');
    testHelpers = new TestHelpers(app, testDb);
    
    // Get test data
    testData = require('../seeders/testDataSeeder').getTestData();
    
    // Create auth token for testing
    const testUser = testData.users[0];
    authToken = testHelpers.generateTestToken(testUser);
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

  describe('Applications API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/applications should return paginated applications', async () => {
      const response = await request(app)
        .get('/api/applications')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('applications');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.applications).toBeInstanceOf(Array);
    });

    test('POST /api/applications should create new application', async () => {
      const applicationData = {
        names: 'Integration Test User',
        email: 'integration@test.com',
        phone: '+250788999888',
        idNumber: '1199080099887766'
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('applicationId');
      expect(response.body.message).toContain('submitted successfully');

      // Verify application was created
      await testHelpers.assertRecordExists('applications', {
        status: 'pending'
      });
    });

    test('POST /api/applications should prevent duplicate email', async () => {
      const applicationData = {
        names: 'Integration Test User',
        email: testData.applications[0].email, // Existing email
        phone: '+250788999888',
        idNumber: '1199080099887766'
      };

      const response = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Application with this email already exists');
    });

    test('GET /api/applications/:id should return specific application', async () => {
      const application = testData.applications[0];
      const response = await request(app)
        .get(`/api/applications/${application.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(application.id);
    });

    test('PUT /api/applications/:id should update application status', async () => {
      const application = testData.applications[0];
      const updateData = { status: 'approved', notes: 'Approved after review' };

      const response = await request(app)
        .put(`/api/applications/${application.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });
  });

  describe('Users API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/users should return paginated users', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.users).toBeInstanceOf(Array);
    });

    test('POST /api/users/register should create new user', async () => {
      const userData = {
        names: 'Integration Test User',
        email: 'integration@test.com',
        phone: '+250788999888',
        password: 'test123',
        role: 'member',
        id_number: '1199080099887766'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.message).toContain('registered successfully');
    });

    test('POST /api/users/register should prevent duplicate email', async () => {
      const userData = {
        names: 'Integration Test User',
        email: testData.users[0].email, // Existing email
        phone: '+250788999888',
        password: 'test123',
        role: 'member',
        id_number: '1199080099887766'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User with this email already exists');
    });

    test('PUT /api/users/:id should update user profile', async () => {
      const user = testData.users[0];
      const updateData = {
        names: 'Updated Integration User',
        phone: '+250788777666'
      };

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });
  });

  describe('Tontines API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/tontines should return paginated tontines', async () => {
      const response = await request(app)
        .get('/api/tontines')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tontines');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.tontines).toBeInstanceOf(Array);
    });

    test('POST /api/tontines should create new tontine', async () => {
      const adminUser = testData.users.find(u => u.role === 'admin');
      const tontineData = {
        name: 'Integration Test Tontine',
        description: 'Tontine for integration testing',
        contributionAmount: 25000.00,
        contributionFrequency: 'monthly',
        maxMembers: 15,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        creatorId: adminUser.id
      };

      const response = await request(app)
        .post('/api/tontines')
        .send(tontineData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tontineId');
      expect(response.body.message).toContain('created successfully');
    });

    test('POST /api/tontines should prevent duplicate names per creator', async () => {
      const adminUser = testData.users.find(u => u.role === 'admin');
      const tontineData = {
        name: testData.tontines[0].name, // Existing name
        contributionAmount: 25000.00,
        maxMembers: 15,
        creatorId: adminUser.id
      };

      const response = await request(app)
        .post('/api/tontines')
        .send(tontineData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Tontine with this name already exists for this creator');
    });

    test('POST /api/tontines/:id/members should add member', async () => {
      const tontine = testData.tontines[0];
      const memberUser = testData.users.find(u => u.role === 'member');
      const memberData = {
        userId: memberUser.id,
        shares: 2
      };

      const response = await request(app)
        .post(`/api/tontines/${tontine.id}/members`)
        .send(memberData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Member added successfully');
    });
  });

  describe('Contributions API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/contributions should return paginated contributions', async () => {
      const response = await request(app)
        .get('/api/contributions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contributions');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.contributions).toBeInstanceOf(Array);
    });

    test('POST /api/contributions should create new contribution', async () => {
      const user = testData.users[0];
      const tontine = testData.tontines[0];
      const contributionData = {
        userId: user.id,
        tontineId: tontine.id,
        amount: 20000.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'INTEGRATION123' }
      };

      const response = await request(app)
        .post('/api/contributions')
        .send(contributionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('contributionId');
      expect(response.body.message).toContain('created successfully');
    });

    test('POST /api/contributions should prevent duplicate daily contributions', async () => {
      const user = testData.users[0];
      const tontine = testData.tontines[0];
      const contributionData = {
        userId: user.id,
        tontineId: tontine.id,
        amount: 20000.00,
        paymentMethod: 'mobile_money'
      };

      // Create first contribution
      await request(app)
        .post('/api/contributions')
        .send(contributionData)
        .expect(201);

      // Try to create duplicate contribution
      const response = await request(app)
        .post('/api/contributions')
        .send(contributionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Contribution already recorded for today');
    });
  });

  describe('Loans API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/loans should return paginated loans', async () => {
      const response = await request(app)
        .get('/api/loans')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('loans');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.loans).toBeInstanceOf(Array);
    });

    test('POST /api/loans should create new loan request', async () => {
      const user = testData.users[0];
      const tontine = testData.tontines[0];
      const loanData = {
        userId: user.id,
        tontineId: tontine.id,
        loanAmount: 25000.00,
        phoneNumber: '+250788123456',
        purpose: 'Integration testing loan',
        repaymentPeriod: 6
      };

      const response = await request(app)
        .post('/api/loans')
        .send(loanData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('loanId');
      expect(response.body.message).toContain('submitted successfully');
    });

    test('POST /api/loans should prevent duplicate active loans', async () => {
      const user = testData.users[0];
      const tontine = testData.tontines[0];
      const loanData = {
        userId: user.id,
        tontineId: tontine.id,
        loanAmount: 25000.00,
        phoneNumber: '+250788123456'
      };

      // Create first loan request
      await request(app)
        .post('/api/loans')
        .send(loanData)
        .expect(201);

      // Try to create duplicate loan request
      const response = await request(app)
        .post('/api/loans')
        .send(loanData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already has an active loan request for this tontine');
    });

    test('PUT /api/loans/:id/status should update loan status', async () => {
      const loan = testData.loans.find(l => l.status === 'Pending');
      const adminUser = testData.users.find(u => u.role === 'admin');
      const updateData = {
        status: 'Approved',
        notes: 'Approved after integration testing',
        approvedBy: adminUser.id
      };

      const response = await request(app)
        .put(`/api/loans/${loan.id}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });
  });

  describe('Payments API', () => {
    beforeEach(async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('GET /api/payments should return paginated payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.payments).toBeInstanceOf(Array);
    });

    test('POST /api/payments/contributions should process contribution payment', async () => {
      const user = testData.users[0];
      const tontine = testData.tontines[0];
      const paymentData = {
        userId: user.id,
        tontineId: tontine.id,
        amount: 20000.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'INTEGRATION_PAY123' }
      };

      const response = await request(app)
        .post('/api/payments/contributions')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.message).toContain('processed successfully');
    });

    test('POST /api/payments/loans should process loan payment', async () => {
      const user = testData.users[0];
      const loan = testData.loans.find(l => l.status === 'Approved');
      const paymentData = {
        userId: user.id,
        loanId: loan.id,
        amount: 19500.00,
        paymentMethod: 'mobile_money',
        paymentData: { reference: 'INTEGRATION_LOAN_PAY123' }
      };

      const response = await request(app)
        .post('/api/payments/loans')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.message).toContain('processed successfully');
    });
  });

  describe('Authentication Integration', () => {
    test('should protect protected endpoints', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Data Flow Integration', () => {
    test('should handle complete application to user flow', async () => {
      // 1. Submit application
      const applicationData = {
        names: 'Flow Test User',
        email: 'flow@test.com',
        phone: '+250788555444',
        idNumber: '1199080055444333'
      };

      const appResponse = await request(app)
        .post('/api/applications')
        .send(applicationData)
        .expect(201);

      expect(appResponse.body.success).toBe(true);

      // 2. Approve application (simulate admin action)
      const applicationId = appResponse.body.data.applicationId;
      await request(app)
        .put(`/api/applications/${applicationId}`)
        .send({ status: 'approved' })
        .expect(200);

      // 3. Register user from approved application
      const userData = {
        names: applicationData.names,
        email: applicationData.email,
        phone: applicationData.phone,
        password: 'test123',
        role: 'member',
        id_number: applicationData.idNumber
      };

      const userResponse = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(userResponse.body.success).toBe(true);

      // 4. User joins tontine
      const tontine = testData.tontines[0];
      const userId = userResponse.body.data.userId;

      const memberResponse = await request(app)
        .post(`/api/tontines/${tontine.id}/members`)
        .send({ userId, shares: 1 })
        .expect(201);

      expect(memberResponse.body.success).toBe(true);

      // 5. User makes contribution
      const contributionData = {
        userId,
        tontineId: tontine.id,
        amount: 20000,
        paymentMethod: 'mobile_money'
      };

      const contributionResponse = await request(app)
        .post('/api/contributions')
        .send(contributionData)
        .expect(201);

      expect(contributionResponse.body.success).toBe(true);

      // 6. User requests loan
      const loanData = {
        userId,
        tontineId: tontine.id,
        loanAmount: 25000,
        phoneNumber: applicationData.phone,
        purpose: 'Flow test loan'
      };

      const loanResponse = await request(app)
        .post('/api/loans')
        .send(loanData)
        .expect(201);

      expect(loanResponse.body.success).toBe(true);

      // Verify complete flow worked
      await testHelpers.assertRecordExists('users', { email: userData.email });
      await testHelpers.assertRecordExists('tontine_members', { 
        tontine_id: tontine.id, 
        user_id: userId 
      });
      await testHelpers.assertRecordExists('contributions', { 
        user_id: userId, 
        tontine_id: tontine.id 
      });
      await testHelpers.assertRecordExists('loan_requests', { 
        user_id: userId, 
        tontine_id: tontine.id 
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle 404 errors consistently', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle validation errors consistently', async () => {
      const response = await request(app)
        .post('/api/applications')
        .send({}) // Empty request
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should handle server errors gracefully', async () => {
      // This would need a specific endpoint that triggers an error
      // For now, test malformed JSON
      const response = await request(app)
        .post('/api/applications')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    test('should handle concurrent requests', async () => {
      const promises = [];
      
      // Create multiple concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/applications')
            .query({ page: 1, limit: 5 })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should handle large pagination requests', async () => {
      const response = await request(app)
        .get('/api/applications')
        .query({ page: 1, limit: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.limit).toBe(100);
    });
  });
});
