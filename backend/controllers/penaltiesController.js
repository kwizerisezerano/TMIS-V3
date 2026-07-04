/**
 * Penalties Controller
 * Handles all penalty-related business logic
 */

const { 
  STATUS,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  getCurrentUTCDate
} = require('../utils/common');
const ResponseHelpers = require('../utils/responseHelpers');
const { getPenaltyStatusUpdatedTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/email');

class PenaltiesController {
  constructor(db) {
    this.db = db;
  }

  // Helper method to decrypt user data in arrays
  decryptUsersInPenalties(penalties) {
    if (!Array.isArray(penalties)) return penalties;
    const { decryptUserData } = require('../utils/encryption');
    return penalties.map(penalty => ({
      ...penalty,
      user_name: penalty.user_name ? decryptUserData({ names: penalty.user_name }).names : penalty.user_name,
      user_phone: penalty.user_phone ? decryptUserData({ phone: penalty.user_phone }).phone : penalty.user_phone
    }));
  }

  // Consolidated penalties endpoint
  async getPenalties(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        tontineId, 
        userId
      } = req.query;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      if (tontineId) {
        whereClause += ' AND p.tontine_id = ?';
        params.push(tontineId);
      }

      if (userId) {
        whereClause += ' AND p.user_id = ?';
        params.push(userId);
      }

      const offset = (page - 1) * limit;

      // Get penalties with user and tontine details
      const [penalties] = await this.db.execute(`
        SELECT p.*, u.names as user_name, u.phone as user_phone, t.name as tontine_name 
        FROM penalties p 
        JOIN users u ON p.user_id = u.id 
        JOIN tontines t ON p.tontine_id = t.id 
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Decrypt user data
      const decryptedPenalties = this.decryptUsersInPenalties(penalties);

      return res.json(SUCCESS_RESPONSES.ok(decryptedPenalties));

    } catch (error) {
      console.error('Error fetching penalties:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalties'));
    }
  }

  // Get penalties for a specific user
  async getUserPenalties(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Get penalties with user and tontine details
      const [penalties] = await this.db.execute(`
        SELECT p.*, u.names as user_name, t.name as tontine_name 
        FROM penalties p 
        JOIN users u ON p.user_id = u.id 
        JOIN tontines t ON p.tontine_id = t.id 
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
      `, [userId]);

      // Decrypt user data
      const { decryptUserData } = require('../utils/encryption');
      const decryptedPenalties = penalties.map(penalty => {
        try {
          const decryptedUser = decryptUserData({ names: penalty.user_name });
          return {
            ...penalty,
            user_name: decryptedUser.names
          };
        } catch (error) {
          return penalty;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok(decryptedPenalties));

    } catch (error) {
      console.error('Error fetching user penalties:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalties'));
    }
  }

  // Get penalties for a tontine (admin management)
  async getTontinePenalties(req, res) {
    try {
      const { tontineId } = req.params;

      console.log('=== BACKEND getTontinePenalties DEBUG ===');
      console.log('tontineId:', tontineId);

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Get penalties with user details
      const [penalties] = await this.db.execute(`
        SELECT p.*, u.names as user_name, u.phone as user_phone 
        FROM penalties p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.tontine_id = ? 
        ORDER BY p.created_at DESC
      `, [tontineId]);

      console.log('Raw penalties from DB:', penalties);

      // Decrypt user data
      const { decryptUserData } = require('../utils/encryption');
      const decryptedPenalties = penalties.map(penalty => {
        try {
          const decryptedUser = decryptUserData({ 
            names: penalty.user_name, 
            phone: penalty.user_phone 
          });
          return {
            ...penalty,
            user_name: decryptedUser.names,
            user_phone: decryptedUser.phone
          };
        } catch (error) {
          return penalty;
        }
      });

      console.log('Decrypted penalties:', decryptedPenalties);
      console.log('Returning response:', SUCCESS_RESPONSES.ok(decryptedPenalties));

      return res.json(SUCCESS_RESPONSES.ok(decryptedPenalties));

    } catch (error) {
      console.error('Error fetching tontine penalties:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalties'));
    }
  }

  // Apply penalty to user
  async applyPenalty(req, res) {
    try {
      const { userId, tontineId, type, amount, reason } = req.body;

      // Support both camelCase and snake_case field names
      const finalAmount = amount !== undefined ? parseFloat(amount) : null;

      // Validate required fields
      if (!userId || !tontineId || !type || !finalAmount || !reason) {
        return res.status(400).json(ERROR_RESPONSES.validation('All fields are required'));
      }

      // Validate amount
      if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid penalty amount is required'));
      }

      // Check if user is member of tontine
      const [membership] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE user_id = ? AND tontine_id = ?',
        [userId, tontineId]
      );

      if (membership.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User is not a member of this tontine'));
      }

      // Insert penalty
      const [result] = await this.db.execute(`
        INSERT INTO penalties (user_id, tontine_id, type, amount, reason, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, tontineId, type, finalAmount, reason, STATUS.PENDING, getCurrentUTCDate()]);

      // Create notification for user
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        'New Penalty Applied',
        `A penalty of RWF ${finalAmount} has been applied to your account. Reason: ${reason}`,
        'penalty',
        getCurrentUTCDate()
      ]);

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { penaltyId: result.insertId },
        'Penalty applied successfully'
      ));

    } catch (error) {
      console.error('Error applying penalty:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to apply penalty'));
    }
  }

  // Update penalty status (mark as paid)
  async updatePenaltyStatus(req, res) {
    try {
      const { penaltyId } = req.params;
      const { status } = req.body;

      // Validate penaltyId
      if (!penaltyId || isNaN(penaltyId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid penalty ID is required'));
      }

      // Validate status
      if (!status || !['pending', 'paid', 'waived'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required (pending, paid, waived)'));
      }

      // Get penalty details first
      const [penalty] = await this.db.execute(
        'SELECT * FROM penalties WHERE id = ?',
        [penaltyId]
      );

      if (penalty.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Penalty not found'));
      }

      // Check if status is actually changing
      const oldStatus = penalty[0].status;
      const newStatus = status;

      if (oldStatus === newStatus) {
        // No status change, just return success
        return res.json(SUCCESS_RESPONSES.ok(null, 'Penalty status is already ' + status));
      }

      // Update penalty
      await this.db.execute(
        'UPDATE penalties SET status = ?, paid_at = ? WHERE id = ?',
        [status, status === 'paid' ? getCurrentUTCDate() : null, penaltyId]
      );

      // Create payment record in payments table for any status
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const transactionRef = `PENALTY-PAY-ADMIN-${Date.now()}-${penalty[0].user_id}-${penaltyId}-${randomSuffix}`;
      
      // Map penalty status to payment status
      let paymentStatus = 'pending';
      if (status === 'paid') paymentStatus = 'completed';
      else if (status === 'waived') paymentStatus = 'cancelled';

      await this.db.execute(
        `INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [penalty[0].user_id, penalty[0].tontine_id, 'penalty', penalty[0].amount, 'manual', JSON.stringify({ penaltyId: penaltyId, reason: penalty[0].reason }), paymentStatus, transactionRef, getCurrentUTCDate()]
      );

      if (penalty.length > 0) {
        // Create notification for user
        const notificationType = status === 'paid' ? 'success' : 'info';
        const notificationMessage = status === 'paid' 
          ? `Your penalty of RWF ${penalty[0].amount} has been marked as paid.`
          : `Your penalty status has been updated to: ${status}`;

        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          penalty[0].user_id,
          'Penalty Status Updated',
          notificationMessage,
          notificationType,
          getCurrentUTCDate()
        ]);

        // Send email for ALL statuses
        const [users] = await this.db.execute(
          'SELECT names, email FROM users WHERE id = ?',
          [penalty[0].user_id]
        );

        if (users.length > 0) {
          const { decryptUserData } = require('../utils/encryption');
          let userName = users[0].names;
          let userEmail = users[0].email;
          try {
            const decryptedUser = decryptUserData({ names: userName, email: userEmail });
            userName = decryptedUser.names;
            userEmail = decryptedUser.email;
          } catch (e) {
            // If decryption fails, use original values
          }

          // Send email
          const emailTemplate = getPenaltyStatusUpdatedTemplate({
            penaltyId: penalty[0].id,
            amount: penalty[0].amount,
            reason: penalty[0].reason
          }, userName, status);

          sendEmail(userEmail, 'Penalty Status Updated - The Future', emailTemplate)
            .then(() => console.log(`Penalty status email sent to ${userEmail} (user ID: ${penalty[0].user_id})`))
            .catch(err => console.error(`Failed to send penalty status email to ${userEmail} (user ID: ${penalty[0].user_id}):`, err));
        }
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Penalty status updated successfully'));

    } catch (error) {
      console.error('Error updating penalty status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update penalty status'));
    }
  }

  // Delete penalty (admin only)
  async deletePenalty(req, res) {
    try {
      const { penaltyId } = req.params;

      // Validate penaltyId
      if (!penaltyId || isNaN(penaltyId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid penalty ID is required'));
      }

      // Delete penalty
      const [result] = await this.db.execute('DELETE FROM penalties WHERE id = ?', [penaltyId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Penalty not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Penalty deleted successfully'));

    } catch (error) {
      console.error('Error deleting penalty:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete penalty'));
    }
  }

  // Get penalty statistics for a user
  async getUserPenaltyStats(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Get penalty statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_penalties,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM penalties 
        WHERE user_id = ?
      `, [userId]);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || { 
        total_penalties: 0, 
        pending_amount: 0, 
        paid_amount: 0, 
        pending_count: 0 
      }));

    } catch (error) {
      console.error('Error fetching penalty stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalty stats'));
    }
  }

  // Get penalty statistics for a tontine
  async getTontinePenaltyStats(req, res) {
    try {
      const { tontineId } = req.params;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Get penalty statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_penalties,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count
        FROM penalties 
        WHERE tontine_id = ?
      `, [tontineId]);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || { 
        total_penalties: 0, 
        pending_amount: 0, 
        paid_amount: 0, 
        pending_count: 0,
        paid_count: 0
      }));

    } catch (error) {
      console.error('Error fetching tontine penalty stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalty stats'));
    }
  }

  // Get all penalties with pagination (admin)
  async getAllPenalties(req, res) {
    try {
      const { page = 1, limit = 20, status, tontineId } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      if (tontineId) {
        whereClause += ' AND p.tontine_id = ?';
        params.push(tontineId);
      }

      // Get penalties with user and tontine details
      const [penalties] = await this.db.execute(`
        SELECT p.*, u.names as user_name, u.phone as user_phone, t.name as tontine_name 
        FROM penalties p 
        JOIN users u ON p.user_id = u.id 
        JOIN tontines t ON p.tontine_id = t.id 
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM penalties p 
        ${whereClause}
      `, params);

      // Decrypt user data
      const { decryptUserData } = require('../utils/encryption');
      const decryptedPenalties = penalties.map(penalty => {
        try {
          const decryptedUser = decryptUserData({ 
            names: penalty.user_name, 
            phone: penalty.user_phone 
          });
          return {
            ...penalty,
            user_name: decryptedUser.names,
            user_phone: decryptedUser.phone
          };
        } catch (error) {
          return penalty;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok({
        penalties: decryptedPenalties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching all penalties:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch penalties'));
    }
  }

  // Record bulk manual penalty payments (admin only)
  async recordBulkPenaltyPayments(req, res) {
    try {
      const { tontineId } = req.params;
      const { payments, paymentDate } = req.body;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid tontine ID is required');
      }

      // Check if tontine exists
      const [tontines] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ?',
        [tontineId]
      );

      if (tontines.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }

      // Validate paymentDate
      if (!paymentDate) {
        return ResponseHelpers.sendValidationResponse(res, 'Payment date is required');
      }

      // Validate payments array
      if (!Array.isArray(payments)) {
        return ResponseHelpers.sendValidationResponse(res, 'Payments must be an array');
      }

      const { decryptUserData } = require('../utils/encryption');

      // Process each penalty payment
      for (const payment of payments) {
        const { userId, penaltyId, status, notes } = payment;

        if (!userId || isNaN(userId) || !penaltyId || isNaN(penaltyId)) {
          continue; // Skip invalid user/penalty ids
        }

        // Check if penalty exists and belongs to user in this tontine
        const [penalties] = await this.db.execute(
          'SELECT * FROM penalties WHERE id = ? AND user_id = ? AND tontine_id = ?',
          [penaltyId, userId, tontineId]
        );

        if (penalties.length === 0) {
          continue; // Skip if penalty not found
        }

        const penalty = penalties[0];

        // Update penalty status
        await this.db.execute(
          'UPDATE penalties SET status = ?, paid_at = ? WHERE id = ?',
          [status, status === 'paid' ? getCurrentUTCDate() : null, penaltyId]
        );

        // Create payment record in payments table for any status
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const transactionRef = `PENALTY-PAY-ADMIN-${Date.now()}-${userId}-${penaltyId}-${randomSuffix}`;
        
        // Map penalty status to payment status
        let paymentStatus = 'pending';
        if (status === 'paid') paymentStatus = 'completed';
        else if (status === 'waived') paymentStatus = 'cancelled';

        await this.db.execute(
          `INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, tontineId, 'penalty', penalty.amount, 'manual', JSON.stringify({ notes: notes || '', penaltyId: penaltyId, reason: penalty.reason }), paymentStatus, transactionRef, getCurrentUTCDate()]
        );

        // Create in-app notification for ALL statuses
        const notificationTitle = 'Penalty Status Updated';
        const notificationMessage = `An administrator has updated your penalty status to ${status} on ${paymentDate}.${notes ? ' Notes: ' + notes : ''}`;
        
        await this.db.execute(
          `INSERT INTO notifications (user_id, title, message, type, created_at) 
           VALUES (?, ?, ?, 'penalty', ?)`,
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

          const emailTemplate = getPenaltyStatusUpdatedTemplate({
            penaltyId: penaltyId,
            amount: penalty.amount,
            reason: penalty.reason,
            notes: notes || ''
          }, userName, status);

          sendEmail(userEmail, 'Penalty Status Updated - The Future', emailTemplate)
            .then(() => console.log(`Penalty status email sent to ${userEmail} (user ID: ${userId})`))
            .catch(err => console.error(`Failed to send penalty status email to ${userEmail} (user ID: ${userId}):`, err));
        }
      }

      return ResponseHelpers.sendSuccessResponse(res, null, 'Penalty payments saved successfully');
    } catch (error) {
      console.error('Error saving manual penalty payments:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to save penalty payments');
    }
  }
}

module.exports = PenaltiesController;
