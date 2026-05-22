/**
 * Applications Controller Tests
 * Comprehensive testing for all applications endpoints
 */

const ApplicationsController = require('../../controllers/applicationsController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('ApplicationsController', () => {
  let testDb;
  let testHelpers;
  let applicationsController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    applicationsController = new ApplicationsController(testDb);
    
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

  describe('GET /api/applications', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all applications successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.getApplications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            applications: expect.any(Array),
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

    test('should get applications with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'pending',
          search: 'Applicant'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.getApplications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should get application by ID successfully', async () => {
      const testApplication = testData.applications[0];
      const req = {
        params: { applicationId: testApplication.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.getApplicationById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testApplication.id
          })
        })
      );
    });

    test('should return 404 for non-existent application', async () => {
      const req = {
        params: { applicationId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.getApplicationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid application ID', async () => {
      const req = {
        params: { applicationId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.getApplicationById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid application ID is required')
        })
      );
    });
  });

  describe('POST /api/applications', () => {
    test('should submit application successfully', async () => {
      const applicationData = {
        names: testHelpers.generateRandomName(),
        email: testHelpers.generateRandomEmail(),
        phone: testHelpers.generateRandomPhone(),
        idNumber: testHelpers.generateRandomIdNumber()
      };

      const req = {
        body: applicationData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            applicationId: expect.any(Number)
          }),
          message: expect.stringContaining('submitted successfully')
        })
      );

      // Verify application was created in database
      await testHelpers.assertRecordExists('applications', {
        status: 'pending'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          names: 'Test User',
          // Missing email, phone
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid email', async () => {
      const req = {
        body: {
          names: 'Test User',
          email: 'invalid-email',
          phone: '+250788123456',
          idNumber: '1199080012345678'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid email format')
        })
      );
    });

    test('should return validation error for invalid phone', async () => {
      const req = {
        body: {
          names: 'Test User',
          email: 'test@example.com',
          phone: 'invalid-phone',
          idNumber: '1199080012345678'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid phone number')
        })
      );
    });

    test('should return validation error for invalid names', async () => {
      const req = {
        body: {
          names: '123', // Invalid names
          email: 'test@example.com',
          phone: '+250788123456',
          idNumber: '1199080012345678'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Names must contain only letters')
        })
      );
    });

    test('should return duplicate error for existing email', async () => {
      // Create existing application
      const existingApplication = await testHelpers.createTestApplication({
        email: 'existing@test.com'
      });

      const req = {
        body: {
          names: 'New User',
          email: 'existing@test.com', // Same email
          phone: '+250788999888',
          idNumber: '1199080099887766'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Application with this email already exists')
        })
      );
    });

    test('should return duplicate error for existing phone', async () => {
      // Create existing application
      const existingApplication = await testHelpers.createTestApplication({
        phone: '+250788555666'
      });

      const req = {
        body: {
          names: 'New User',
          email: 'new@test.com',
          phone: '+250788555666', // Same phone
          idNumber: '1199080099887766'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Application with this phone number already exists')
        })
      );
    });

    test('should return duplicate error for existing ID number', async () => {
      // Create existing application
      const existingApplication = await testHelpers.createTestApplication({
        id_number: '1199080055667788'
      });

      const req = {
        body: {
          names: 'New User',
          email: 'new@test.com',
          phone: '+250788999888',
          idNumber: '1199080055667788' // Same ID number
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Application with this ID number already exists')
        })
      );
    });
  });

  describe('PUT /api/applications/:id', () => {
    let testApplication;

    beforeEach(async () => {
      testApplication = await testHelpers.createTestApplication({
        status: 'pending'
      });
    });

    test('should update application status successfully', async () => {
      const req = {
        params: { applicationId: testApplication.id },
        body: { status: 'approved', notes: 'Application approved after review' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify application was updated in database
      const updatedApplication = await testHelpers.assertRecordExists('applications', {
        id: testApplication.id,
        status: 'approved'
      });
    });

    test('should return validation error for invalid application ID', async () => {
      const req = {
        params: { applicationId: 'invalid' },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid application ID is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        params: { applicationId: testApplication.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return 404 for non-existent application', async () => {
      const req = {
        params: { applicationId: 99999 },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.updateApplicationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('DELETE /api/applications/:id', () => {
    let testApplication;

    beforeEach(async () => {
      testApplication = await testHelpers.createTestApplication();
    });

    test('should delete application successfully', async () => {
      const req = {
        params: { applicationId: testApplication.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.deleteApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify application was deleted from database
      await testHelpers.assertRecordNotExists('applications', {
        id: testApplication.id
      });
    });

    test('should return validation error for invalid application ID', async () => {
      const req = {
        params: { applicationId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.deleteApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid application ID is required')
        })
      );
    });

    test('should return 404 for non-existent application', async () => {
      const req = {
        params: { applicationId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.deleteApplication(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
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

      await applicationsController.getApplications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch applications')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });
  });

  describe('Data Integrity', () => {
    test('should encrypt sensitive data before storage', async () => {
      const applicationData = {
        names: 'Test User',
        email: 'test@example.com',
        phone: '+250788123456',
        idNumber: '1199080012345678'
      };

      const req = {
        body: applicationData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await applicationsController.submitApplication(req, res);

      // Verify data is encrypted in database
      const [records] = await testDb.execute(
        'SELECT names, email, phone, id_number FROM applications WHERE id = ?',
        [res.json.mock.calls[0][0].data.applicationId]
      );

      const storedRecord = records[0];
      
      // Encrypted data should not match plain text
      expect(storedRecord.names).not.toBe(applicationData.names);
      expect(storedRecord.email).not.toBe(applicationData.email);
      expect(storedRecord.phone).not.toBe(applicationData.phone);
      expect(storedRecord.id_number).not.toBe(applicationData.idNumber);
    });
  });
});
