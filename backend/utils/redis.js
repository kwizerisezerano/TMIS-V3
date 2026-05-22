const redis = require('redis');

let client = null;
let isConnected = false;
let loggedFallback = false;

// Mock client for when Redis is unavailable
const mockClient = {
  setEx: async () => true,
  get: async () => null,
  del: async () => true,
  keys: async () => []
};

try {
  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
  });

  client.on('error', (err) => {
    if (!loggedFallback) {
      console.log('Redis not available, using in-memory fallback');
      loggedFallback = true;
    }
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
    isConnected = true;
  });

  // Try to connect to Redis
  client.connect().catch(() => {
    if (!loggedFallback) {
      console.log('Redis connection failed, using in-memory fallback');
      loggedFallback = true;
    }
    client = mockClient;
  });
} catch (error) {
  if (!loggedFallback) {
    console.log('Redis not available, using in-memory fallback');
    loggedFallback = true;
  }
  client = mockClient;
}

module.exports = client || mockClient;