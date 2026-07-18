/**
 * TMIS Backend Server
 * Professional REST API with Socket.io support
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const hdevPayment = require('./utils/hdevPayment');

// Import middleware before using
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : ['http://localhost:3000', 'http://localhost:3200'],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware with performance optimizations
app.use(cors({
  origin: process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : ['http://localhost:3000', 'http://localhost:3200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-User-Agent'],
  credentials: true
}));

// Rate limiting middleware (must be before body parsers for security)
app.use('/api/v1/auth/login', rateLimitMiddleware.authLimiter());
app.use('/api/v1/auth/forgot-password', rateLimitMiddleware.passwordResetLimiter());
app.use('/api/v1/applications', rateLimitMiddleware.applicationLimiter());
app.use('/api/v1/search', rateLimitMiddleware.searchLimiter());

// General rate limiting
app.use(rateLimitMiddleware.createRateLimit('general'));

// Request logging for performance monitoring
const PerformanceHelpers = require('./utils/performanceHelpers');
const performanceHelpers = new PerformanceHelpers();

app.use((req, res, next) => {
  const start = Date.now();
  performanceHelpers.incrementRequestCount(req.path);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log slow requests
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database configuration with performance optimizations
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ikimina_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
  queueLimit: 0,
  // Performance and Precision optimizations
  supportBigNumbers: true,
  bigNumberStrings: true,
  idleTimeout: 300000, // 5 minutes
  maxIdle: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });

// Add database connection to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Activity log middleware - log all POST/PUT/DELETE requests
const activityLogMiddleware = require('./middleware/activityLogMiddleware');
app.use(activityLogMiddleware);

// Performance and caching initialization
const OptimizedQueries = require('./utils/optimizedQueries');

// Services initialization
let penaltiesService = null;
try {
  const PenaltiesService = require('./utils/penaltiesService');
  penaltiesService = new PenaltiesService(pool, io);
  penaltiesService.start();
  console.log('✅ Penalties service initialized');
} catch (error) {
  console.error('⚠️ Penalties service initialization failed:', error.message);
}

// Performance monitoring
const performanceMonitoring = setInterval(() => {
  const stats = performanceHelpers.getPerformanceStats();
  
  // Log performance warnings
  if (stats.slowQueries.length > 0) {
    console.warn(`⚠️ ${stats.slowQueries.length} slow queries detected in last period`);
  }
  
  // Cache performance
  const totalCacheHits = Object.values(stats.cacheStats).reduce((sum, cache) => sum + cache.hits, 0);
  const totalCacheMisses = Object.values(stats.cacheStats).reduce((sum, cache) => sum + cache.misses, 0);
  const cacheHitRate = totalCacheHits + totalCacheMisses > 0 ? (totalCacheHits / (totalCacheHits + totalCacheMisses) * 100).toFixed(2) : 0;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Cache hit rate: ${cacheHitRate}% | Total requests: ${Object.values(stats.requestCounts).reduce((sum, count) => sum + count, 0)}`);
  }
  
  // Cleanup old performance data
  performanceHelpers.cleanup();
}, 60000); // Check every minute

// Cache warming on startup
setTimeout(async () => {
  try {
    await performanceHelpers.warmCache(pool);
    console.log('✅ Cache warming completed');
  } catch (error) {
    console.error('⚠️ Cache warming failed:', error.message);
  }
}, 5000); // Wait 5 seconds after server start

// Helper function to initialize routes with database
const initializeRoute = (routePath, routeModule) => {
  app.use(routePath, (req, res, next) => {
    req.app.set('db', pool);
    next();
  }, routeModule(pool));
};

// Initialize all v1 routes
initializeRoute('/api/v1/auth', require('./routes/v1/auth'));
initializeRoute('/api/v1/penalties', require('./routes/v1/penalties'));
initializeRoute('/api/v1/users', require('./routes/v1/users'));
initializeRoute('/api/v1/contributions', require('./routes/v1/contributions'));
initializeRoute('/api/v1/tontines', require('./routes/v1/tontines'));
initializeRoute('/api/v1/loans', require('./routes/v1/loans'));
initializeRoute('/api/v1/payments', require('./routes/v1/payments'));
initializeRoute('/api/v1/meetings', require('./routes/v1/meetings'));
initializeRoute('/api/v1/notifications', require('./routes/v1/notifications'));
initializeRoute('/api/v1/members', require('./routes/v1/members'));
initializeRoute('/api/v1/applications', require('./routes/v1/applications'));
initializeRoute('/api/v1/activity-logs', require('./routes/v1/activityLog'));
initializeRoute('/api/v1/surplus', require('./routes/v1/surplus'));
initializeRoute('/api/v1/reports', require('./routes/v1/reports'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    status: 500,
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: 'Route not found'
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-tontine', (tontineId) => {
    socket.join(`tontine-${tontineId}`);
    console.log(`User ${socket.id} joined tontine-${tontineId}`);
  });

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${socket.id} joined user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

let isCheckingPaymentStatuses = false;
const paymentStatusErrorLogTimes = new Map();
const paymentStatusErrorLogIntervalMs = parseInt(process.env.HDEV_STATUS_ERROR_LOG_INTERVAL_MS || '300000', 10);
const hdevPollingEnabled = process.env.HDEV_PAYMENT_POLLING !== 'false';

const emitPaymentStatus = (payment, payload) => {
  const data = {
    userId: payment.user_id,
    contributionId: payment.contribution_id,
    transactionId: payment.transaction_ref,
    timestamp: new Date(),
    ...payload
  };

  io.to(`user-${payment.user_id}`).to(`tontine-${payment.tontine_id}`).emit('payment-status', data);
};

const checkPendingHdevContributionPayments = async () => {
  if (isCheckingPaymentStatuses) {
    return;
  }

  isCheckingPaymentStatuses = true;

  try {
    let pendingPayments = [];
    try {
      const [result] = await pool.execute(
        `SELECT c.id as contribution_id, c.user_id, c.tontine_id, p.id as payment_id, p.transaction_ref
         FROM contributions c
         JOIN payments p ON p.user_id = c.user_id
          AND p.tontine_id = c.tontine_id
          AND p.payment_type = 'contribution'
          AND p.status = 'pending'
         WHERE c.payment_status = 'Pending'
          AND c.payment_method = 'mobile_money'
          AND p.transaction_ref IS NOT NULL
          AND p.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );
      pendingPayments = result || [];
    } catch (error) {
      // Table doesn't exist, skip payment status check
      console.log('Contributions table not found, skipping payment status check');
    }

    for (const payment of pendingPayments) {
      let statusResponse;

      try {
        statusResponse = await hdevPayment.get_pay(payment.transaction_ref);
      } catch (error) {
        const lastLoggedAt = paymentStatusErrorLogTimes.get(payment.transaction_ref) || 0;
        const shouldLog = Date.now() - lastLoggedAt >= paymentStatusErrorLogIntervalMs;

        if (shouldLog) {
          paymentStatusErrorLogTimes.set(payment.transaction_ref, Date.now());
          console.warn(
            `Payment status check skipped for ${payment.transaction_ref}: ${error.message}`
          );
        }

        await pool.execute(
          'UPDATE payments SET payment_data = ? WHERE id = ?',
          [JSON.stringify({ status_check_error: error.message, checked_at: new Date().toISOString() }), payment.payment_id]
        );

        continue;
      }

      if (hdevPayment.isSuccessfulResponse(statusResponse)) {
        await pool.execute(
          'UPDATE contributions SET payment_status = "Approved" WHERE id = ?',
          [payment.contribution_id]
        );
        await pool.execute(
          'UPDATE payments SET status = "completed", payment_data = ? WHERE id = ?',
          [JSON.stringify(statusResponse), payment.payment_id]
        );

        emitPaymentStatus(payment, {
          status: 'completed',
          message: 'Payment confirmed by HDEV',
        });
      } else if (hdevPayment.isFailedResponse(statusResponse)) {
        await pool.execute(
          'UPDATE contributions SET payment_status = "Rejected" WHERE id = ?',
          [payment.contribution_id]
        );
        await pool.execute(
          'UPDATE payments SET status = "failed", payment_data = ? WHERE id = ?',
          [JSON.stringify(statusResponse), payment.payment_id]
        );

        emitPaymentStatus(payment, {
          status: 'failed',
          message: statusResponse?.message || 'Payment failed on HDEV',
        });
      } else {
        await pool.execute(
          'UPDATE payments SET payment_data = ? WHERE id = ?',
          [JSON.stringify(statusResponse), payment.payment_id]
        );

        emitPaymentStatus(payment, {
          status: 'pending',
          message: statusResponse?.message || 'Payment is still pending on HDEV',
        });
      }
    }
  } catch (error) {
    console.error('Payment status check error:', error.message);
  } finally {
    isCheckingPaymentStatuses = false;
  }
};

// Payment status polling for pending HDEV payments
if (hdevPollingEnabled) {
  const hdevPollingIntervalMs = parseInt(process.env.HDEV_PAYMENT_POLLING_INTERVAL_MS || '30000', 10);
  setInterval(checkPendingHdevContributionPayments, hdevPollingIntervalMs);
}

// Cleanup old notifications daily
setInterval(async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 5 DAY)'
    );
    
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} old notifications`);
    }
  } catch (error) {
    console.error('Notification cleanup error:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily (24 hours)

// Make io available to routes
app.set('io', io);
app.set('db', pool);

const PORT = process.env.PORT || 3300;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io, pool };
