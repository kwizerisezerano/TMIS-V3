/**
 * Notifications Controller Tests
 * Comprehensive testing for all notifications endpoints with all possible scenarios
 */

const NotificationsController = require('../../controllers/notificationsController');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('NotificationsController', () => {
  let testDb;
  let testHelpers;
  let notificationsController;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server'); // Import Express app
    testHelpers = new TestHelpers(app, testDb);
    
    // Initialize controller
    notificationsController = new NotificationsController(testDb);
    
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

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should get all notifications successfully', async () => {
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notifications: expect.any(Array),
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

    test('should get notifications with filters', async () => {
      const req = {
        query: { 
          page: 1, 
          limit: 5, 
          type: 'info',
          isRead: false,
          userId: testData.users[0].id,
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notifications: expect.any(Array),
            stats: expect.any(Object)
          })
        })
      );
    });

    test('should get notification by ID successfully', async () => {
      const testNotification = testData.notifications[0];
      const req = {
        params: { notificationId: testNotification.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: testNotification.id
          })
        })
      );
    });

    test('should return 404 for non-existent notification', async () => {
      const req = {
        params: { notificationId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid notification ID', async () => {
      const req = {
        params: { notificationId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid notification ID is required')
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

      await notificationsController.getNotifications(req, res);

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

      await notificationsController.getNotifications(req, res);

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

  describe('POST /api/notifications', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
    });

    test('should create notification successfully', async () => {
      const notificationData = {
        userId: testUser.id,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info'
      };

      const req = {
        body: notificationData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notificationId: expect.any(Number)
          }),
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify notification was created in database
      await testHelpers.assertRecordExists('notifications', {
        user_id: testUser.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: 0 // Should be unread by default
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

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('All required fields must be provided')
        })
      );
    });

    test('should return validation error for invalid type', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: 'Test Notification',
          message: 'Test message',
          type: 'invalid_type'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid type is required')
        })
      );
    });

    test('should return validation error for empty title', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: '', // Empty title
          message: 'Test message',
          type: 'info'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Title is required')
        })
      );
    });

    test('should return validation error for empty message', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: 'Test Notification',
          message: '', // Empty message
          type: 'info'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Message is required')
        })
      );
    });

    test('should return foreign key error for non-existent user', async () => {
      const req = {
        body: {
          userId: 99999, // Non-existent user
          title: 'Test Notification',
          message: 'Test message',
          type: 'info'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
    });

    test('should handle very long title', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: 'A'.repeat(300), // Very long title
          message: 'Test message',
          type: 'info'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Title cannot exceed')
        })
      );
    });

    test('should handle very long message', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: 'Test Notification',
          message: 'B'.repeat(2000), // Very long message
          type: 'info'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Message cannot exceed')
        })
      );
    });

    test('should create notification with custom read status', async () => {
      const req = {
        body: {
          userId: testUser.id,
          title: 'Read Notification',
          message: 'This notification is already read',
          type: 'info',
          isRead: true
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('created successfully')
        })
      );

      // Verify notification was created with read status
      await testHelpers.assertRecordExists('notifications', {
        user_id: testUser.id,
        title: 'Read Notification',
        read: 1
      });
    });

    test('should create notification with all valid types', async () => {
      const validTypes = ['info', 'warning', 'error', 'success'];
      
      for (const type of validTypes) {
        const req = {
          body: {
            userId: testUser.id,
            title: `${type} Notification`,
            message: `This is a ${type} notification`,
            type: type
          }
        };
        const res = {
          json: jest.fn(),
          status: jest.fn(() => res)
        };

        await notificationsController.createNotification(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true
          })
        );
      }
    });
  });

  describe('PUT /api/notifications/:id', () => {
    let testNotification;
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testNotification = await testHelpers.createTestNotification({
        user_id: testUser.id,
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        read: 0 // Unread
      });
    });

    test('should update notification successfully', async () => {
      const updateData = {
        title: 'Updated Notification',
        message: 'Updated message',
        type: 'warning',
        isRead: true
      };

      const req = {
        params: { notificationId: testNotification.id },
        body: updateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify notification was updated in database
      const updatedNotification = await testHelpers.assertRecordExists('notifications', {
        id: testNotification.id,
        title: updateData.title,
        message: updateData.message,
        type: updateData.type,
        read: 1
      });
    });

    test('should mark notification as read successfully', async () => {
      const req = {
        params: { notificationId: testNotification.id },
        body: { isRead: true }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('updated successfully')
        })
      );

      // Verify notification was marked as read
      const updatedNotification = await testHelpers.assertRecordExists('notifications', {
        id: testNotification.id,
        read: 1
      });
    });

    test('should mark notification as unread successfully', async () => {
      // Create read notification
      const readNotification = await testHelpers.createTestNotification({
        user_id: testUser.id,
        title: 'Read Notification',
        message: 'Test message',
        type: 'info',
        read: 1
      });

      const req = {
        params: { notificationId: readNotification.id },
        body: { isRead: false }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify notification was marked as unread
      const updatedNotification = await testHelpers.assertRecordExists('notifications', {
        id: readNotification.id,
        read: 0
      });
    });

    test('should return validation error for invalid notification ID', async () => {
      const req = {
        params: { notificationId: 'invalid' },
        body: { isRead: true }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid notification ID is required')
        })
      );
    });

    test('should return 404 for non-existent notification', async () => {
      const req = {
        params: { notificationId: 99999 },
        body: { isRead: true }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });

    test('should return validation error for invalid type', async () => {
      const req = {
        params: { notificationId: testNotification.id },
        body: { type: 'invalid_type' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid type is required')
        })
      );
    });

    test('should allow partial update', async () => {
      const req = {
        params: { notificationId: testNotification.id },
        body: { isRead: true } // Only updating read status
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    test('should handle empty update body', async () => {
      const req = {
        params: { notificationId: testNotification.id },
        body: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No valid fields to update')
        })
      );
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let testNotification;
    let testUser;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });
      testNotification = await testHelpers.createTestNotification({
        user_id: testUser.id,
        title: 'Test Notification',
        message: 'Test message',
        type: 'info'
      });
    });

    test('should delete notification successfully', async () => {
      const req = {
        params: { notificationId: testNotification.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted successfully')
        })
      );

      // Verify notification was deleted from database
      await testHelpers.assertRecordNotExists('notifications', {
        id: testNotification.id
      });
    });

    test('should return validation error for invalid notification ID', async () => {
      const req = {
        params: { notificationId: 'invalid' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid notification ID is required')
        })
      );
    });

    test('should return 404 for non-existent notification', async () => {
      const req = {
        params: { notificationId: 99999 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('not found')
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    let testUser;
    let testNotifications;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });

      // Create multiple notifications
      testNotifications = await Promise.all([
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Notification 1',
          message: 'Message 1',
          type: 'info',
          read: 0
        }),
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Notification 2',
          message: 'Message 2',
          type: 'warning',
          read: 0
        }),
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Notification 3',
          message: 'Message 3',
          type: 'error',
          read: 0
        })
      ]);
    });

    test('should bulk mark notifications as read', async () => {
      const req = {
        body: {
          notificationIds: testNotifications.map(n => n.id),
          action: 'mark_read'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Bulk update completed')
        })
      );

      // Verify all notifications were marked as read
      for (const notification of testNotifications) {
        const updatedNotification = await testHelpers.assertRecordExists('notifications', {
          id: notification.id,
          read: 1
        });
      }
    });

    test('should bulk mark notifications as unread', async () => {
      // Mark all notifications as read first
      for (const notification of testNotifications) {
        await testDb.execute(
          'UPDATE notifications SET read = 1 WHERE id = ?',
          [notification.id]
        );
      }

      const req = {
        body: {
          notificationIds: testNotifications.map(n => n.id),
          action: 'mark_unread'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify all notifications were marked as unread
      for (const notification of testNotifications) {
        const updatedNotification = await testHelpers.assertRecordExists('notifications', {
          id: notification.id,
          read: 0
        });
      }
    });

    test('should bulk delete notifications', async () => {
      const req = {
        body: {
          notificationIds: testNotifications.map(n => n.id),
          action: 'delete'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Bulk deletion completed')
        })
      );

      // Verify all notifications were deleted
      for (const notification of testNotifications) {
        await testHelpers.assertRecordNotExists('notifications', {
          id: notification.id
        });
      }
    });

    test('should return validation error for invalid bulk action', async () => {
      const req = {
        body: {
          notificationIds: testNotifications.map(n => n.id),
          action: 'invalid_action'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Valid action is required')
        })
      );
    });

    test('should handle empty notification IDs in bulk operation', async () => {
      const req = {
        body: {
          notificationIds: [],
          action: 'mark_read'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Notification IDs are required')
        })
      );
    });

    test('should handle mixed valid/invalid notification IDs in bulk operation', async () => {
      const req = {
        body: {
          notificationIds: [
            ...testNotifications.map(n => n.id),
            99999, // Invalid notification ID
            88888  // Another invalid notification ID
          ],
          action: 'mark_read'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.bulkUpdateNotifications(req, res);

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

  describe('User Notification Operations', () => {
    let testUser;
    let testNotifications;

    beforeEach(async () => {
      testUser = await testHelpers.createTestUser({
        role: 'member'
      });

      // Create notifications for the user
      testNotifications = await Promise.all([
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Unread Notification',
          message: 'This is unread',
          type: 'info',
          read: 0
        }),
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Read Notification',
          message: 'This is read',
          type: 'success',
          read: 1
        }),
        testHelpers.createTestNotification({
          user_id: testUser.id,
          title: 'Warning Notification',
          message: 'This is a warning',
          type: 'warning',
          read: 0
        })
      ]);
    });

    test('should get user notifications', async () => {
      const req = {
        params: { userId: testUser.id },
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notifications: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: expect.any(Number)
            })
          })
        })
      );
    });

    test('should get unread notifications for user', async () => {
      const req = {
        params: { userId: testUser.id },
        query: { isRead: false, page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            notifications: expect.any(Array)
          })
        })
      );

      // Verify only unread notifications are returned
      const response = res.json.mock.calls[0][0];
      response.data.notifications.forEach(notification => {
        expect(notification.read).toBe(0);
      });
    });

    test('should get read notifications for user', async () => {
      const req = {
        params: { userId: testUser.id },
        query: { isRead: true, page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );

      // Verify only read notifications are returned
      const response = res.json.mock.calls[0][0];
      response.data.notifications.forEach(notification => {
        expect(notification.read).toBe(1);
      });
    });

    test('should mark all user notifications as read', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { action: 'mark_all_read' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.markAllUserNotificationsAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('All notifications marked as read')
        })
      );

      // Verify all notifications were marked as read
      const [updatedNotifications] = await testDb.execute(
        'SELECT read FROM notifications WHERE user_id = ?',
        [testUser.id]
      );
      
      updatedNotifications.forEach(notification => {
        expect(notification.read).toBe(1);
      });
    });

    test('should delete all read notifications for user', async () => {
      const req = {
        params: { userId: testUser.id },
        body: { action: 'delete_read' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.deleteReadNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Read notifications deleted')
        })
      );

      // Verify only unread notifications remain
      const [remainingNotifications] = await testDb.execute(
        'SELECT read FROM notifications WHERE user_id = ?',
        [testUser.id]
      );
      
      remainingNotifications.forEach(notification => {
        expect(notification.read).toBe(0);
      });
      expect(remainingNotifications).toHaveLength(2); // Only unread notifications remain
    });

    test('should return 404 for non-existent user', async () => {
      const req = {
        params: { userId: 99999 },
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getUserNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User not found')
        })
      );
    });

    test('should get notification count for user', async () => {
      const req = {
        params: { userId: testUser.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getUserNotificationCount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: expect.any(Number),
            unread: expect.any(Number),
            read: expect.any(Number)
          })
        })
      );
    });
  });

  describe('Notification Statistics', () => {
    let testUsers;

    beforeEach(async () => {
      testUsers = await Promise.all([
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'member' }),
        testHelpers.createTestUser({ role: 'admin' })
      ]);

      // Create notifications for different users and types
      await testHelpers.createTestNotification({
        user_id: testUsers[0].id,
        title: 'Info Notification',
        message: 'Info message',
        type: 'info',
        read: 0
      });
      await testHelpers.createTestNotification({
        user_id: testUsers[0].id,
        title: 'Warning Notification',
        message: 'Warning message',
        type: 'warning',
        read: 1
      });
      await testHelpers.createTestNotification({
        user_id: testUsers[1].id,
        title: 'Error Notification',
        message: 'Error message',
        type: 'error',
        read: 0
      });
    });

    test('should get notification statistics', async () => {
      const req = {
        query: { period: 'daily' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalNotifications: expect.any(Number),
            unreadNotifications: expect.any(Number),
            readNotifications: expect.any(Number),
            infoNotifications: expect.any(Number),
            warningNotifications: expect.any(Number),
            errorNotifications: expect.any(Number),
            successNotifications: expect.any(Number)
          })
        })
      );
    });

    test('should get statistics for specific user', async () => {
      const req = {
        query: { 
          userId: testUsers[0].id,
          period: 'daily'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalNotifications: expect.any(Number),
            unreadNotifications: expect.any(Number),
            readNotifications: expect.any(Number)
          })
        })
      );
    });

    test('should get statistics for specific type', async () => {
      const req = {
        query: { 
          type: 'info',
          period: 'daily'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalNotifications: expect.any(Number),
            unreadNotifications: expect.any(Number),
            readNotifications: expect.any(Number)
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

      await notificationsController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Failed to fetch notifications')
        })
      );

      // Restore original database method
      testDb.execute = originalExecute;
    });

    test('should handle null database connection', async () => {
      const controller = new NotificationsController(null);
      const req = {
        query: { page: 1, limit: 10 }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await expect(controller.getNotifications(req, res))
        .rejects.toThrow();
    });

    test('should handle malformed query parameters', async () => {
      const req = {
        query: {
          page: 'invalid_page',
          limit: 'invalid_limit',
          type: 123 // Invalid type type
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotifications(req, res);

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

      const testNotification = testData.notifications[0];
      const req = {
        params: { notificationId: testNotification.id }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Check that user data is decrypted
      const response = res.json.mock.calls[0][0];
      expect(response.data.user_name).not.toMatch(/^[A-Za-z0-9+/=]+$/); // Not base64 encrypted
      expect(typeof response.data.user_name).toBe('string');
      expect(response.data.user_name.length).toBeGreaterThan(0);
    });

    test('should validate notification ownership', async () => {
      const user1 = await testHelpers.createTestUser({ role: 'member' });
      const user2 = await testHelpers.createTestUser({ role: 'member' });

      // Create notification for user1
      const notification = await testHelpers.createTestNotification({
        user_id: user1.id,
        title: 'User1 Notification',
        message: 'Message for user1',
        type: 'info'
      });

      // Try to update notification with user2's ID
      const req = {
        params: { notificationId: notification.id },
        body: { userId: user2.id, title: 'Updated' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      await notificationsController.updateNotification(req, res);

      // Should not allow changing user_id
      const [updatedNotification] = await testDb.execute(
        'SELECT user_id FROM notifications WHERE id = ?',
        [notification.id]
      );
      
      expect(updatedNotification[0].user_id).toBe(user1.id);
    });

    test('should handle concurrent notification creation', async () => {
      const testUser = await testHelpers.createTestUser({ role: 'member' });

      const notificationData = {
        userId: testUser.id,
        title: 'Concurrent Test Notification',
        message: 'Test message',
        type: 'info'
      };

      const req1 = { body: notificationData };
      const req2 = { body: notificationData };
      const res1 = { json: jest.fn(), status: jest.fn(() => res1) };
      const res2 = { json: jest.fn(), status: jest.fn(() => res2) };

      // Both requests should succeed (no unique constraint on notifications)
      await notificationsController.createNotification(req1, res1);
      await notificationsController.createNotification(req2, res2);

      expect(res1.status).toHaveBeenCalledWith(201);
      expect(res2.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Performance Testing', () => {
    test('should handle large notification lists efficiently', async () => {
      const testUser = await testHelpers.createTestUser({ role: 'member' });

      // Create many notifications
      const notifications = [];
      for (let i = 0; i < 100; i++) {
        const notification = await testHelpers.createTestNotification({
          user_id: testUser.id,
          title: `Notification ${i}`,
          message: `This is notification number ${i}`,
          type: ['info', 'warning', 'error', 'success'][i % 4],
          read: i % 2 // Alternate between read and unread
        });
        notifications.push(notification);
      }

      const req = {
        query: { 
          userId: testUser.id,
          page: 1,
          limit: 20
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      const startTime = Date.now();
      await notificationsController.getNotifications(req, res);
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
          type: 'info',
          isRead: false,
          search: 'notification',
          includeStats: 'true'
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      const startTime = Date.now();
      await notificationsController.getNotifications(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
