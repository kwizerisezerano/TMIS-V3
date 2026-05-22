 /**
 * Notifications Controller
 * Handles all notification-related business logic with consistent QueryHelpers usage
 */

const { 
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  QueryHelpers,
  getCurrentUTCDate
} = require('../utils/common');
const ResponseHelpers = require('../utils/responseHelpers');
const DatabaseHelpers = require('../utils/databaseHelpers');

class NotificationsController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  // Consolidated notifications endpoint with QueryHelpers
  async getNotifications(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        read, 
        userId,
        notificationId,
        includeStats = false 
      } = req.query;

      // If specific notificationId requested, return single notification
      if (notificationId) {
        return this.getNotificationById(req, res);
      }

      // Build where clause using QueryHelpers
      const filterConfig = QueryHelpers.getFilterConfig('notifications');
      const { whereClause, params } = QueryHelpers.buildWhereClause({
        type,
        isRead: read,
        userId
      }, {
        tablePrefix: '',
        searchFields: filterConfig.searchFields
      });

      // Build pagination using QueryHelpers
      const pagination = QueryHelpers.buildPagination(req.query, { defaultLimit: 20, maxLimit: 100 });

      // Get paginated results - use DISTINCT to avoid duplicates and order by created_at DESC
      const offset = (pagination.page - 1) * pagination.limit;
      const query = `
        SELECT DISTINCT n.* 
        FROM notifications n 
        ${whereClause}
        ORDER BY n.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const [data] = await this.db.execute(query, [...params, pagination.limit, offset]);

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT id) as total FROM notifications ${whereClause}`;
      const [countResult] = await this.db.execute(countQuery, params);
      const total = countResult[0].total;

      const result = {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      };

      // Include statistics if requested
      if (includeStats === 'true') {
        const [stats] = await this.db.execute(`
          SELECT 
            COUNT(*) as total_notifications,
            SUM(CASE WHEN \`read\` = 1 THEN 1 ELSE 0 END) as read_notifications,
            COUNT(*) - SUM(CASE WHEN \`read\` = 1 THEN 1 ELSE 0 END) as unread_notifications
          FROM notifications 
          ${whereClause}
        `, params);
        
        result.data = {
          notifications: result.data,
          stats: stats[0] || { total_notifications: 0, read_notifications: 0, unread_notifications: 0 }
        };
      }

      // Build complete pagination response
      const paginationResponse = QueryHelpers.buildPaginationResponse(
        result.pagination.total, 
        pagination
      );

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, paginationResponse));

    } catch (error) {
      console.error('Error fetching notifications:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch notifications');
    }
  }

  // Get notification by ID (used by consolidated endpoint)
  async getNotificationById(req, res) {
    try {
      const { notificationId } = req.params;

      // Validate notificationId
      if (!notificationId || isNaN(notificationId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid notification ID is required');
      }

      // Check if notification exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'notifications', 'id', notificationId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Notification not found');
      }

      // Get notification details
      const notification = await this.db.getById('notifications', notificationId);
      
      if (!notification) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Notification not found');
      }

      return ResponseHelpers.sendSuccessResponse(res, notification);

    } catch (error) {
      console.error('Error fetching notification:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch notification');
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      // Validate notificationId
      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid notification ID is required'));
      }

      // Update notification
      const [result] = await this.db.execute(
        'UPDATE notifications SET `read` = 1 WHERE id = ?',
        [notificationId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Notification not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Notification marked as read'));

    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to mark notification as read'));
    }
  }

  // Mark all notifications as read for user (by userId param)
  async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Update all user notifications
      const [result] = await this.db.execute(
        'UPDATE notifications SET `read` = 1 WHERE user_id = ? AND `read` = 0',
        [userId]
      );

      return res.json(SUCCESS_RESPONSES.ok({
        markedCount: result.affectedRows
      }, 'All notifications marked as read'));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to mark notifications as read'));
    }
  }

  // Mark all notifications as read for current authenticated user
  async markMyNotificationsAsRead(req, res) {
    try {
      // Get userId from authenticated user (JWT payload contains userId)
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json(ERROR_RESPONSES.validation('User must be authenticated'));
      }

      // Update all user notifications
      const [result] = await this.db.execute(
        'UPDATE notifications SET `read` = 1 WHERE user_id = ? AND `read` = 0',
        [userId]
      );

      return res.json(SUCCESS_RESPONSES.ok({
        markedCount: result.affectedRows
      }, 'All notifications marked as read'));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to mark notifications as read'));
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      // Validate notificationId
      if (!notificationId || isNaN(notificationId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid notification ID is required'));
      }

      // Delete notification
      const [result] = await this.db.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Notification not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Notification deleted successfully'));

    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete notification'));
    }
  }

  // Create notification (admin)
  async createNotification(req, res) {
    try {
      const { userId, title, message, type } = req.body;

      // Validate required fields
      if (!userId || !title || !message) {
        return res.status(400).json(ERROR_RESPONSES.validation('User ID, title, and message are required'));
      }

      // Validate userId
      if (isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Validate type
      const validTypes = ['info', 'success', 'warning', 'error', 'contribution', 'loan', 'penalty', 'payment'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json(ERROR_RESPONSES.validation(`Invalid type. Must be one of: ${validTypes.join(', ')}`));
      }

      // Create notification
      const [result] = await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [userId, title, message, type || 'info', getCurrentUTCDate()]);

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { notificationId: result.insertId },
        'Notification created successfully'
      ));

    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to create notification'));
    }
  }

  // Broadcast notification to multiple users (admin)
  async broadcastNotification(req, res) {
    try {
      const { userIds, title, message, type } = req.body;

      // Validate required fields
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message) {
        return res.status(400).json(ERROR_RESPONSES.validation('User IDs array, title, and message are required'));
      }

      // Validate type
      const validTypes = ['info', 'success', 'warning', 'error', 'announcement'];
      if (type && !validTypes.includes(type)) {
        return res.status(400).json(ERROR_RESPONSES.validation(`Invalid type. Must be one of: ${validTypes.join(', ')}`));
      }

      // Create notifications for all users
      let createdCount = 0;
      for (const userId of userIds) {
        if (isNaN(userId)) continue;
        
        try {
          await this.db.execute(`
            INSERT INTO notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, ?, ?)
          `, [userId, title, message, type || 'info', getCurrentUTCDate()]);
          createdCount++;
        } catch (error) {
          console.error(`Failed to create notification for user ${userId}:`, error);
        }
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { createdCount, totalUsers: userIds.length },
        `Notification broadcasted to ${createdCount} users`
      ));

    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to broadcast notification'));
    }
  }

  // Get notification statistics (admin)
  async getNotificationStats(req, res) {
    try {
      const { userId, period } = req.query;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }

      if (period) {
        switch (period) {
          case 'today':
            whereClause += ' AND DATE(created_at) = CURDATE()';
            break;
          case 'week':
            whereClause += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
          case 'month':
            whereClause += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
        }
      }

      // Get notification statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_notifications,
          SUM(CASE WHEN \`read\` = 0 THEN 1 ELSE 0 END) as unread_count,
          SUM(CASE WHEN \`read\` = 1 THEN 1 ELSE 0 END) as read_count,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN type = 'info' THEN 1 END) as info_count,
          COUNT(CASE WHEN type = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning_count,
          COUNT(CASE WHEN type = 'error' THEN 1 END) as error_count
        FROM notifications 
        ${whereClause}
      `, params);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || {
        total_notifications: 0,
        unread_count: 0,
        read_count: 0,
        unique_users: 0,
        info_count: 0,
        success_count: 0,
        warning_count: 0,
        error_count: 0
      }));

    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch notification statistics'));
    }
  }
}

module.exports = NotificationsController;
