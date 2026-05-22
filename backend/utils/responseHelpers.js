/**
 * Response Helper Functions
 * Standardized response patterns to eliminate duplication
 */

// Define responses directly to avoid circular dependency
const ERROR_RESPONSES = {
  validation: (message) => ({ status: 400, success: false, error: 'validation', message }),
  unauthorized: (message = 'Authentication required') => ({ status: 401, success: false, error: 'unauthorized', message }),
  forbidden: (message = 'Access denied') => ({ status: 403, success: false, error: 'forbidden', message }),
  notFound: (message = 'Resource not found') => ({ status: 404, success: false, error: 'not_found', message }),
  server: (message = 'Internal server error') => ({ status: 500, success: false, error: 'server_error', message })
};

const SUCCESS_RESPONSES = {
  created: (data, message = 'Created successfully') => ({ status: 201, success: true, message, data }),
  ok: (data, message = 'Operation successful') => ({ status: 200, success: true, message, data })
};

class ResponseHelpers {
  // Standard success response
  static success(data = null, message = 'Operation successful', status = 200) {
    return {
      status,
      success: true,
      message,
      data
    };
  }

  // Standard error response
  static error(message = 'Operation failed', status = 400) {
    return {
      status,
      success: false,
      message
    };
  }

  // Paginated response
  static paginated(data, pagination, message = 'Data retrieved successfully') {
    return {
      status: 200,
      success: true,
      message,
      data,
      pagination
    };
  }

  // Created response
  static created(data = null, message = 'Resource created successfully') {
    return {
      status: 201,
      success: true,
      message,
      data
    };
  }

  // Not found response
  static notFound(message = 'Resource not found') {
    return {
      status: 404,
      success: false,
      message
    };
  }

  // Unauthorized response
  static unauthorized(message = 'Unauthorized access') {
    return {
      status: 401,
      success: false,
      message
    };
  }

  // Forbidden response
  static forbidden(message = 'Access forbidden') {
    return {
      status: 403,
      success: false,
      message
    };
  }

  // Validation error response
  static validation(message = 'Validation failed') {
    return {
      status: 400,
      success: false,
      message
    };
  }

  // Server error response
  static serverError(message = 'Internal server error') {
    return {
      status: 500,
      success: false,
      message
    };
  }

  // Send response helper
  static send(res, response) {
    return res.status(response.status).json(response);
  }

  // Common response patterns
  static sendSuccess(res, data = null, message = 'Operation successful') {
    return res.status(200).json(this.success(data, message));
  }

  static sendCreated(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json(this.created(data, message));
  }

  static sendNotFound(res, message = 'Resource not found') {
    return res.status(404).json(this.notFound(message));
  }

  static sendValidationError(res, message = 'Validation failed') {
    return res.status(400).json(this.validation(message));
  }

  static sendUnauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json(this.unauthorized(message));
  }

  static sendForbidden(res, message = 'Access forbidden') {
    return res.status(403).json(this.forbidden(message));
  }

  static sendServerError(res, message = 'Internal server error') {
    return res.status(500).json(this.serverError(message));
  }

  // Using existing common utilities
  static sendError(res, errorResponse) {
    return res.status(errorResponse.status).json(errorResponse);
  }

  static sendSuccessResponse(res, data = null, message = 'Operation successful') {
    return res.status(200).json(SUCCESS_RESPONSES.ok(data, message));
  }

  static sendCreatedResponse(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json(SUCCESS_RESPONSES.created(data, message));
  }

  static sendNotFoundResponse(res, message = 'Resource not found') {
    return res.status(404).json(ERROR_RESPONSES.notFound(message));
  }

  static sendValidationResponse(res, message = 'Validation failed') {
    return res.status(400).json(ERROR_RESPONSES.validation(message));
  }

  static sendUnauthorizedResponse(res, message = 'Unauthorized access') {
    return res.status(401).json(ERROR_RESPONSES.unauthorized(message));
  }

  static sendForbiddenResponse(res, message = 'Access forbidden') {
    return res.status(403).json(ERROR_RESPONSES.forbidden(message));
  }

  static sendServerErrorResponse(res, message = 'Internal server error') {
    return res.status(500).json(ERROR_RESPONSES.server(message));
  }
}

module.exports = ResponseHelpers;
