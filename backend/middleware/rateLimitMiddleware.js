/**
 * Rate Limiting Middleware
 * Simplified rate limiting without Redis complexity
 */

const rateLimit = require('express-rate-limit');

class RateLimitMiddleware {
  constructor() {
    // Rate limit configurations
    this.limits = {
      // General API limits
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requests per window
        message: { status: 429, success: false, message: 'Too many requests, please try again later' }
      },
      
      // Authentication limits (stricter)
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // 10 auth attempts per window
        message: { status: 429, success: false, message: 'Too many authentication attempts, please try again later' }
      },
      
      // Password reset limits
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 password reset attempts per hour
        message: { status: 429, success: false, message: 'Too many password reset attempts, please try again later' }
      },
      
      // Application submission limits
      application: {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: 5, // 5 applications per day
        message: { status: 429, success: false, message: 'Too many applications submitted, please try again tomorrow' }
      },
      
      // File upload limits
      fileUpload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // 50 file uploads per hour
        message: { status: 429, success: false, message: 'Too many file uploads, please try again later' }
      },
      
      // Search limits
      search: {
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100, // 100 searches per minute
        message: { status: 429, success: false, message: 'Too many search requests, please slow down' }
      }
    };
  }

  createRateLimit(type, options = {}) {
    const config = this.limits[type];
    if (!config) {
      throw new Error(`Unknown rate limit type: ${type}`);
    }

    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: config.message,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
        res.status(429).json(config.message);
      },
      ...options
    });
  }

  // Specialized rate limiters
  authLimiter() {
    return this.createRateLimit('auth');
  }

  passwordResetLimiter() {
    return this.createRateLimit('passwordReset');
  }

  applicationLimiter() {
    return this.createRateLimit('application');
  }

  fileUploadLimiter() {
    return this.createRateLimit('fileUpload');
  }

  searchLimiter() {
    return this.createRateLimit('search');
  }

  // Generic rate limiter
  genericRateLimiter() {
    return this.createRateLimit('general');

    const limiter = rateLimit({
      windowMs: limit.windowMs,
      max: limit.max,
      message: ERROR_RESPONSES.tooManyRequests('Rate limit exceeded for your role'),
      keyGenerator: (req) => `${req.ip}:${req.user?.userId || 'anonymous'}:${userRole}`
    });

    return limiter(req, res, next);
  }

  // API endpoint specific rate limiter
  endpointLimiter(endpoints, limits) {
    const limiter = rateLimit({
      windowMs: limits.windowMs || 15 * 60 * 1000,
      max: limits.max || 100,
      message: limits.message || ERROR_RESPONSES.tooManyRequests('Rate limit exceeded'),
      keyGenerator: (req) => {
        const endpoint = req.route?.path || req.path;
        return `${req.ip}:${endpoint}`;
      },
      skip: (req) => {
        const endpoint = req.route?.path || req.path;
        return !endpoints.includes(endpoint);
      }
    });

    return limiter;
  }

  // WebSocket rate limiting
  websocketRateLimit(socket, next) {
    const clientId = socket.handshake.address;
    const connections = this.getConnections(clientId);
    
    // Limit concurrent connections per IP
    if (connections > 10) {
      socket.emit('error', { message: 'Too many concurrent connections' });
      socket.disconnect();
      return;
    }

    // Add connection tracking
    this.addConnection(clientId, socket.id);
    
    // Clean up on disconnect
    socket.on('disconnect', () => {
      this.removeConnection(clientId, socket.id);
    });

    next();
  }

  // Connection tracking for WebSocket
  getConnections(clientId) {
    // This would typically use Redis in production
    return (this.connections?.get(clientId) || []).length;
  }

  addConnection(clientId, socketId) {
    if (!this.connections) this.connections = new Map();
    
    const connections = this.connections.get(clientId) || [];
    connections.push(socketId);
    this.connections.set(clientId, connections);
  }

  removeConnection(clientId, socketId) {
    if (!this.connections) return;
    
    const connections = this.connections.get(clientId) || [];
    const index = connections.indexOf(socketId);
    if (index > -1) {
      connections.splice(index, 1);
    }
    
    if (connections.length === 0) {
      this.connections.delete(clientId);
    } else {
      this.connections.set(clientId, connections);
    }
  }

  // Get rate limit statistics
  async getRateLimitStats() {
    const stats = {
      redisConnected: !!this.redis,
      activeConnections: this.connections?.size || 0,
      limits: Object.keys(this.limits)
    };

    if (this.redis) {
      try {
        // Get Redis stats
        const info = await this.redis.info('memory');
        const memoryUsage = info.split('\r\n').find(line => line.startsWith('used_memory_human:'));
        stats.redisMemory = memoryUsage?.split(':')[1] || 'unknown';
      } catch (error) {
        stats.redisMemory = 'error';
      }
    }

    return stats;
  }
}

// Singleton instance
const rateLimitMiddleware = new RateLimitMiddleware();

module.exports = rateLimitMiddleware;
