/**
 * Authentication Routes v1
 * Clean route definitions separated from business logic
 */

const express = require('express');
const AuthController = require('../../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../../middleware/authMiddleware');

const router = express.Router();

// Initialize controller with database dependency
const initAuthRoutes = (db) => {
  const authController = new AuthController(db);

  // Public routes
  router.post('/register', authController.register.bind(authController));
  router.post('/login', authController.login.bind(authController));
  router.post('/forgot-password', authController.forgotPassword.bind(authController));
  router.post('/verify-reset-code', authController.verifyResetCode.bind(authController));
  router.post('/reset-password', authController.resetPassword.bind(authController));

  // Protected routes
  router.get('/admins', authController.getAdminUsers.bind(authController));
  router.get('/users', adminMiddleware, authController.getAllUsers.bind(authController));
  
  // Admin registration (requires admin middleware)
  router.post('/admin/register', adminMiddleware, authController.adminRegister.bind(authController));

  return router;
};

module.exports = initAuthRoutes;
