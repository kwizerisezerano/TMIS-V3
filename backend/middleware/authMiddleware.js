/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { ACCESS_RULES, ERROR_RESPONSES } = require('../utils/common');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(ERROR_RESPONSES.unauthorized());
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Add user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(ERROR_RESPONSES.unauthorized('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json(ERROR_RESPONSES.unauthorized('Token expired'));
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }
};

const runAuthMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    authMiddleware(req, res, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
};

const authorizeByRoles = async (req, allowedRoles, forbiddenMessage) => {
  const db = req.app.get('db');
  const placeholders = allowedRoles.map(() => '?').join(', ');
  const [users] = await db.execute(
    `SELECT role FROM users WHERE id = ? AND role IN (${placeholders})`,
    [req.user.userId, ...allowedRoles]
  );

  if (users.length === 0) {
    return ERROR_RESPONSES.forbidden(forbiddenMessage);
  }

  return null;
};

const adminMiddleware = async (req, res, next) => {
  try {
    await runAuthMiddleware(req, res);

    const errorResponse = await authorizeByRoles(
      req,
      ACCESS_RULES.EXECUTIVE_ACTIONS,
      'Admin privileges required'
    );

    if (errorResponse) {
      return res.status(403).json(errorResponse);
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json(ERROR_RESPONSES.server());
  }
};

const meetingMiddleware = async (req, res, next) => {
  try {
    await runAuthMiddleware(req, res);

    const errorResponse = await authorizeByRoles(
      req,
      ACCESS_RULES.MEETING_MANAGEMENT,
      'Only admins and presidents can schedule meetings'
    );

    if (errorResponse) {
      return res.status(403).json(errorResponse);
    }

    next();
  } catch (error) {
    console.error('Meeting middleware error:', error);
    return res.status(500).json(ERROR_RESPONSES.server());
  }
};

const recordingMiddleware = async (req, res, next) => {
  try {
    await runAuthMiddleware(req, res);

    const errorResponse = await authorizeByRoles(
      req,
      ACCESS_RULES.TRANSACTION_RECORDING,
      'Only accountants can record payments/contributions'
    );

    if (errorResponse) {
      return res.status(403).json(errorResponse);
    }

    next();
  } catch (error) {
    console.error('Recording middleware error:', error);
    return res.status(500).json(ERROR_RESPONSES.server());
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  meetingMiddleware,
  recordingMiddleware
};
