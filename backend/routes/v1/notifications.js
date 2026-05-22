/**
 * Notifications Routes v1
 * Consistent endpoint patterns with consolidated functionality
 */

const express = require('express');
const NotificationsController = require('../../controllers/notificationsController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initNotificationsRoutes = (db) => {
  const notificationsController = new NotificationsController(db);

  // Notifications endpoints
  router.get('/', authMiddleware, notificationsController.getNotifications.bind(notificationsController));
  router.get('/:notificationId', authMiddleware, notificationsController.getNotificationById.bind(notificationsController));
  router.post('/', adminMiddleware, notificationsController.createNotification.bind(notificationsController));
  router.put('/:notificationId/read', authMiddleware, notificationsController.markAsRead.bind(notificationsController));
  router.put('/user/:userId/read-all', authMiddleware, notificationsController.markAllAsRead.bind(notificationsController));
  router.post('/mark-all-read', authMiddleware, notificationsController.markMyNotificationsAsRead.bind(notificationsController));
  router.delete('/:notificationId', authMiddleware, notificationsController.deleteNotification.bind(notificationsController));

  // Action endpoints
  router.post('/broadcast', adminMiddleware, notificationsController.broadcastNotification.bind(notificationsController));

  return router;
};

module.exports = initNotificationsRoutes;
