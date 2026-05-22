/**
 * Performance Helper Functions
 * Optimized database operations and caching strategies
 */

const NodeCache = require('node-cache');
const { getCurrentUTCDate } = require('./common');

class PerformanceHelpers {
  constructor() {
    // Initialize caches with different TTLs
    this.userCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes
    this.tontineCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 minutes
    this.configCache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 minutes
    this.statsCache = new NodeCache({ stdTTL: 120, checkperiod: 30 }); // 2 minutes
    
    // Performance monitoring
    this.queryTimes = new Map();
    this.requestCounts = new Map();
    this.slowQueries = [];
  }

  // Caching helpers
  getCached(cacheKey, cacheType = 'user') {
    const cache = this.getCache(cacheType);
    return cache.get(cacheKey);
  }

  setCached(cacheKey, data, cacheType = 'user', ttl = null) {
    const cache = this.getCache(cacheType);
    return cache.set(cacheKey, data, ttl);
  }

  deleteCached(cacheKey, cacheType = 'user') {
    const cache = this.getCache(cacheType);
    return cache.del(cacheKey);
  }

  clearCache(cacheType = 'user') {
    const cache = this.getCache(cacheType);
    return cache.flushAll();
  }

  getCache(cacheType) {
    switch (cacheType) {
      case 'user': return this.userCache;
      case 'tontine': return this.tontineCache;
      case 'config': return this.configCache;
      case 'stats': return this.statsCache;
      default: return this.userCache;
    }
  }

  // Performance monitoring
  startQueryTimer(queryName) {
    this.queryTimes.set(queryName, process.hrtime());
  }

  endQueryTimer(queryName) {
    const start = this.queryTimes.get(queryName);
    if (start) {
      const diff = process.hrtime(start);
      const ms = diff[0] * 1000 + diff[1] * 1e-6;
      this.queryTimes.delete(queryName);
      
      // Log slow queries (>100ms)
      if (ms > 100) {
        this.slowQueries.push({
          query: queryName,
          duration: ms,
          timestamp: getCurrentUTCDate()
        });
        console.warn(`Slow query detected: ${queryName} took ${ms.toFixed(2)}ms`);
      }
      
      return ms;
    }
    return 0;
  }

  incrementRequestCount(endpoint) {
    const current = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, current + 1);
  }

  getPerformanceStats() {
    return {
      cacheStats: {
        user: this.userCache.getStats(),
        tontine: this.tontineCache.getStats(),
        config: this.configCache.getStats(),
        stats: this.statsCache.getStats()
      },
      slowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
      requestCounts: Object.fromEntries(this.requestCounts)
    };
  }

  // Optimized database queries
  buildOptimizedQuery(baseQuery, conditions = [], joins = [], orderBy = 'created_at DESC') {
    let query = baseQuery;
    let params = [];

    // Add conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.map(condition => condition.clause).join(' AND ');
      params = conditions.flatMap(condition => condition.params || []);
    }

    // Add joins
    if (joins.length > 0) {
      query += ' ' + joins.join(' ');
    }

    // Add order by
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    return { query, params };
  }

  // Batch operations for performance
  async batchInsert(db, table, records, batchSize = 100) {
    if (records.length === 0) return [];
    
    const results = [];
    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchParams = batch.flatMap(record => columns.map(col => record[col]));
      
      try {
        const [result] = await db.execute(query, batchParams);
        results.push(...Array.from({ length: batch.length }, (_, index) => ({
          id: result.insertId + index,
          success: true
        })));
      } catch (error) {
        console.error(`Batch insert error at index ${i}:`, error);
        results.push(...Array.from({ length: batch.length }, () => ({
          success: false,
          error: error.message
        })));
      }
    }

    return results;
  }

  async batchUpdate(db, table, updates, batchSize = 50) {
    if (updates.length === 0) return [];
    
    const results = [];
    const idField = updates[0].idField || 'id';

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { [idField]: id, ...data } = update;
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const params = [...Object.values(data), id];
        const query = `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`;
        
        try {
          const [result] = await db.execute(query, params);
          results.push({
            id,
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows
          });
        } catch (error) {
          console.error(`Batch update error for ID ${id}:`, error);
          results.push({
            id,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  // Optimized pagination with caching
  async getPaginatedOptimized(db, table, columns = '*', conditions = [], page = 1, limit = 20, orderBy = 'created_at DESC', cacheKey = null, ttl = 300) {
    // Check cache first
    if (cacheKey) {
      const cached = this.getCached(cacheKey, 'stats');
      if (cached) {
        return cached;
      }
    }

    const offset = (page - 1) * limit;
    
    // Build optimized query
    const { query, params } = this.buildOptimizedQuery(
      `SELECT ${columns} FROM ${table}`,
      conditions,
      [],
      orderBy
    );

    // Get data with limit
    const [data] = await db.execute(`${query} LIMIT ? OFFSET ?`, [...params, limit, offset]);
    
    // Get total count (optimized)
    const { query: countQuery, params: countParams } = this.buildOptimizedQuery(
      `SELECT COUNT(*) as total FROM ${table}`,
      conditions
    );
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    const result = {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    // Cache result
    if (cacheKey) {
      this.setCached(cacheKey, result, 'stats', ttl);
    }

    return result;
  }

  // Optimized user data retrieval with caching
  async getUserOptimized(db, userId, columns = '*', useCache = true) {
    const cacheKey = `user_${userId}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.getCached(cacheKey, 'user');
      if (cached) {
        return cached;
      }
    }

    const query = `SELECT ${columns} FROM users WHERE id = ?`;
    const [result] = await db.execute(query, [userId]);
    
    const user = result.length > 0 ? result[0] : null;
    
    // Cache result
    if (user && useCache) {
      this.setCached(cacheKey, user, 'user', 300); // 5 minutes
    }

    return user;
  }

  // Optimized tontine data with member caching
  async getTontineOptimized(db, tontineId, includeMembers = false, useCache = true) {
    const cacheKey = `tontine_${tontineId}_${includeMembers}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.getCached(cacheKey, 'tontine');
      if (cached) {
        return cached;
      }
    }

    // Get tontine data
    const [tontine] = await db.execute('SELECT * FROM tontines WHERE id = ?', [tontineId]);
    
    if (tontine.length === 0) {
      return null;
    }

    const result = tontine[0];

    // Get members if requested
    if (includeMembers) {
      const [members] = await db.execute(`
        SELECT tm.*, u.names, u.phone, u.email
        FROM tontine_members tm 
        JOIN users u ON tm.user_id = u.id 
        WHERE tm.tontine_id = ? AND tm.status = 'approved'
        ORDER BY tm.created_at ASC
      `, [tontineId]);
      
      result.members = members;
    }

    // Cache result
    if (useCache) {
      this.setCached(cacheKey, result, 'tontine', 600); // 10 minutes
    }

    return result;
  }

  // Optimized statistics with caching
  async getStatsOptimized(db, type, params = {}, useCache = true) {
    const cacheKey = `stats_${type}_${JSON.stringify(params)}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.getCached(cacheKey, 'stats');
      if (cached) {
        return cached;
      }
    }

    let result = {};

    switch (type) {
      case 'dashboard':
        const [userStats] = await db.execute('SELECT COUNT(*) as total_users FROM users WHERE role = "member"');
        const [tontineStats] = await db.execute('SELECT COUNT(*) as total_tontines FROM tontines WHERE status = "active"');
        const [contributionStats] = await db.execute('SELECT SUM(amount) as total_contributions FROM contributions WHERE payment_status = "Approved"');
        
        result = {
          total_users: userStats[0].total_users,
          total_tontines: tontineStats[0].total_tontines,
          total_contributions: contributionStats[0].total_contributions || 0
        };
        break;

      case 'user_summary':
        const userId = params.userId;
        const [userContributions] = await db.execute(`
          SELECT COUNT(*) as count, SUM(amount) as total 
          FROM contributions 
          WHERE user_id = ? AND payment_status = "Approved"
        `, [userId]);
        
        const [userLoans] = await db.execute(`
          SELECT COUNT(*) as count, SUM(loan_amount) as total 
          FROM loans 
          WHERE user_id = ? AND status IN ("approved", "disbursed")
        `, [userId]);
        
        result = {
          contributions: userContributions[0],
          loans: userLoans[0]
        };
        break;

      default:
        result = {};
    }

    // Cache result
    if (useCache) {
      this.setCached(cacheKey, result, 'stats', 120); // 2 minutes
    }

    return result;
  }

  // Memory cleanup
  cleanup() {
    // Clear old slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-50);
    }

    // Reset request counts periodically
    if (this.requestCounts.size > 1000) {
      this.requestCounts.clear();
    }
  }

  // Cache warming for frequently accessed data
  async warmCache(db) {
    try {
      // Warm user cache for active users
      const [activeUsers] = await db.execute(`
        SELECT id FROM users 
        WHERE role = "member" 
        ORDER BY id DESC 
        LIMIT 50
      `);

      for (const user of activeUsers) {
        await this.getUserOptimized(db, user.id, 'id, names, email, role', true);
      }

      // Warm tontine cache
      let activeTontines = [];
      try {
        const [result] = await db.execute(`
          SELECT id FROM tontines 
          WHERE status = "active" 
          ORDER BY created_at DESC 
          LIMIT 20
        `);
        activeTontines = result || [];
      } catch (error) {
        // Table doesn't exist, skip tontine cache warming
        console.log('Tontines table not found, skipping cache warming');
      }

      for (const tontine of activeTontines) {
        await this.getTontineOptimized(db, tontine.id, false, true);
      }

      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }
}

module.exports = PerformanceHelpers;
