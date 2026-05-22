/**
 * Business Logic Helper Functions
 * Common business patterns to eliminate duplication
 */

const { ERROR_RESPONSES, SUCCESS_RESPONSES, getCurrentUTCDate } = require('./common');
const { decryptUserData } = require('./encryption');

class BusinessHelpers {
  // User management helpers
  static async validateUserExists(db, userId) {
    const [result] = await db.execute('SELECT COUNT(*) as count FROM users WHERE id = ?', [userId]);
    return result[0].count > 0;
  }

  static async getUserData(db, userId, columns = '*') {
    const [result] = await db.execute(`SELECT ${columns} FROM users WHERE id = ?`, [userId]);
    return result.length > 0 ? result[0] : null;
  }

  static async decryptUserDataList(users) {
    if (!Array.isArray(users)) return users;
    return users.map(user => {
      try {
        return decryptUserData(user);
      } catch (error) {
        console.error('Error decrypting user data:', error);
        return user;
      }
    });
  }

  // Tontine management helpers
  static async validateTontineExists(db, tontineId, status = null) {
    let query = 'SELECT COUNT(*) as count FROM tontines WHERE id = ?';
    let params = [tontineId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    const [result] = await db.execute(query, params);
    return result[0].count > 0;
  }

  static async getTontineData(db, tontineId, columns = '*') {
    const [result] = await db.execute(`SELECT ${columns} FROM tontines WHERE id = ?`, [tontineId]);
    return result.length > 0 ? result[0] : null;
  }

  static async isUserMember(db, userId, tontineId, status = 'approved') {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM tontine_members WHERE user_id = ? AND tontine_id = ? AND status = ?',
      [userId, tontineId, status]
    );
    return result[0].count > 0;
  }

  static async getTontineMemberCount(db, tontineId, status = 'approved') {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM tontine_members WHERE tontine_id = ? AND status = ?',
      [tontineId, status]
    );
    return result[0].count;
  }

  // Financial calculation helpers
  static calculateLoanInterest(loanAmount, months = 6, monthlyRate = 1.7) {
    const monthlyInterest = (loanAmount * monthlyRate) / 100;
    return {
      monthlyInterest,
      totalInterest: monthlyInterest * months,
      totalAmount: loanAmount + (monthlyInterest * months)
    };
  }

  static calculateMaxLoanAmount(totalContributions, multiplier = 2/3) {
    return Math.floor(totalContributions * multiplier);
  }

  static async getUserTotalContributions(db, userId, tontineId) {
    const [result] = await db.execute(
      'SELECT SUM(amount) as total FROM contributions WHERE user_id = ? AND tontine_id = ? AND payment_status = "Approved"',
      [userId, tontineId]
    );
    return result[0].total || 0;
  }

  // Permission helpers
  static async isAdminOrPresident(db, userId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE id = ? AND role IN (?, ?)',
      [userId, 'admin', 'president']
    );
    return result[0].count > 0;
  }

  static async isCreator(db, userId, tontineId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM tontines WHERE id = ? AND creator_id = ?',
      [tontineId, userId]
    );
    return result[0].count > 0;
  }

  // Status validation helpers
  static validateStatus(status, validStatuses) {
    return validStatuses.includes(status);
  }

  static validateLoanStatus(status) {
    return this.validateStatus(status, ['pending', 'approved', 'rejected', 'disbursed', 'completed', 'defaulted']);
  }

  static validatePaymentStatus(status) {
    return this.validateStatus(status, ['pending', 'completed', 'failed', 'cancelled']);
  }

  static validateMembershipStatus(status) {
    return this.validateStatus(status, ['pending', 'approved', 'rejected', 'suspended', 'left', 'removed']);
  }

  // File upload helpers
  static validateFileSize(size, maxSize = 5 * 1024 * 1024) {
    return size <= maxSize;
  }

  static validateFileType(mimetype, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']) {
    return allowedTypes.includes(mimetype);
  }

  // Notification helpers
  static async notifyUsers(db, userIds, title, message, type = 'info') {
    const notifications = userIds.map(userId => [
      userId,
      title,
      message,
      type,
      getCurrentUTCDate()
    ]);

    let createdCount = 0;
    for (const notification of notifications) {
      try {
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)',
          notification
        );
        createdCount++;
      } catch (error) {
        console.error(`Failed to create notification for user ${notification[0]}:`, error);
      }
    }
    
    return createdCount;
  }

  static async notifyTontineMembers(db, tontineId, title, message, type = 'info', excludeUser = null) {
    let query = 'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = ?';
    let params = [tontineId, 'approved'];
    
    if (excludeUser) {
      query += ' AND user_id != ?';
      params.push(excludeUser);
    }
    
    const [members] = await db.execute(query, params);
    const userIds = members.map(member => member.user_id);
    
    return await this.notifyUsers(db, userIds, title, message, type);
  }

  // Validation helpers for business rules
  static async canJoinTontine(db, userId, tontineId) {
    // Check if user is already a member
    if (await this.isUserMember(db, userId, tontineId)) {
      return { canJoin: false, reason: 'User is already a member of this tontine' };
    }

    // Check if tontine is active
    if (!(await this.validateTontineExists(db, tontineId, 'active'))) {
      return { canJoin: false, reason: 'Tontine is not active' };
    }

    // Check if tontine is full
    const memberCount = await this.getTontineMemberCount(db, tontineId);
    const tontineData = await this.getTontineData(db, tontineId, 'max_members');
    
    if (memberCount >= tontineData.max_members) {
      return { canJoin: false, reason: 'Tontine is full' };
    }

    return { canJoin: true };
  }

  static async canApplyForLoan(db, userId, tontineId, loanAmount) {
    // Check if user is approved member
    if (!(await this.isUserMember(db, userId, tontineId))) {
      return { canApply: false, reason: 'User is not an approved member of this tontine' };
    }

    // Check if tontine is active
    if (!(await this.validateTontineExists(db, tontineId, 'active'))) {
      return { canApply: false, reason: 'Tontine is not active' };
    }

    // Check if user has enough contributions
    const totalContributions = await this.getUserTotalContributions(db, userId, tontineId);
    const maxLoanAmount = this.calculateMaxLoanAmount(totalContributions);
    
    if (loanAmount > maxLoanAmount) {
      return { 
        canApply: false, 
        reason: `Maximum loan amount is RWF ${maxLoanAmount.toLocaleString()} (2/3 of total contributions)` 
      };
    }

    return { canApply: true };
  }

  // Statistics helpers
  static async getUserStats(db, userId, tontineId = null) {
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];
    
    if (tontineId) {
      whereClause += ' AND tontine_id = ?';
      params.push(tontineId);
    }

    // Contribution stats
    const [contribStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_contributed,
        SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_amount
      FROM contributions ${whereClause}
    `, params);

    // Loan stats
    const [loanStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'approved' THEN loan_amount ELSE 0 END) as total_borrowed,
        SUM(CASE WHEN status = 'pending' THEN loan_amount ELSE 0 END) as pending_amount
      FROM loans ${whereClause}
    `, params);

    return {
      contributions: contribStats[0] || { total_contributions: 0, total_contributed: 0, pending_amount: 0 },
      loans: loanStats[0] || { total_loans: 0, total_borrowed: 0, pending_amount: 0 }
    };
  }

  // Cleanup helpers
  static async cleanupOldRecords(db, table, dateField = 'created_at', daysOld = 30) {
    const [result] = await db.execute(
      `DELETE FROM ${table} WHERE ${dateField} < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysOld]
    );
    return result.affectedRows;
  }
}

module.exports = BusinessHelpers;
