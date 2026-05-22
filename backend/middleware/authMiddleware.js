/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { ERROR_RESPONSES } = require('../utils/common');

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

const adminMiddleware = async (req, res, next) => {
  try {
    // First run auth middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Check if user is admin or president only (accountant cannot use adminMiddleware)
    const db = req.app.get('db');
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ? AND role IN (?, ?)',
      [req.user.userId, 'admin', 'president']
    );

    if (users.length === 0) {
      return res.status(403).json(ERROR_RESPONSES.forbidden('Admin privileges required'));
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json(ERROR_RESPONSES.server());
  }
};

const meetingMiddleware = async (req, res, next) => {
  try {
    // First run auth middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Check if user is admin or president only (for meeting scheduling)
    const db = req.app.get('db');
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ? AND role IN (?, ?)',
      [req.user.userId, 'admin', 'president']
    );

    if (users.length === 0) {
      return res.status(403).json(ERROR_RESPONSES.forbidden('Only admins and presidents can schedule meetings'));
    }

    next();
  } catch (error) {
    console.error('Meeting middleware error:', error);
    return res.status(500).json(ERROR_RESPONSES.server());
  }
};

const recordingMiddleware = async (req, res, next) => {
  try {
    // First run auth middleware
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Check if user is ONLY accountant (for recording contributions/loans/penalties)
    const db = req.app.get('db');
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ? AND role = ?',
      [req.user.userId, 'accountant']
    );

    if (users.length === 0) {
      return res.status(403).json(ERROR_RESPONSES.forbidden('Only accountants can record payments/contributions'));
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
