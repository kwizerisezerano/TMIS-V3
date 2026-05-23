/**
 * Activity Log Middleware
 * Automatically logs all POST/PUT/DELETE requests
 */

const { logActivity } = require('../utils/common');

const getTrueUserAgent = (req) => {
  const forwardedAgent = req.get('X-Client-User-Agent') || req.get('X-Original-User-Agent');
  return forwardedAgent || req.get('User-Agent') || 'Unknown User Agent';
};

const activityLogMiddleware = async (req, res, next) => {
  // Only log non-GET requests
  if (req.method === 'GET') {
    return next();
  }

  // Listen for the finish event to log after the response is sent
  res.on('finish', async () => {
    try {
      // Use originalUrl to get full path including /api/v1/
      const fullPath = req.originalUrl.split('?')[0];
      
      const pathParts = fullPath.split('/').filter(Boolean);
      
      console.log('=== ACTIVITY LOG MIDDLEWARE DEBUG ===');
      console.log('fullPath:', fullPath);
      console.log('req.originalUrl:', req.originalUrl);
      console.log('req.method:', req.method);
      console.log('pathParts:', pathParts);
      
      // Extract entity info
      let entityType = 'unknown';
      let entityId = null;
      
      // Path structure: /api/v1/[entity]/...
      if (pathParts.length >= 3) {
        entityType = pathParts[2];
        console.log('Entity type:', entityType);
        
        // Look for entity ID
        for (let i = 3; i < pathParts.length; i++) {
          if (!isNaN(pathParts[i])) {
            entityId = parseInt(pathParts[i]);
            console.log('Entity ID:', entityId);
            break;
          }
        }
      }
      
      // Action description
      let actionDescription = `${req.method} ${req.path}`;
      
      if (req.method === 'POST') {
        if (pathParts.includes('bulk') || pathParts.includes('record')) {
          actionDescription = `Recorded bulk ${entityType}`;
        } else {
          actionDescription = `Created new ${entityType}`;
        }
      } else if (req.method === 'PUT' && entityId) {
        actionDescription = `Updated ${entityType} (ID: ${entityId})`;
      } else if (req.method === 'DELETE' && entityId) {
        actionDescription = `Deleted ${entityType} (ID: ${entityId})`;
      }
      
      console.log('Final values to log:', {
        entityType,
        entityId,
        actionDescription,
        userId: req.user?.userId,
        statusCode: res.statusCode
      });
      
      // Log activity
      await logActivity(req.db, {
        userId: req.user?.userId,
        actionType: req.method,
        entityType,
        entityId,
        actionDescription,
        status: res.statusCode >= 400 ? 'failure' : 'success',
        responseStatusCode: res.statusCode,
        oldData: null,
        newData: req.body,
        ipAddress: req.ip,
        userAgent: getTrueUserAgent(req)
      });
      
    } catch (error) {
      console.error('❌ Error in activity log middleware:', error);
    }
  });
  
  next();
};

module.exports = activityLogMiddleware;
