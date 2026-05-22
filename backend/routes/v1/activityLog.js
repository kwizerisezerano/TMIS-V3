/**
 * Activity Log Routes v1
 */

const express = require('express');
const ActivityLogController = require('../../controllers/activityLogController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

const initActivityLogRoutes = (db) => {
  const activityLogController = new ActivityLogController(db);

  // Activity log endpoints - admin only
  router.get('/', authMiddleware, adminMiddleware, activityLogController.getActivityLogs.bind(activityLogController));
  router.get('/:logId', authMiddleware, adminMiddleware, activityLogController.getActivityLogById.bind(activityLogController));

  return router;
};

module.exports = initActivityLogRoutes;
