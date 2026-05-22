/**
 * Members Controller Tests
 * Comprehensive testing for all members endpoints with all possible scenarios
 */

const MembersController = require('../../controllers/membersController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('MembersController', () => {
  let testDb;
  let testHelpers;
  let membersController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    membersController = new MembersController(testDb);
    
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

  describe('GET /api/members', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all members successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            members: expect.any(Array),
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

    test('should get members with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'approved',
          tontineId: testData.tontines[0].id,
          userId: testData.users[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            members: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get member by ID successfully', async () => {
      const testMember = testData.memberships[0];
      const req = {
        params: { memberId: testMember.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testMember.id
          })
        })
      );
    });

    test('should return 404 for non-existent member', async () => {
      const req = {
        params: { memberId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid member ID', async () => {
      const req = {
        params: { memberId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid member ID is required')
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

      await membersController.getMembers(req, res);

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

      await membersController.getMembers(req, res);

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

  describe('POST /api/members', () => {
    let testUser;
    let testTontine;
    let adminUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      adminUser = await testHelpers.createTestUser({
        role: 'admin'
      });
    });

    test('should add member successfully', async () => {
      const memberData = {
        tontineId: testTontine.id,
        userId: testUser.id,
        shares: 2,
        status: 'pending'
      };

      const req = {
        body: memberData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            memberId: expect.any(Number)
          }),
          message: expect.stringContaining('added successfully')
        })
      );

      // Verify member was created in database
      await testHelpers.assertRecordExists('tontine_members', {
        tontine_id: testTontine.id,
        user_id: testUser.id,
        shares: 2,
        status: 'pending'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          // Missing userId and other required fields
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid shares', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          userId: testUser.id,
          shares: -1 // Invalid shares
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid shares value is required')
        })
      );
    });

    test('should return validation error for invalid status', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          userId: testUser.id,
          shares: 1,
          status: 'invalid_status'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid status is required')
        })
      );
    });

    test('should return foreign key error for non-existent user', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          userId: 99999, // Non-existent user
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

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
          tontineId: 99999, // Non-existent tontine
          userId: testUser.id,
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine not found')
        })
      );
    });

    test('should return duplicate error for existing member', async () => {
      // Create existing member
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'pending'
      });

      const req = {
        body: {
          tontineId: testTontine.id,
          userId: testUser.id, // Same user
          shares: 2,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User is already a member of this tontine')
        })
      );
    });

    test('should return error for inactive tontine', async () => {
      const inactiveTontine = await testHelpers.createTestTontine({
        status: 'inactive'
      });

      const req = {
        body: {
          tontineId: inactiveTontine.id, // Inactive tontine
          userId: testUser.id,
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine is not active')
        })
      );
    });

    test('should return error when tontine is at max capacity', async () => {
      // Create tontine with max members = 2
      const smallTontine = await testHelpers.createTestTontine({
        max_members: 2,
        status: 'active'
      });

      // Add 2 members to reach capacity
      await testHelpers.createTestMembership({
        tontine_id: smallTontine.id,
        user_id: adminUser.id,
        status: 'approved'
      });
      await testHelpers.createTestMembership({
        tontine_id: smallTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });

      const newUser = await testHelpers.createTestUser({
        role: 'member'
      });

      const req = {
        body: {
          tontineId: smallTontine.id,
          userId: newUser.id,
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine has reached maximum capacity')
        })
      );
    });

    test('should handle zero shares value', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          userId: testUser.id,
          shares: 0, // Zero shares
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Shares must be at least 1')
        })
      );
    });

    test('should handle very large shares value', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          userId: testUser.id,
          shares: 1000, // Very large shares
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Shares cannot exceed')
        })
      );
    });
  });

  describe('PUT /api/members/:id', () => {
    let testMembership;
    let testUser;
    let testTontine;

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
        status: 'pending'
      });
    });

    test('should update member status successfully', async () => {
      const updateData = {
        status: 'approved',
        shares: 3,
        notes: 'Approved after review'
      };

      const req = {
        params: { memberId: testMembership.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify member was updated in database
      const updatedMember = await testHelpers.assertRecordExists('tontine_members', {
        id: testMembership.id,
        status: 'approved',
        shares: 3
      });
    });

    test('should return validation error for invalid member ID', async () => {
      const req = {
        params: { memberId: 'invalid' },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid member ID is required')
        })
      );
    });

    test('should return 404 for non-existent member', async () => {
      const req = {
        params: { memberId: 99999 },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

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
        params: { memberId: testMembership.id },
        body: { status: 'invalid_status' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

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
        params: { memberId: testMembership.id },
        body: { status: 'approved' } // Only updating status
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should handle empty update body', async () => {
      const req = {
        params: { memberId: testMembership.id },
        body: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No valid fields to update')
        })
      );
    });

    test('should prevent status downgrade from approved to pending', async () => {
      // Create approved member
      const approvedMember = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });

      const req = {
        params: { memberId: approvedMember.id },
        body: { status: 'pending' } // Trying to downgrade
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot downgrade member status')
        })
      );
    });

    test('should allow status upgrade from pending to approved', async () => {
      const req = {
        params: { memberId: testMembership.id },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );
    });

    test('should allow status change from approved to rejected', async () => {
      // Create approved member
      const approvedMember = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });

      const req = {
        params: { memberId: approvedMember.id },
        body: { status: 'rejected', notes: 'Rejected due to violations' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.updateMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('DELETE /api/members/:id', () => {
    let testMembership;
    let testUser;
    let testTontine;

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
        status: 'pending'
      });
    });

    test('should delete member successfully', async () => {
      const req = {
        params: { memberId: testMembership.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('removed successfully')
        })
      );

      // Verify member was deleted from database
      await testHelpers.assertRecordNotExists('tontine_members', {
        id: testMembership.id
      });
    });

    test('should return validation error for invalid member ID', async () => {
      const req = {
        params: { memberId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid member ID is required')
        })
      );
    });

    test('should return 404 for non-existent member', async () => {
      const req = {
        params: { memberId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete approved members', async () => {
      // Create approved member
      const approvedMember = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'approved'
      });

      const req = {
        params: { memberId: approvedMember.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot remove approved member')
        })
      );
    });

    test('should allow deletion of pending members', async () => {
      const pendingMember = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'pending'
      });

      const req = {
        params: { memberId: pendingMember.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('removed successfully')
        })
      );
    });

    test('should allow deletion of rejected members', async () => {
      const rejectedMember = await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUser.id,
        status: 'rejected'
      });

      const req = {
        params: { memberId: rejectedMember.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.removeMember(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('removed successfully')
        })
      );
    });
  });

  describe('Member Statistics', () => {
    let testTontine;
    let testUsers;

    beforeEach(async () => {
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      
      // Create multiple users and memberships
      testUsers = await Promise.all([
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'member' })
      ]);

      // Add members with different statuses
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUsers[0].id,
        status: 'approved',
        shares: 2
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUsers[1].id,
        status: 'pending',
        shares: 1
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testUsers[2].id,
        status: 'rejected',
        shares: 1
      });
    });

    test('should get member statistics', async () => {
      const req = {
        query: { 
          tontineId: testTontine.id,
          period: 'monthly'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMemberStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalMembers: expect.any(Number),
            approvedMembers: expect.any(Number),
            pendingMembers: expect.any(Number),
            rejectedMembers: expect.any(Number),
            totalShares: expect.any(Number),
            averageShares: expect.any(Number)
          })
        })
      );
    });

    test('should get user membership history', async () => {
      const req = {
        params: { userId: testUsers[0].id },
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

      await membersController.getUserMembershipHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            memberships: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should get tontine members list', async () => {
      const req = {
        params: { tontineId: testTontine.id },
        query: { 
          status: 'approved',
          page: 1,
          limit: 10
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getTontineMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            members: expect.any(Array),
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

      await membersController.getMemberStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalMembers: 0,
            approvedMembers: 0,
            pendingMembers: 0,
            rejectedMembers: 0
          })
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    let testTontine;
    let testUsers;

    beforeEach(async () => {
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      
      testUsers = await Promise.all([
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'member' })
      ]);
    });

    test('should bulk approve members', async () => {
      // Create pending members
      const members = await Promise.all(testUsers.map(user => 
        testHelpers.createTestMembership({
          tontine_id: testTontine.id,
          user_id: user.id,
          status: 'pending'
        })
      ));

      const req = {
        body: {
          memberIds: members.map(m => m.id),
          action: 'approve',
          notes: 'Bulk approval'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.bulkUpdateMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Bulk update completed')
        })
      );

      // Verify all members were approved
      for (const member of members) {
        const updatedMember = await testHelpers.assertRecordExists('tontine_members', {
          id: member.id,
          status: 'approved'
        });
      }
    });

    test('should bulk reject members', async () => {
      // Create pending members
      const members = await Promise.all(testUsers.map(user => 
        testHelpers.createTestMembership({
          tontine_id: testTontine.id,
          user_id: user.id,
          status: 'pending'
        })
      ));

      const req = {
        body: {
          memberIds: members.map(m => m.id),
          action: 'reject',
          notes: 'Bulk rejection'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.bulkUpdateMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify all members were rejected
      for (const member of members) {
        const updatedMember = await testHelpers.assertRecordExists('tontine_members', {
          id: member.id,
          status: 'rejected'
        });
      }
    });

    test('should return validation error for invalid bulk action', async () => {
      const req = {
        body: {
          memberIds: [1, 2, 3],
          action: 'invalid_action'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.bulkUpdateMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid action is required')
        })
      );
    });

    test('should handle empty member IDs in bulk operation', async () => {
      const req = {
        body: {
          memberIds: [],
          action: 'approve'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.bulkUpdateMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Member IDs are required')
        })
      );
    });

    test('should handle mixed valid/invalid member IDs in bulk operation', async () => {
      // Create some valid members
      const validMembers = await Promise.all(testUsers.slice(0, 2).map(user => 
        testHelpers.createTestMembership({
          tontine_id: testTontine.id,
          user_id: user.id,
          status: 'pending'
        })
      ));

      const req = {
        body: {
          memberIds: [
            ...validMembers.map(m => m.id),
            99999, // Invalid member ID
            88888  // Another invalid member ID
          ],
          action: 'approve'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.bulkUpdateMembers(req, res);

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

      await membersController.getMembers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch members')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });

    test('should handle null database connection', async () => {
      const controller = new MembersController(null);
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await expect(controller.getMembers(req, res))
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

      await membersController.getMembers(req, res);

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

      const testMember = testData.memberships[0];
      const req = {
        params: { memberId: testMember.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.getMemberById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that user data is decrypted
      const response = res.json.mock.calls[0][0];
      expect(response.data.user_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.user_name).toBe('string');
      expect(response.data.user_name.length).toBeGreaterThan(0);
    });

    test('should validate tontine capacity on member addition', async () => {
      // Create tontine with max capacity
      const smallTontine = await testHelpers.createTestTontine({
        max_members: 2,
        status: 'active'
      });

      // Add 2 approved members
      const adminUser = await testHelpers.createTestUser({ role: 'admin' });
      const memberUser = await testHelpers.createTestUser({ role: 'member' });

      await testHelpers.createTestMembership({
        tontine_id: smallTontine.id,
        user_id: adminUser.id,
        status: 'approved'
      });
      await testHelpers.createTestMembership({
        tontine_id: smallTontine.id,
        user_id: memberUser.id,
        status: 'approved'
      });

      // Try to add a third member
      const newUser = await testHelpers.createTestUser({ role: 'member' });

      const req = {
        body: {
          tontineId: smallTontine.id,
          userId: newUser.id,
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine has reached maximum capacity')
        })
      );
    });

    test('should validate member role requirements', async () => {
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      
      // Try to add a user with 'admin' role as a regular member
      const adminUser = await testHelpers.createTestUser({ role: 'admin' });

      const req = {
        body: {
          tontineId: testTontine.id,
          userId: adminUser.id,
          shares: 1,
          status: 'pending'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await membersController.addMember(req, res);

      // Should allow admin to be a member (admins can be members too)
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle concurrent member additions', async () => {
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });

      const testUser = await testHelpers.createTestUser({ role: 'member' });

      // Simulate concurrent addition attempts
      const memberData = {
        tontineId: testTontine.id,
        userId: testUser.id,
        shares: 1,
        status: 'pending'
      };

      const req1 = { body: memberData };
      const req2 = { body: memberData };
      const res1 = { json: jest.fn(), status: jest.fn(() => res1) };
      const res2 = { json: jest.fn(), status: jest.fn(() => res2) };

      // First request should succeed
      await membersController.addMember(req1, res1);
      expect(res1.status).toHaveBeenCalledWith(201);

      // Second request should fail due to duplicate
      await membersController.addMember(req2, res2);
      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User is already a member')
        })
      );
    });
  });

  describe('Performance Testing', () => {
    test('should handle large member lists efficiently', async () => {
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });

      // Create many members
      const members = [];
      for (let i = 0; i < 50; i++) {
        const user = await testHelpers.createTestUser({
          email: `member${i}@test.com`,
          phone: `+250788${1000 + i}`
        });
        
        const member = await testHelpers.createTestMembership({
          tontine_id: testTontine.id,
          user_id: user.id,
          status: 'approved'
        });
        members.push(member);
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
      await membersController.getMembers(req, res);
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
          status: 'approved',
          search: 'Test',
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      const startTime = Date.now();
      await membersController.getMembers(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
