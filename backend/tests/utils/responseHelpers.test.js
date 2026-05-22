/**
 * ResponseHelpers Tests
 * Comprehensive testing for ResponseHelpers utility functions
 */

const ResponseHelpers = require('../../utils/responseHelpers');

describe('ResponseHelpers', () => {

  describe('sendSuccessResponse', () => {
    test('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendSuccessResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Operation completed successfully'
      });
    });

    test('should send success response with custom message', () => {
      const data = { id: 1 };
      const message = 'Custom success message';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendSuccessResponse(res, data, message);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message
      });
    });

    test('should send success response with no data', () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendSuccessResponse(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Operation completed successfully'
      });
    });
  });

  describe('sendValidationResponse', () => {
    test('should send validation error response', () => {
      const message = 'Validation failed';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendValidationResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'validation'
      });
    });

    test('should send validation response with errors array', () => {
      const errors = ['Field 1 is required', 'Field 2 is invalid'];
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendValidationResponse(res, 'Validation failed', errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors,
        error: 'validation'
      });
    });
  });

  describe('sendNotFoundResponse', () => {
    test('should send not found response', () => {
      const message = 'Resource not found';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendNotFoundResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'not_found'
      });
    });

    test('should send not found response with default message', () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendNotFoundResponse(res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        error: 'not_found'
      });
    });
  });

  describe('sendUnauthorizedResponse', () => {
    test('should send unauthorized response', () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendUnauthorizedResponse(res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid or missing authentication token.',
        error: 'unauthorized'
      });
    });

    test('should send unauthorized response with custom message', () => {
      const message = 'Custom unauthorized message';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendUnauthorizedResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'unauthorized'
      });
    });
  });

  describe('sendForbiddenResponse', () => {
    test('should send forbidden response', () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendForbiddenResponse(res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access forbidden. You do not have permission to perform this action.',
        error: 'forbidden'
      });
    });

    test('should send forbidden response with custom message', () => {
      const message = 'Custom forbidden message';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendForbiddenResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
        error: 'forbidden'
      });
    });
  });

  describe('sendServerErrorResponse', () => {
    test('should send server error response', () => {
      const message = 'Internal server error';
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendServerErrorResponse(res, message);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: message || 'Internal server error occurred',
        error: 'server_error'
      });
    });

    test('should send server error response with default message', () => {
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.sendServerErrorResponse(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error occurred',
        error: 'server_error'
      });
    });
  });

  describe('send', () => {
    test('should send response with custom status code', () => {
      const responseData = { custom: 'data' };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.send(res, responseData, 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(responseData);
    });

    test('should send response with default 200 status', () => {
      const responseData = { custom: 'data' };
      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      ResponseHelpers.send(res, responseData);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(responseData);
    });
  });

  describe('paginated', () => {
    test('should create paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
        hasNext: false,
        hasPrev: false
      };

      const result = ResponseHelpers.paginated(data, pagination);

      expect(result).toEqual({
        success: true,
        data,
        pagination
      });
    });

    test('should create paginated response with success flag', () => {
      const data = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      };

      const result = ResponseHelpers.paginated(data, pagination);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual(pagination);
    });
  });

  describe('created', () => {
    test('should create created response', () => {
      const data = { id: 1, created: true };
      const message = 'Resource created successfully';

      const result = ResponseHelpers.created(data, message);

      expect(result).toEqual({
        success: true,
        data,
        message
      });
    });

    test('should create created response with default message', () => {
      const data = { id: 1 };

      const result = ResponseHelpers.created(data);

      expect(result).toEqual({
        success: true,
        data,
        message: 'Resource created successfully'
      });
    });
  });

  describe('updated', () => {
    test('should create updated response', () => {
      const data = { id: 1, updated: true };
      const message = 'Resource updated successfully';

      const result = ResponseHelpers.updated(data, message);

      expect(result).toEqual({
        success: true,
        data,
        message
      });
    });

    test('should create updated response with default message', () => {
      const data = { id: 1 };

      const result = ResponseHelpers.updated(data);

      expect(result).toEqual({
        success: true,
        data,
        message: 'Resource updated successfully'
      });
    });
  });

  describe('deleted', () => {
    test('should create deleted response', () => {
      const message = 'Resource deleted successfully';

      const result = ResponseHelpers.deleted(message);

      expect(result).toEqual({
        success: true,
        data: null,
        message
      });
    });

    test('should create deleted response with default message', () => {
      const result = ResponseHelpers.deleted();

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Resource deleted successfully'
      });
    });
  });

  describe('error', () => {
    test('should create error response', () => {
      const message = 'Custom error message';
      const statusCode = 400;
      const errorType = 'custom_error';

      const result = ResponseHelpers.error(message, statusCode, errorType);

      expect(result).toEqual({
        success: false,
        message,
        error: errorType
      });
    });

    test('should create error response with default values', () => {
      const result = ResponseHelpers.error();

      expect(result).toEqual({
        success: false,
        message: 'An error occurred',
        error: 'error'
      });
    });
  });

  describe('formatError', () => {
    test('should format error message', () => {
      const error = new Error('Test error');
      const result = ResponseHelpers.formatError(error);

      expect(result).toBe('Test error');
    });

    test('should handle error without message', () => {
      const error = new Error();
      const result = ResponseHelpers.formatError(error);

      expect(result).toBe('Unknown error occurred');
    });

    test('should handle non-error object', () => {
      const error = 'String error';
      const result = ResponseHelpers.formatError(error);

      expect(result).toBe('String error');
    });

    test('should handle null/undefined error', () => {
      const result1 = ResponseHelpers.formatError(null);
      const result2 = ResponseHelpers.formatError(undefined);

      expect(result1).toBe('Unknown error occurred');
      expect(result2).toBe('Unknown error occurred');
    });
  });

  describe('validateResponse', () => {
    test('should validate response object', () => {
      const response = {
        success: true,
        data: { id: 1 },
        message: 'Success'
      };

      const result = ResponseHelpers.validateResponse(response);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing success field', () => {
      const response = {
        data: { id: 1 },
        message: 'Success'
      };

      const result = ResponseHelpers.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing success field');
    });

    test('should detect invalid success type', () => {
      const response = {
        success: 'true', // String instead of boolean
        data: { id: 1 }
      };

      const result = ResponseHelpers.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Success field must be boolean');
    });

    test('should detect missing data field', () => {
      const response = {
        success: true,
        message: 'Success'
      };

      const result = ResponseHelpers.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing data field');
    });

    test('should detect missing message field', () => {
      const response = {
        success: true,
        data: { id: 1 }
      };

      const result = ResponseHelpers.validateResponse(response);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing message field');
    });

    test('should validate error response', () => {
      const response = {
        success: false,
        message: 'Error occurred',
        error: 'validation'
      };

      const result = ResponseHelpers.validateResponse(response, { isError: true });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect missing error field in error response', () => {
      const response = {
        success: false,
        message: 'Error occurred'
      };

      const result = ResponseHelpers.validateResponse(response, { isError: true });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing error field');
    });
  });

  describe('Response Consistency', () => {
    test('should maintain consistent response structure', () => {
      const successResponse = ResponseHelpers.sendSuccessResponse({ id: 1 });
      const errorResponse = ResponseHelpers.sendValidationResponse('Error');
      const notFoundResponse = ResponseHelpers.sendNotFoundResponse('Not found');

      // All responses should have success field
      expect(successResponse.success).toBe(true);
      expect(errorResponse.success).toBe(false);
      expect(notFoundResponse.success).toBe(false);

      // All responses should have message field
      expect(successResponse.message).toBeDefined();
      expect(errorResponse.message).toBeDefined();
      expect(notFoundResponse.message).toBeDefined();
    });

    test('should maintain consistent error structure', () => {
      const validationError = ResponseHelpers.sendValidationResponse('Validation error');
      const notFoundError = ResponseHelpers.sendNotFoundResponse('Not found');
      const serverError = ResponseHelpers.sendServerErrorResponse('Server error');

      // All error responses should have error field
      expect(validationError.error).toBe('validation');
      expect(notFoundError.error).toBe('not_found');
      expect(serverError.error).toBe('server_error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null response object', () => {
      expect(() => {
        ResponseHelpers.sendSuccessResponse(null, { id: 1 });
      }).toThrow();
    });

    test('should handle undefined response object', () => {
      expect(() => {
        ResponseHelpers.sendSuccessResponse(undefined, { id: 1 });
      }).toThrow();
    });

    test('should handle circular data references', () => {
      const data = { id: 1 };
      data.self = data; // Circular reference

      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      expect(() => {
        ResponseHelpers.sendSuccessResponse(res, data);
      }).not.toThrow();
    });

    test('should handle very large data objects', () => {
      const largeData = {
        items: Array(1000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` }))
      };

      const res = {
        json: jest.fn(),
        status: jest.fn(() => res)
      };

      expect(() => {
        ResponseHelpers.sendSuccessResponse(res, largeData);
      }).not.toThrow();
    });
  });
});
