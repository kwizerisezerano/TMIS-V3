/**
 * Authentication Middleware Tests
 * Comprehensive testing for authentication middleware
 */

const authMiddleware = require('../../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const TestHelpers = require('../utils/testHelpers');

describe('Auth Middleware', () => {
  let testHelpers;

  beforeAll(() => {
    const app = require('../../server');
    testHelpers = new TestHelpers(app, null);
  });

  describe('Token Validation', () => {
    test('should pass with valid JWT token', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        role: 'member'
      };
      
      const token = testHelpers.generateTestToken(testUser);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to return decoded token
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockReturnValue(testUser);

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(testUser);

      // Restore original method
      jwt.verify = originalVerify;
    });

    test('should fail with missing authorization header', async () => {
      const req = {
        headers: {}
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied')
        })
      );
    });

    test('should fail with invalid authorization header format', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token123'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Access denied')
        })
      );
    });

    test('should fail with expired token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer expiredtoken123'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to throw expired error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Token expired')
        })
      );

      // Restore original method
      jwt.verify = originalVerify;
    });

    test('should fail with invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalidtoken123'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to throw invalid token error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid token')
        })
      );

      // Restore original method
      jwt.verify = originalVerify;
    });
  });

  describe('User Context', () => {
    test('should attach user to request object', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        role: 'member'
      };
      
      const token = testHelpers.generateTestToken(testUser);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to return decoded token
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockReturnValue(testUser);

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(testUser.id);
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.role).toBe(testUser.role);

      // Restore original method
      jwt.verify = originalVerify;
    });

    test('should handle malformed user data in token', async () => {
      const malformedUser = {
        // Missing required fields
        email: 'test@example.com'
      };
      
      const token = testHelpers.generateTestToken(malformedUser);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to return malformed user
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockReturnValue(malformedUser);

      authMiddleware(req, res, next);

      // Should still pass but with limited user data
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(malformedUser);

      // Restore original method
      jwt.verify = originalVerify;
    });
  });

  describe('Error Handling', () => {
    test('should handle JWT verification errors gracefully', async () => {
      const req = {
        headers: {
          authorization: 'Bearer token123'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to throw unexpected error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Server error')
        })
      );

      // Restore original method
      jwt.verify = originalVerify;
    });

    test('should handle missing token gracefully', async () => {
      const req = {
        headers: {
          authorization: 'Bearer '
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).notToHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Security', () => {
    test('should not expose sensitive token information', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalidtoken123'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to throw error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authMiddleware(req, res, next);

      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          secret: expect.any(String)
        })
      );

      // Restore original method
      jwt.verify = originalVerify;
    });

    test('should validate token structure', async () => {
      const req = {
        headers: {
          authorization: 'Bearer not.a.valid.jwt'
        }
      };
      const res = testHelpers.createMockRes();
      const next = jest.fn();

      // Mock jwt.verify to return null/undefined
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockReturnValue(null);

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);

      // Restore original method
      jwt.verify = originalVerify;
    });
  });
});
