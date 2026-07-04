/**
 * Contributions Controller
 * Handles all contribution-related business logic with consistent QueryHelpers usage
 */

const { 
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate,
  QueryHelpers
} = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');
const DatabaseHelpers = require('../utils/databaseHelpers');
const ResponseHelpers = require('../utils/responseHelpers');
const { getContributionStatusUpdatedTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/email');

class ContributionsController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  // Helper method to decrypt user data in arrays
  decryptUsersInContributions(contributions) {
    if (!Array.isArray(contributions)) return contributions;
    const { decryptUserData } = require('../utils/encryption');
    return contributions.map(contrib => ({
      ...contrib,
      user_name: contrib.user_name ? decryptUserData({names: contrib.user_name}).names : contrib.user_name,
      member_name: contrib.member_name ? decryptUserData({names: contrib.member_name}).names : contrib.member_name
    }));
  }

  // Consolidated contributions endpoint with QueryHelpers
  async getContributions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        tontineId, 
        userId,
        contributionId,
        contributionDate,
        includeStats = false 
      } = req.query;

      // If specific contributionId requested, return single contribution
      if (contributionId) {
        return this.getContributionById(req, res);
      }

      // Build where clause using QueryHelpers
      const { whereClause: baseWhere, params: baseParams } = QueryHelpers.buildWhereClause({
        paymentStatus: status,
        tontineId,
        userId
      }, {
        tablePrefix: 'c.'
      });

      let whereClause = baseWhere;
      let params = [...baseParams];

      if (contributionDate) {
        whereClause += ` AND DATE(c.contribution_date) = DATE(?)`;
        params.push(contributionDate);
      }

      // Build pagination using QueryHelpers
      const pagination = QueryHelpers.buildPagination(req.query, { defaultLimit: 20, maxLimit: 100 });

      // Build complete query with proper clause ordering (JOIN before WHERE)
      const joinClause = 'JOIN users u ON c.user_id = u.id JOIN tontines t ON c.tontine_id = t.id';
      const offset = (pagination.page - 1) * pagination.limit;

      // Get data with proper clause ordering
      const dataQuery = `SELECT c.*, u.names as user_name, u.names as member_name, t.name as tontine_name
        FROM contributions c
        ${joinClause}
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?`;

      const [data] = await this.db.execute(dataQuery, [...params, parseInt(pagination.limit), offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM contributions c ${joinClause} ${whereClause}`;
      const [countResult] = await this.db.execute(countQuery, params);
      const total = countResult[0].total;

      const result = {
        data,
        pagination: {
          page: parseInt(pagination.page),
          limit: parseInt(pagination.limit),
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      };

      // Decrypt user data
      const decryptedContributions = this.decryptUsersInContributions(result.data);

      // Include statistics if requested
      if (includeStats === 'true') {
        const [stats] = await this.db.execute(`
          SELECT 
            COUNT(*) as total_contributions,
            SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_amount,
            AVG(amount) as avg_amount
          FROM contributions c 
          ${whereClause}
        `, params);
        
        result.data = {
          contributions: decryptedContributions,
          stats: stats[0] || { total_contributions: 0, total_amount: 0, avg_amount: 0 }
        };
      } else {
        result.data = decryptedContributions;
      }

      // Build complete pagination response
      const paginationResponse = QueryHelpers.buildPaginationResponse(
        result.pagination.total, 
        pagination
      );

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, paginationResponse));

    } catch (error) {
      console.error('Error fetching contributions:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch contributions');
    }
  }

  // Get contribution by ID (used by consolidated endpoint)
  async getContributionById(req, res) {
    try {
      const { contributionId } = req.params;

      // Validate contributionId
      if (!contributionId || isNaN(contributionId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid contribution ID is required');
      }

      // Check if contribution exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'contributions', 'id', contributionId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Contribution not found');
      }

      // Get contribution details
      const [contributions] = await this.db.execute(`
        SELECT c.*, u.names as user_name, t.name as tontine_name
        FROM contributions c 
        JOIN users u ON c.user_id = u.id 
        JOIN tontines t ON c.tontine_id = t.id
        WHERE c.id = ?
      `, [contributionId]);

      if (contributions.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Contribution not found');
      }

      const decryptedContribution = this.decryptUsersInContributions(contributions)[0];

      return ResponseHelpers.sendSuccessResponse(res, decryptedContribution);

    } catch (error) {
      console.error('Error fetching contribution:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch contribution');
    }
  }

  // Get contributions for a tontine
  async getTontineContributions(req, res) {
    try {
      const { tontineId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      let whereClause = 'WHERE c.tontine_id = ?';
      let params = [tontineId];

      if (status) {
        whereClause += ' AND c.payment_status = ?';
        params.push(status);
      }

      // Get contributions with member details
      const [contributions] = await this.db.execute(`
        SELECT c.*, u.names as member_name, u.phone, tm.shares,
               (tm.shares * t.contribution_amount) as expected_amount
        FROM contributions c 
        JOIN users u ON c.user_id = u.id 
        JOIN tontines t ON c.tontine_id = t.id
        JOIN tontine_members tm ON c.tontine_id = tm.tontine_id AND c.user_id = tm.user_id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM contributions c 
        ${whereClause}
      `, params.slice(0, -2)); // Remove limit and offset for count

      // Decrypt user names
      const decryptedContributions = this.decryptUsersInContributions(contributions);

      return res.json(SUCCESS_RESPONSES.ok({
        contributions: decryptedContributions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching tontine contributions:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch contributions'));
    }
  }

  // Get contributions for a user
  async getUserContributions(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      let whereClause = 'WHERE c.user_id = ?';
      let params = [userId];

      if (status) {
        whereClause += ' AND c.payment_status = ?';
        params.push(status);
      }

      // Get contributions with tontine details
      const [contributions] = await this.db.execute(`
        SELECT c.*, t.name as tontine_name, t.contribution_amount
        FROM contributions c 
        JOIN tontines t ON c.tontine_id = t.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM contributions c 
        ${whereClause}
      `, params.slice(0, -2)); // Remove limit and offset for count

      // Calculate statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_contributions,
          SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_contributed,
          SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_amount
        FROM contributions c 
        ${whereClause}
      `, params.slice(0, -2));

      return res.json(SUCCESS_RESPONSES.ok({
        contributions,
        stats: stats[0] || {
          total_contributions: 0,
          total_contributed: 0,
          pending_amount: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching user contributions:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch contributions'));
    }
  }

  // Create contribution record
  async createContribution(req, res) {
    try {
      const { userId, user_id, tontineId, tontine_id, amount, paymentMethod, payment_method, paymentData, payment_data } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;
      const finalTontineId = tontineId || tontine_id;
      const finalPaymentMethod = paymentMethod || payment_method;
      const finalPaymentData = paymentData || payment_data;

      // Validate required fields
      if (!finalUserId || !finalTontineId || !amount || !finalPaymentMethod) {
        return res.status(400).json(ERROR_RESPONSES.validation('All required fields must be provided'));
      }

      // Validate amount
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid contribution amount is required'));
      }
      
      const finalAmount = parseFloat(amount);

      // Check if user is member of tontine
      const [membership] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE user_id = ? AND tontine_id = ? AND status = ?',
        [finalUserId, finalTontineId, 'approved']
      );

      if (membership.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User is not an approved member of this tontine'));
      }

      // Get tontine details
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [tontineId, 'active']
      );

      if (tontine.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Tontine is not active');
      }

      // Check for duplicate contribution for today
      const today = new Date().toISOString().split('T')[0];
      const duplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'contributions', {
        user_id: userId,
        tontine_id: tontineId,
        contribution_date: today
      });

      if (duplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          `Contribution already recorded for today (${duplicateCheck.constraint})`
        );
      }

      // Generate unique transaction reference
      const transactionRef = `CONTR-${Date.now()}-${userId}-${tontineId}`;
      
      // Check for duplicate transaction reference
      const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'contributions', {
        transaction_ref: transactionRef
      });

      if (refDuplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          'Transaction reference conflict. Please try again.'
        );
      }

      // Insert contribution
      const [result] = await this.db.execute(`
        INSERT INTO contributions (user_id, tontine_id, amount, payment_method, transaction_ref, payment_status, contribution_date, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
      `, [finalUserId, finalTontineId, finalAmount, finalPaymentMethod, transactionRef, 'Pending', getCurrentUTCDate()]);

      // Create notification for user
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        finalUserId,
        'Contribution Received',
        `Your contribution of RWF ${finalAmount} to ${tontine[0].name} has been received and is pending approval.`,
        'contribution',
        getCurrentUTCDate()
      ]);

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { contributionId: result.insertId },
        'Contribution recorded successfully'
      ));

    } catch (error) {
      console.error('Error creating contribution:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to record contribution'));
    }
  }

  // Update contribution status (approve/reject)
  async updateContributionStatus(req, res) {
    try {
      const { contributionId } = req.params;
      const { status, notes } = req.body;

      // Validate contributionId
      if (!contributionId || isNaN(contributionId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid contribution ID is required'));
      }

      // Validate status
      if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required (Pending, Approved, Rejected)'));
      }

      // Get contribution details
      const [contributions] = await this.db.execute(
        'SELECT * FROM contributions WHERE id = ?',
        [contributionId]
      );

      if (contributions.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Contribution not found'));
      }

      // Check if status is actually changing
      const oldStatus = contributions[0].payment_status;
      const newStatus = status;

      if (oldStatus === newStatus) {
        // No status change, just return success
        return res.json(SUCCESS_RESPONSES.ok(null, 'Contribution status is already ' + status));
      }

      // Update contribution
      const [result] = await this.db.execute(
        'UPDATE contributions SET payment_status = ? WHERE id = ?',
        [status, contributionId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Contribution not found'));
      }

      // Create payment record in payments table for any status
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const transactionRef = `CONTRIB-PAY-ADMIN-${Date.now()}-${contributions[0].user_id}-${contributionId}-${randomSuffix}`;
      
      // Map contribution status to payment status
      let paymentStatus = 'pending';
      if (status === 'Approved') paymentStatus = 'completed';
      else if (status === 'Rejected') paymentStatus = 'cancelled';
      else if (status === 'Failed') paymentStatus = 'failed';

      await this.db.execute(
        `INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [contributions[0].user_id, contributions[0].tontine_id, 'contribution', contributions[0].amount, contributions[0].payment_method || 'manual', JSON.stringify({ notes: notes || '', contributionId: contributionId }), paymentStatus, transactionRef, getCurrentUTCDate()]
      );

      // Get tontine name for notification
      const [tontine] = await this.db.execute(
        'SELECT name FROM tontines WHERE id = ?',
        [contributions[0].tontine_id]
      );

      // Create notification for user
      const notificationType = status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info';
      const notificationMessage = status === 'Approved' 
        ? `Your contribution of RWF ${contributions[0].amount} to ${tontine[0]?.name || 'tontine'} has been approved.`
        : status === 'Rejected'
        ? `Your contribution of RWF ${contributions[0].amount} to ${tontine[0]?.name || 'tontine'} has been rejected. ${notes || ''}`
        : `Your contribution status has been updated to: ${status}`;

      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        contributions[0].user_id,
        'Contribution Status Updated',
        notificationMessage,
        notificationType,
        getCurrentUTCDate()
      ]);

      // Send email for ALL statuses
      const [users] = await this.db.execute(
        'SELECT names, email FROM users WHERE id = ?',
        [contributions[0].user_id]
      );

      if (users.length > 0) {
        let userName = users[0].names;
        let userEmail = users[0].email;
        try {
          const decryptedUser = decryptUserData({ names: userName, email: userEmail });
          userName = decryptedUser.names;
          userEmail = decryptedUser.email;
        } catch (e) {
          // If decryption fails, use original values
        }

        const emailTemplate = getContributionStatusUpdatedTemplate({
          contributionId: contributionId,
          amount: contributions[0].amount,
          date: contributions[0].contribution_date || new Date(),
          notes: notes || ''
        }, userName, status, tontine[0]?.name || 'tontine');

        sendEmail(userEmail, 'Contribution Status Updated - The Future', emailTemplate)
          .then(() => console.log(`Contribution status email sent to ${userEmail} (user ID: ${contributions[0].user_id})`))
          .catch(err => console.error(`Failed to send contribution status email to ${userEmail} (user ID: ${contributions[0].user_id}):`, err));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Contribution status updated successfully'));

    } catch (error) {
      console.error('Error updating contribution status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update contribution status'));
    }
  }

  // Delete contribution (admin only)
  async deleteContribution(req, res) {
    try {
      const { contributionId } = req.params;

      // Validate contributionId
      if (!contributionId || isNaN(contributionId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid contribution ID is required'));
      }

      // Delete contribution
      const [result] = await this.db.execute('DELETE FROM contributions WHERE id = ?', [contributionId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Contribution not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Contribution deleted successfully'));

    } catch (error) {
      console.error('Error deleting contribution:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete contribution'));
    }
  }

  // Get contribution statistics for tontine
  async getTontineContributionStats(req, res) {
    try {
      const { tontineId } = req.params;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Get contribution statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_contributions,
          SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_amount,
          SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN payment_status = 'Rejected' THEN amount ELSE 0 END) as rejected_amount,
          COUNT(DISTINCT user_id) as unique_contributors,
          AVG(CASE WHEN payment_status = 'Approved' THEN amount END) as avg_contribution
        FROM contributions 
        WHERE tontine_id = ?
      `, [tontineId]);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || {
        total_contributions: 0,
        total_amount: 0,
        pending_amount: 0,
        rejected_amount: 0,
        unique_contributors: 0,
        avg_contribution: 0
      }));

    } catch (error) {
      console.error('Error fetching tontine contribution stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch contribution statistics'));
    }
  }

  // Get missing contributions for a user in a tontine (handles late-joining members)
  async getMissingContributions(req, res) {
    try {
      const { tontineId, userId } = req.params;

      // Validate parameters
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Get tontine details and member join date
      const [memberInfo] = await this.db.execute(`
        SELECT tm.joined_at, tm.shares, t.contribution_amount, t.name as tontine_name
        FROM tontine_members tm
        JOIN tontines t ON tm.tontine_id = t.id
        WHERE tm.user_id = ? AND tm.tontine_id = ? AND tm.status = 'approved'
      `, [userId, tontineId]);

      if (memberInfo.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Member not found in this tontine'));
      }

      const member = memberInfo[0];
      const joinDate = new Date(member.joined_at);
      const contributionAmount = member.contribution_amount * (member.shares || 1);

      // Get all contributions for this user in this tontine
      const [contributions] = await this.db.execute(`
        SELECT contribution_date, amount, payment_status
        FROM contributions
        WHERE user_id = ? AND tontine_id = ?
        AND contribution_date >= DATE(?)
        ORDER BY contribution_date DESC
      `, [userId, tontineId, member.joined_at]);

      // Build a set of months where contributions were made (YYYY-MM format)
      const contributedMonths = new Set();
      const approvedContributions = [];
      
      contributions.forEach(c => {
        const date = new Date(c.contribution_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        contributedMonths.add(monthKey);
        
        if (c.payment_status === 'Approved') {
          approvedContributions.push({
            month: monthKey,
            date: c.contribution_date,
            amount: c.amount,
            status: c.payment_status
          });
        }
      });

      // Calculate expected months from join date to current month
      const now = new Date();
      const expectedMonths = [];
      const missingMonths = [];

      // Start from join month
      let currentYear = joinDate.getFullYear();
      let currentMonth = joinDate.getMonth();

      while (currentYear < now.getFullYear() || (currentYear === now.getFullYear() && currentMonth <= now.getMonth())) {
        const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        expectedMonths.push({
          month: monthKey,
          name: monthName,
          hasContribution: contributedMonths.has(monthKey)
        });

        if (!contributedMonths.has(monthKey)) {
          missingMonths.push({
            month: monthKey,
            name: monthName,
            expectedAmount: contributionAmount
          });
        }

        // Move to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }

      // Calculate statistics
      const totalExpected = expectedMonths.length;
      const totalContributed = contributedMonths.size;
      const totalMissing = missingMonths.length;
      const totalAmountExpected = totalExpected * contributionAmount;// Calculate statistics
      const totalAmountContributed = approvedContributions.reduce((sum, c) => {
        const val = c.amount !== undefined ? c.amount.toString() : '0';
        return sum + parseFloat(val);
      }, 0);
      const totalAmountMissing = totalAmountExpected - totalAmountContributed;

      return res.json(SUCCESS_RESPONSES.ok({
        userId,
        tontineId,
        tontineName: member.tontine_name,
        joinDate: member.joined_at,
        contributionAmount,
        statistics: {
          totalExpected,
          totalContributed,
          totalMissing,
          totalAmountExpected,
          totalAmountContributed,
          totalAmountMissing
        },
        expectedMonths,
        missingMonths,
        contributions: approvedContributions
      }));

    } catch (error) {
      console.error('Error fetching missing contributions:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch missing contributions'));
    }
  }

  // Record bulk manual contributions
  async recordBulkContributions(req, res) {
    try {
      const { tontineId } = req.params;
      const { contributions, contributionDate } = req.body;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid tontine ID is required');
      }

      // Check if tontine exists and is active
      const [tontines] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ?',
        [tontineId]
      );

      if (tontines.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }
      const tontine = tontines[0];

      // Validate contributionDate
      if (!contributionDate) {
        return ResponseHelpers.sendValidationResponse(res, 'Contribution date is required');
      }

      // Validate contributions array
      if (!Array.isArray(contributions)) {
        return ResponseHelpers.sendValidationResponse(res, 'Contributions must be an array');
      }

      // Process each member contribution
      for (const contrib of contributions) {
        const { userId, amount, status, notes } = contrib;

        if (!userId || isNaN(userId)) {
          continue; // Skip invalid user ids
        }

        // If status is 'Not Paid', delete the contribution record for this date
        if (status === 'Not Paid') {
          await this.db.execute(
            'DELETE FROM contributions WHERE user_id = ? AND tontine_id = ? AND DATE(contribution_date) = DATE(?)',
            [userId, tontineId, contributionDate]
          );
          continue;
        }

        // Validate status value
        if (!['Approved', 'Pending', 'Failed'].includes(status)) {
          continue; // Skip invalid status
        }

        // Validate amount
        const finalAmount = amount !== undefined ? parseFloat(amount) : 0.00;
        if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) < 0) {
          console.log(`[Contributions] Skipping invalid amount: ${amount} (userId: ${userId})`);
          continue; // Skip invalid amounts
        }

        console.log(`[Contributions] Recording amount: ${finalAmount} (Type: ${typeof amount}) for userId: ${userId}`);

        // Check if contribution record already exists for this user, tontine, and date
        const [existing] = await this.db.execute(
          'SELECT * FROM contributions WHERE user_id = ? AND tontine_id = ? AND DATE(contribution_date) = DATE(?)',
          [userId, tontineId, contributionDate]
        );

        if (existing.length > 0) {
          // Update existing record
          await this.db.execute(
            `UPDATE contributions 
             SET amount = ?, payment_status = ?, payment_method = 'manual' 
             WHERE id = ?`,
            [finalAmount, status, existing[0].id]
          );
        } else {
          // Generate unique transaction reference
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const transactionRef = `CONTR-${Date.now()}-${userId}-${tontineId}-${randomSuffix}`;

          // Insert new record
          await this.db.execute(
            `INSERT INTO contributions (user_id, tontine_id, amount, payment_method, contribution_date, transaction_ref, payment_status, created_at) 
             VALUES (?, ?, ?, 'manual', ?, ?, ?, ?)`,
            [userId, tontineId, finalAmount, contributionDate, transactionRef, status, getCurrentUTCDate()]
          );
        }

        // Create payment record in payments table for any status
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const transactionRef = `CONTRIB-PAY-ADMIN-${Date.now()}-${userId}-${existing.length > 0 ? existing[0].id : 'new'}-${randomSuffix}`;
        
        // Map contribution status to payment status
        let paymentStatus = 'pending';
        if (status === 'Approved') paymentStatus = 'completed';
        else if (status === 'Rejected') paymentStatus = 'cancelled';
        else if (status === 'Failed') paymentStatus = 'failed';

        await this.db.execute(
          `INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, tontineId, 'contribution', finalAmount, 'manual', JSON.stringify({ notes: notes || '', contributionId: existing.length > 0 ? existing[0].id : null }), paymentStatus, transactionRef, getCurrentUTCDate()]
        );

        // Create in-app notification for the member
        const notificationTitle = 'Contribution Recorded';
        const notificationMessage = `An administrator has recorded a contribution of RWF ${finalAmount.toLocaleString()} for you on ${contributionDate}. Status: ${status}.${notes ? ' Notes: ' + notes : ''}`;
        
        await this.db.execute(
          `INSERT INTO notifications (user_id, title, message, type, created_at) 
           VALUES (?, ?, ?, 'contribution', ?)`,
          [userId, notificationTitle, notificationMessage, getCurrentUTCDate()]
        );

        // Send email for ALL statuses
        const [users] = await this.db.execute(
          'SELECT names, email FROM users WHERE id = ?',
          [userId]
        );

        if (users.length > 0) {
          let userName = users[0].names;
          let userEmail = users[0].email;
          try {
            const decryptedUser = decryptUserData({ names: userName, email: userEmail });
            userName = decryptedUser.names;
            userEmail = decryptedUser.email;
          } catch (e) {
            // If decryption fails, use original values
          }

          const emailTemplate = getContributionStatusUpdatedTemplate({
            contributionId: existing.length > 0 ? existing[0].id : null,
            amount: finalAmount,
            date: contributionDate,
            notes: notes || ''
          }, userName, status, tontines[0].name);

          sendEmail(userEmail, 'Contribution Status Updated - The Future', emailTemplate)
            .then(() => console.log(`Contribution status email sent to ${userEmail} (user ID: ${userId})`))
            .catch(err => console.error(`Failed to send contribution status email to ${userEmail} (user ID: ${userId}):`, err));
        }
      }

      return ResponseHelpers.sendSuccessResponse(res, null, 'Contributions saved successfully');
    } catch (error) {
      console.error('Error saving bulk contributions:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to save bulk contributions');
    }
  }
}

module.exports = ContributionsController;
