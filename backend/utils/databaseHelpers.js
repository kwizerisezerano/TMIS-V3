/**
 * Database Helper Functions
 * Reusable database operations to eliminate duplication
 */

const { ERROR_RESPONSES, getCurrentUTCDate } = require('./common');

class DatabaseHelpers {
  constructor(db) {
    this.db = db;
  }

  // Generic query with error handling
  async execute(query, params = []) {
    try {
      return await this.db.execute(query, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Pagination helper
  buildPaginationQuery(baseQuery, whereClause = '', params = [], page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const query = `${baseQuery} ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    return { query, params: [...params, parseInt(limit), offset] };
  }

  // Count query helper
  buildCountQuery(table, whereClause = '', params = []) {
    const query = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    return { query, params };
  }

  // Get single record by ID
  async getById(table, id, columns = '*') {
    const [result] = await this.execute(`SELECT ${columns} FROM ${table} WHERE id = ?`, [id]);
    return result.length > 0 ? result[0] : null;
  }

  // Check if record exists
  async exists(table, condition, params) {
    const [result] = await this.execute(`SELECT COUNT(*) as count FROM ${table} WHERE ${condition}`, params);
    return result[0].count > 0;
  }

  // Insert record with timestamps
  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await this.execute(query, values);
    
    return result.insertId;
  }

  // Update record by ID with timestamp
  async updateById(table, id, data, includeTimestamp = true) {
    if (includeTimestamp) {
      data.updated_at = getCurrentUTCDate();
    }
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const [result] = await this.execute(query, [...values, id]);
    
    return result.affectedRows > 0;
  }

  // Delete record by ID
  async deleteById(table, id) {
    const [result] = await this.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // Get paginated results with total count
  async getPaginated(table, columns = '*', whereClause = '', params = [], page = 1, limit = 20, orderBy = 'created_at DESC') {
    // Get data
    const offset = (page - 1) * limit;
    const dataQuery = `SELECT ${columns} FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    const [data] = await this.execute(dataQuery, [...params, parseInt(limit), offset]);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const [countResult] = await this.execute(countQuery, params);
    const total = countResult[0].total;
    
    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // User-specific helpers
  async getUserById(userId, columns = 'id, names, email, phone, role, email_verified, id_number, created_at') {
    return await this.getById('users', userId, columns);
  }

  async userExists(userId) {
    return await this.exists('users', 'id = ?', [userId]);
  }

  async updateUser(userId, data) {
    return await this.updateById('users', userId, data);
  }

  async deleteUser(userId) {
    return await this.deleteById('users', userId);
  }

  // Tontine-specific helpers
  async getTontineById(tontineId, columns = '*') {
    return await this.getById('tontines', tontineId, columns);
  }

  async tontineExists(tontineId) {
    return await this.exists('tontines', 'id = ?', [tontineId]);
  }

  async getTontineMembers(tontineId, status = 'approved') {
    const [result] = await this.execute(`
      SELECT tm.*, u.names, u.phone, u.email
      FROM tontine_members tm 
      JOIN users u ON tm.user_id = u.id 
      WHERE tm.tontine_id = ? AND tm.status = ?
      ORDER BY tm.created_at ASC
    `, [tontineId, status]);
    
    return result;
  }

  async isUserMemberOfTontine(userId, tontineId, status = 'approved') {
    return await this.exists('tontine_members', 'user_id = ? AND tontine_id = ? AND status = ?', [userId, tontineId, status]);
  }

  // Contribution-specific helpers
  async getContributionStats(userId, tontineId) {
    const [result] = await this.execute(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_contributed,
        SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_amount
      FROM contributions 
      WHERE user_id = ? AND tontine_id = ?
    `, [userId, tontineId]);
    
    return result[0] || { total_contributions: 0, total_contributed: 0, pending_amount: 0 };
  }

  // Loan-specific helpers
  async getLoanStats(userId, tontineId) {
    const [result] = await this.execute(`
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'approved' THEN loan_amount ELSE 0 END) as total_borrowed,
        SUM(CASE WHEN status = 'pending' THEN loan_amount ELSE 0 END) as pending_amount
      FROM loans 
      WHERE user_id = ? AND tontine_id = ?
    `, [userId, tontineId]);
    
    return result[0] || { total_loans: 0, total_borrowed: 0, pending_amount: 0 };
  }

  // Notification helpers
  async createNotification(userId, title, message, type = 'info') {
    return await this.insert('notifications', {
      user_id: userId,
      title,
      message,
      type,
      created_at: getCurrentUTCDate()
    });
  }

  async createNotificationsForUsers(userIds, title, message, type = 'info') {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      created_at: getCurrentUTCDate()
    }));

    let createdCount = 0;
    for (const notification of notifications) {
      try {
        await this.insert('notifications', notification);
        createdCount++;
      } catch (error) {
        console.error(`Failed to create notification for user ${notification.user_id}:`, error);
      }
    }
    
    return createdCount;
  }

  // Validation helpers
  async validateOwnership(userId, resourceType, resourceId) {
    switch (resourceType) {
      case 'tontine':
        return await this.exists('tontines', 'creator_id = ? AND id = ?', [userId, resourceId]);
      case 'contribution':
        return await this.exists('contributions', 'user_id = ? AND id = ?', [userId, resourceId]);
      case 'loan':
        return await this.exists('loans', 'user_id = ? AND id = ?', [userId, resourceId]);
      default:
        return false;
    }
  }

  // Transaction helper (for complex operations)
  async transaction(callback) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = DatabaseHelpers;
