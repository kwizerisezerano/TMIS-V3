/**
 * Activity Log Controller
 * Handles activity log retrieval and management
 */

const { 
  ERROR_RESPONSES,
  SUCCESS_RESPONSES
} = require('../utils/common');

class ActivityLogController {
  constructor(db) {
    this.db = db;
  }

  // Get activity logs with pagination and filters
  async getActivityLogs(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        actionType,
        entityType,
        userId,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (actionType) {
        whereClause += ' AND action_type = ?';
        params.push(actionType);
      }

      if (entityType) {
        whereClause += ' AND entity_type = ?';
        params.push(entityType);
      }

      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }

      if (startDate) {
        whereClause += ' AND DATE(created_at) >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND DATE(created_at) <= ?';
        params.push(endDate);
      }

      // Get paginated activity logs
      const query = `
        SELECT al.*, u.names as user_name 
        FROM activity_log al 
        LEFT JOIN users u ON al.user_id = u.id 
        ${whereClause}
        ORDER BY al.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const [data] = await this.db.execute(query, [...params, parseInt(limit), offset]);

      // Decrypt user names
      const { decryptUserData } = require('../utils/encryption');
      const decryptedLogs = data.map(log => {
        if (log.user_name) {
          try {
            const decryptedUser = decryptUserData({ names: log.user_name });
            return {
              ...log,
              user_name: decryptedUser.names
            };
          } catch (error) {
            return log;
          }
        }
        return log;
      });

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM activity_log al ${whereClause}`;
      const [countResult] = await this.db.execute(countQuery, params);
      const total = countResult[0].total;

      return res.json(SUCCESS_RESPONSES.ok({
        logs: decryptedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch activity logs'));
    }
  }

  // Get single activity log by ID
  async getActivityLogById(req, res) {
    try {
      const { logId } = req.params;

      if (!logId || isNaN(logId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid log ID is required'));
      }

      const [logs] = await this.db.execute(`
        SELECT al.*, u.names as user_name 
        FROM activity_log al 
        LEFT JOIN users u ON al.user_id = u.id 
        WHERE al.id = ?
      `, [logId]);

      if (logs.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Activity log not found'));
      }

      // Decrypt user name
      let log = logs[0];
      if (log.user_name) {
        try {
          const { decryptUserData } = require('../utils/encryption');
          const decryptedUser = decryptUserData({ names: log.user_name });
          log = {
            ...log,
            user_name: decryptedUser.names
          };
        } catch (error) {
          // Use original if decryption fails
        }
      }

      return res.json(SUCCESS_RESPONSES.ok(log));

    } catch (error) {
      console.error('Error fetching activity log:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch activity log'));
    }
  }
}

module.exports = ActivityLogController;
