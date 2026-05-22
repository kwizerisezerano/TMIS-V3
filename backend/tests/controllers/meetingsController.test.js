/**
 * Meetings Controller Tests
 * Comprehensive testing for all meetings endpoints
 */

const MeetingsController = require('../../controllers/meetingsController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('MeetingsController', () => {
  let testDb;
  let testHelpers;
  let meetingsController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    meetingsController = new MeetingsController(testDb);
    
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

  describe('GET /api/meetings', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all meetings successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            meetings: expect.any(Array),
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

    test('should get meetings with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          status: 'scheduled',
          tontineId: testData.tontines[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetings(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            meetings: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get meeting by ID successfully', async () => {
      const testMeeting = testData.meetings[0];
      const req = {
        params: { meetingId: testMeeting.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetingById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testMeeting.id
          })
        })
      );
    });

    test('should return 404 for non-existent meeting', async () => {
      const req = {
        params: { meetingId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetingById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid meeting ID', async () => {
      const req = {
        params: { meetingId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetingById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid meeting ID is required')
        })
      );
    });
  });

  describe('POST /api/meetings', () => {
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
    });

    test('should create meeting successfully', async () => {
      const meetingData = {
        tontineId: testTontine.id,
        title: 'Test Meeting',
        description: 'Meeting for testing purposes',
        meetingDate: '2024-12-15 14:00:00',
        location: 'Conference Room A',
        createdBy: testUser.id
      };

      const req = {
        body: meetingData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            meetingId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify meeting was created in database
      await testHelpers.assertRecordExists('meetings', {
        tontine_id: testTontine.id,
        title: meetingData.title,
        status: 'scheduled'
      });
    });

    test('should return validation error for missing required fields', async () => {
      const req = {
        body: {
          title: 'Test Meeting',
          // Missing other required fields
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return foreign key error for non-existent tontine', async () => {
      const req = {
        body: {
          tontineId: 99999, // Non-existent tontine
          title: 'Test Meeting',
          meetingDate: '2024-12-15 14:00:00',
          location: 'Conference Room A',
          createdBy: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine not found')
        })
      );
    });

    test('should return foreign key error for non-existent creator', async () => {
      const req = {
        body: {
          tontineId: testTontine.id,
          title: 'Test Meeting',
          meetingDate: '2024-12-15 14:00:00',
          location: 'Conference Room A',
          createdBy: 99999 // Non-existent user
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Creator not found')
        })
      );
    });

    test('should return duplicate error for same date/time per tontine', async () => {
      // Create existing meeting
      await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        meeting_date: '2024-12-15 14:00:00',
        created_by: testUser.id
      });

      const req = {
        body: {
          tontineId: testTontine.id,
          title: 'Another Meeting',
          meetingDate: '2024-12-15 14:00:00', // Same date/time
          location: 'Conference Room B',
          createdBy: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Meeting already scheduled for this date and time')
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
          title: 'Test Meeting',
          meetingDate: '2024-12-15 14:00:00',
          location: 'Conference Room A',
          createdBy: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tontine is not active')
        })
      );
    });
  });

  describe('PUT /api/meetings/:id', () => {
    let testMeeting;
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'scheduled'
      });
    });

    test('should update meeting successfully', async () => {
      const updateData = {
        title: 'Updated Meeting Title',
        description: 'Updated description',
        meetingDate: '2024-12-20 15:00:00',
        location: 'Conference Room B',
        status: 'scheduled'
      };

      const req = {
        params: { meetingId: testMeeting.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.updateMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify meeting was updated in database
      const updatedMeeting = await testHelpers.assertRecordExists('meetings', {
        id: testMeeting.id,
        title: updateData.title
      });
    });

    test('should return validation error for invalid meeting ID', async () => {
      const req = {
        params: { meetingId: 'invalid' },
        body: { title: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.updateMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid meeting ID is required')
        })
      );
    });

    test('should return 404 for non-existent meeting', async () => {
      const req = {
        params: { meetingId: 99999 },
        body: { title: 'Updated Name' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.updateMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return duplicate error for existing date/time', async () => {
      // Create another meeting with different date/time
      const otherMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        meeting_date: '2024-12-20 15:00:00',
        created_by: testUser.id
      });

      const req = {
        params: { meetingId: testMeeting.id },
        body: { 
          meetingDate: '2024-12-20 15:00:00' // Same date/time as other meeting
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.updateMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Meeting already scheduled for this date and time')
        })
      );
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    let testMeeting;
    let testUser;
    let testTontine;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'scheduled'
      });
    });

    test('should delete meeting successfully', async () => {
      const req = {
        params: { meetingId: testMeeting.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.deleteMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify meeting was deleted from database
      await testHelpers.assertRecordNotExists('meetings', {
        id: testMeeting.id
      });
    });

    test('should return validation error for invalid meeting ID', async () => {
      const req = {
        params: { meetingId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.deleteMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid meeting ID is required')
        })
      );
    });

    test('should return 404 for non-existent meeting', async () => {
      const req = {
        params: { meetingId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.deleteMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should not delete completed meetings', async () => {
      // Create completed meeting
      const completedMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'completed'
      });

      const req = {
        params: { meetingId: completedMeeting.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.deleteMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Cannot delete completed meeting')
        })
      );
    });
  });

  describe('Meeting Attendance', () => {
    let testMeeting;
    let testUser;
    let testTontine;
    let testMember;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'scheduled'
      });
      testMember = await testHelpers.createTestUser({
        role: 'member'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testMember.id,
        status: 'approved'
      });
    });

    test('should record attendance successfully', async () => {
      const attendanceData = {
        userId: testMember.id,
        status: 'present',
        arrivalTime: '2024-12-15 14:05:00'
      };

      const req = {
        params: { meetingId: testMeeting.id },
        body: attendanceData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.recordAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attendanceId: expect.any(Number)
          }),
          message: expect.stringContaining('recorded successfully')
        })
      );

      // Verify attendance was recorded
      await testHelpers.assertRecordExists('meeting_attendance', {
        meeting_id: testMeeting.id,
        user_id: testMember.id,
        status: 'present'
      });
    });

    test('should return duplicate error for existing attendance', async () => {
      // Record attendance first
      await meetingsController.recordAttendance({
        params: { meetingId: testMeeting.id },
        body: { userId: testMember.id, status: 'present' }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { meetingId: testMeeting.id },
        body: { userId: testMember.id, status: 'absent' } // Same user
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.recordAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Attendance already recorded')
        })
      );
    });

    test('should return error for non-member user', async () => {
      const nonMemberUser = await testHelpers.createTestUser({
        role: 'member'
      });

      const req = {
        params: { meetingId: testMeeting.id },
        body: { userId: nonMemberUser.id, status: 'present' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.recordAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User is not a member of this tontine')
        })
      );
    });

    test('should get meeting attendance', async () => {
      // Record some attendance
      await meetingsController.recordAttendance({
        params: { meetingId: testMeeting.id },
        body: { userId: testMember.id, status: 'present' }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { meetingId: testMeeting.id },
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.getMeetingAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attendance: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should update attendance status', async () => {
      // Record attendance first
      await meetingsController.recordAttendance({
        params: { meetingId: testMeeting.id },
        body: { userId: testMember.id, status: 'present' }
      }, { json: jest.fn(), status: jest.fn(() => ({ json: jest.fn() })) });

      const req = {
        params: { 
          meetingId: testMeeting.id,
          userId: testMember.id
        },
        body: { status: 'late' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.updateAttendanceStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify attendance status was updated
      const updatedAttendance = await testHelpers.assertRecordExists('meeting_attendance', {
        meeting_id: testMeeting.id,
        user_id: testMember.id,
        status: 'late'
      });
    });
  });

  describe('Meeting Statistics', () => {
    let testMeeting;
    let testUser;
    let testTontine;
    let testMember;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });
      testMeeting = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'scheduled'
      });
      testMember = await testHelpers.createTestUser({
        role: 'member'
      });
      await testHelpers.createTestMembership({
        tontine_id: testTontine.id,
        user_id: testMember.id,
        status: 'approved'
      });
    });

    test('should get meeting statistics', async () => {
      // Create multiple meetings with different statuses
      await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'completed'
      });
      await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'cancelled'
      });

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

      await meetingsController.getMeetingStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalMeetings: expect.any(Number),
            scheduledMeetings: expect.any(Number),
            completedMeetings: expect.any(Number),
            cancelledMeetings: expect.any(Number),
            averageAttendance: expect.any(Number)
          })
        })
      );
    });

    test('should get user attendance history', async () => {
      // Create some meetings and attendance
      const meeting1 = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'completed'
      });
      const meeting2 = await testHelpers.createTestMeeting({
        tontine_id: testTontine.id,
        created_by: testUser.id,
        status: 'completed'
      });

      await testHelpers.createTestMeetingAttendance({
        meeting_id: meeting1.id,
        user_id: testMember.id,
        status: 'present'
      });
      await testHelpers.createTestMeetingAttendance({
        meeting_id: meeting2.id,
        user_id: testMember.id,
        status: 'absent'
      });

      const req = {
        params: { userId: testMember.id },
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

      await meetingsController.getUserAttendanceHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            attendance: expect.any(Array),
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

      await meetingsController.getMeetings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch meetings')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });
  });

  describe('Data Integrity', () => {
    test('should validate meeting date format', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });

      const req = {
        body: {
          tontineId: testTontine.id,
          title: 'Test Meeting',
          meetingDate: 'invalid-date', // Invalid date format
          location: 'Conference Room A',
          createdBy: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid meeting date format')
        })
      );
    });

    test('should prevent past meeting dates', async () => {
      const testUser = await testHelpers.createTestUser({
        role: 'admin'
      });
      const testTontine = await testHelpers.createTestTontine({
        status: 'active'
      });

      const req = {
        body: {
          tontineId: testTontine.id,
          title: 'Test Meeting',
          meetingDate: '2020-01-01 14:00:00', // Past date
          location: 'Conference Room A',
          createdBy: testUser.id
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.createMeeting(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Meeting date cannot be in the past')
        })
      );
    });

    test('should validate attendance status', async () => {
      const testMeeting = await testHelpers.createTestMeeting({
        status: 'scheduled'
      });
      const testMember = await testHelpers.createTestUser({
        role: 'member'
      });

      const req = {
        params: { meetingId: testMeeting.id },
        body: { 
          userId: testMember.id,
          status: 'invalid_status' // Invalid status
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await meetingsController.recordAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid attendance status')
        })
      );
    });
  });
});
