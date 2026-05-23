/**
 * Members Controller
 * Handles all member-related business logic
 */

const { 
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate
} = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');
const { THE_FUTURE_CONFIG } = require('../utils/theFutureConfig');
const { notifyMemberAddedToTontine } = require('../utils/memberNotificationHelpers');

class MembersController {
  constructor(db) {
    this.db = db;
  }

  // Get members for a tontine
  async getTontineMembers(req, res) {
    try {
      const { tontineId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      let whereClause = 'WHERE tm.tontine_id = ?';
      let params = [tontineId];

      if (status) {
        whereClause += ' AND tm.status = ?';
        params.push(status);
      }

      // Get members with user details
      const [members] = await this.db.execute(`
        SELECT tm.*, u.names, u.phone, u.email, u.role,
               COUNT(DISTINCT c.id) as contribution_count,
               COALESCE(SUM(CASE WHEN c.payment_status = 'Approved' THEN c.amount END), 0) as total_contributions
        FROM tontine_members tm 
        JOIN users u ON tm.user_id = u.id 
        LEFT JOIN contributions c ON tm.user_id = c.user_id AND tm.tontine_id = c.tontine_id
        ${whereClause}
        GROUP BY tm.id, tm.user_id, tm.tontine_id, tm.shares, tm.status, tm.created_at, 
                 u.names, u.phone, u.email, u.role
        ORDER BY tm.created_at ASC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM tontine_members tm 
        ${whereClause}
      `, params);

      // Decrypt user data
      const decryptedMembers = members.map(member => {
        try {
          return {
            ...member,
            names: member.names ? decryptUserData({ names: member.names }).names : member.names,
            phone: member.phone ? decryptUserData({ phone: member.phone }).phone : member.phone,
            email: member.email ? decryptUserData({ email: member.email }).email : member.email
          };
        } catch (error) {
          return member;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok({
        members: decryptedMembers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching tontine members:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch members'));
    }
  }

  // Join tontine (membership request)
  async joinTontine(req, res) {
    try {
      const { tontineId } = req.params;
      const { userId, user_id, shares = 1 } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;

      // Validate required fields
      if (!tontineId || !finalUserId) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine ID and user ID are required'));
      }

      // Validate IDs
      if (isNaN(tontineId) || isNaN(finalUserId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid IDs are required'));
      }

      // Check if tontine exists and is active
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [tontineId, 'active']
      );

      if (tontine.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine is not active or does not exist'));
      }

      // Check if user is already a member
      const [existingMember] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE tontine_id = ? AND user_id = ?',
        [tontineId, finalUserId]
      );

      if (existingMember.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User is already a member of this tontine'));
      }

      // Check if tontine is full
      const [memberCount] = await this.db.execute(
        'SELECT COUNT(*) as count FROM tontine_members WHERE tontine_id = ? AND status = ?',
        [tontineId, 'approved']
      );

      if (memberCount[0].count >= tontine[0].max_members) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine is full'));
      }

      // Add membership request (auto-approve for now)
      const [result] = await this.db.execute(`
        INSERT INTO tontine_members (tontine_id, user_id, shares, status, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [tontineId, finalUserId, shares, 'approved', getCurrentUTCDate()]);

      const { entryFee } = await notifyMemberAddedToTontine(this.db, {
        userId: finalUserId,
        tontineId
      });

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { 
          membershipId: result.insertId,
          entryFee
        },
        'Successfully joined tontine'
      ));

    } catch (error) {
      console.error('Error joining tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to join tontine'));
    }
  }

  // Update membership status (approve/reject)
  async updateMembershipStatus(req, res) {
    try {
      const { membershipId } = req.params;
      const { status, notes, processedBy, processed_by } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalProcessedBy = processedBy || processed_by;

      // Validate membershipId
      if (!membershipId || isNaN(membershipId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid membership ID is required'));
      }

      // Validate status
      if (!status || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required'));
      }

      // Get membership details
      const [memberships] = await this.db.execute(`
        SELECT tm.*, t.name as tontine_name
        FROM tontine_members tm 
        JOIN tontines t ON tm.tontine_id = t.id 
        WHERE tm.id = ?
      `, [membershipId]);

      if (memberships.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Update membership
      const [result] = await this.db.execute(
        'UPDATE tontine_members SET status = ? WHERE id = ?',
        [status, membershipId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Create notification for user
      const notificationType = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info';
      const notificationMessage = status === 'approved' 
        ? `Your membership request for "${memberships[0].tontine_name}" has been approved.`
        : status === 'rejected'
        ? `Your membership request for "${memberships[0].tontine_name}" has been rejected. ${notes || ''}`
        : `Your membership status has been updated to: ${status}`;

      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        memberships[0].user_id,
        'Membership Status Updated',
        notificationMessage,
        notificationType,
        getCurrentUTCDate()
      ]);

      return res.json(SUCCESS_RESPONSES.ok(null, 'Membership status updated successfully'));

    } catch (error) {
      console.error('Error updating membership status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update membership status'));
    }
  }

  // Calculate member's total contributions and refund amount (with 20% retention as per Article 8)
  async calculateRefundAmount(userId, tontineId) {
    // Get total approved contributions
    const [contributions] = await this.db.execute(`
      SELECT COALESCE(SUM(amount), 0) as total_contributions
      FROM contributions 
      WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'
    `, [userId, tontineId]);

    const totalContributions = parseFloat(contributions[0].total_contributions) || 0;

    // Get total outstanding loans
    const [loans] = await this.db.execute(`
      SELECT COALESCE(SUM(
        CASE WHEN status IN ('approved', 'disbursed') THEN amount ELSE 0 END
      ), 0) as total_loans
      FROM loans 
      WHERE user_id = ? AND tontine_id = ?
    `, [userId, tontineId]);

    const totalLoans = parseFloat(loans[0].total_loans) || 0;

    // Get total paid penalties
    const [penalties] = await this.db.execute(`
      SELECT COALESCE(SUM(
        CASE WHEN status = 'paid' THEN amount ELSE 0 END
      ), 0) as total_penalties
      FROM penalties 
      WHERE user_id = ? AND tontine_id = ?
    `, [userId, tontineId]);

    const totalPenalties = parseFloat(penalties[0].total_penalties) || 0;

    // Calculate net amount before retention
    const netAmount = totalContributions - totalLoans - totalPenalties;

    // Apply 20% retention as per Article 8
    const retentionRate = 0.20;
    const retentionAmount = netAmount * retentionRate;
    const refundAmount = netAmount - retentionAmount;

    return {
      totalContributions,
      totalLoans,
      totalPenalties,
      netAmount,
      retentionRate,
      retentionAmount,
      refundAmount: Math.max(0, refundAmount) // Ensure non-negative
    };
  }

  // Leave tontine (resignation with 20% retention as per Article 8)
  async leaveTontine(req, res) {
    try {
      const { membershipId } = req.params;
      const { reason, userId, user_id } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;

      // Validate membershipId
      if (!membershipId || isNaN(membershipId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid membership ID is required'));
      }

      // Get membership details
      const [memberships] = await this.db.execute(`
        SELECT tm.*, t.name as tontine_name
        FROM tontine_members tm 
        JOIN tontines t ON tm.tontine_id = t.id 
        WHERE tm.id = ? AND tm.user_id = ?
      `, [membershipId, finalUserId]);

      if (memberships.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Check if user has active loans
      const [activeLoans] = await this.db.execute(
        'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND tontine_id = ? AND status IN (?, ?)',
        [finalUserId, memberships[0].tontine_id, 'approved', 'disbursed']
      );

      if (activeLoans[0].count > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Cannot leave tontine with active loans'));
      }

      // Calculate refund amount with 20% retention (Article 8)
      const refundCalculation = await this.calculateRefundAmount(finalUserId, memberships[0].tontine_id);

      // Update membership status to left
      const [result] = await this.db.execute(
        'UPDATE tontine_members SET status = ? WHERE id = ?',
        ['left', membershipId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Create notification for admins
      const [admins] = await this.db.execute(
        'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = ?',
        [memberships[0].tontine_id, 'approved']
      );

      for (const admin of admins) {
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          admin.user_id,
          'Member Left Tontine',
          `A member has left "${memberships[0].tontine_name}". ${reason ? `Reason: ${reason}` : ''}. Refund amount: RWF ${refundCalculation.refundAmount.toLocaleString()} (20% retention: RWF ${refundCalculation.retentionAmount.toLocaleString()})`,
          'warning',
          getCurrentUTCDate()
        ]);
      }

      // Create notification for the leaving member
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        finalUserId,
        'Membership Ended',
        `Your membership in "${memberships[0].tontine_name}" has ended. Your refund of RWF ${refundCalculation.refundAmount.toLocaleString()} will be processed within 2 months as per the constitution.`,
        'info',
        getCurrentUTCDate()
      ]);

      return res.json(SUCCESS_RESPONSES.ok({
        refundCalculation,
        message: 'Left tontine successfully. Refund will be processed within 2 months.'
      }, 'Left tontine successfully'));

    } catch (error) {
      console.error('Error leaving tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to leave tontine'));
    }
  }

  // Remove member (admin only)
  async removeMember(req, res) {
    try {
      const { membershipId } = req.params;
      const { reason, removedBy, removed_by } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalRemovedBy = removedBy || removed_by;

      // Validate membershipId
      if (!membershipId || isNaN(membershipId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid membership ID is required'));
      }

      // Get membership details
      const [memberships] = await this.db.execute(`
        SELECT tm.*, t.name as tontine_name
        FROM tontine_members tm 
        JOIN tontines t ON tm.tontine_id = t.id 
        WHERE tm.id = ?
      `, [membershipId]);

      if (memberships.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      const membership = memberships[0];
      const { user_id, tontine_id } = membership;

      // Check for related records before deletion
      const [contributions] = await this.db.execute(
        'SELECT COUNT(*) as count FROM contributions WHERE user_id = ? AND tontine_id = ?',
        [user_id, tontine_id]
      );

      const [loans] = await this.db.execute(
        'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND tontine_id = ? AND status != ?',
        [user_id, tontine_id, 'Rejected']
      );

      const [payments] = await this.db.execute(
        'SELECT COUNT(*) as count FROM payments WHERE user_id = ? AND tontine_id = ? AND status != ?',
        [user_id, tontine_id, 'failed']
      );

      const [penalties] = await this.db.execute(
        'SELECT COUNT(*) as count FROM penalties WHERE user_id = ? AND tontine_id = ? AND status = ?',
        [user_id, tontine_id, 'pending']
      );

      const [meetings] = await this.db.execute(
        'SELECT COUNT(*) as count FROM meeting_attendance WHERE user_id = ? AND meeting_id IN (SELECT id FROM meetings WHERE tontine_id = ?)',
        [user_id, tontine_id]
      );

      // Build list of blockers
      const blockers = [];
      if (contributions[0].count > 0) blockers.push(`${contributions[0].count} contribution(s)`);
      if (loans[0].count > 0) blockers.push(`${loans[0].count} active loan(s)`);
      if (payments[0].count > 0) blockers.push(`${payments[0].count} pending payment(s)`);
      if (penalties[0].count > 0) blockers.push(`${penalties[0].count} pending penalty/penalties`);
      if (meetings[0].count > 0) blockers.push(`attendance in ${meetings[0].count} meeting(s)`);

      if (blockers.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation(
          `Cannot remove member. Please resolve related records first: ${blockers.join(', ')}`
        ));
      }

      // Actually DELETE the membership record (since no conflicts)
      const [result] = await this.db.execute(
        'DELETE FROM tontine_members WHERE id = ?',
        [membershipId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Create notification for user
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        user_id,
        'Removed from Tontine',
        `You have been removed from "${membership.tontine_name}". ${reason ? `Reason: ${reason}` : ''}`,
        'error',
        getCurrentUTCDate()
      ]);

      return res.json(SUCCESS_RESPONSES.ok(null, 'Member removed successfully'));

    } catch (error) {
      console.error('Error removing member:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to remove member'));
    }
  }

  // Update member shares
  async updateMemberShares(req, res) {
    try {
      const { membershipId } = req.params;
      const { shares, newShares, new_shares } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalShares = shares || newShares || new_shares;

      // Validate membershipId
      if (!membershipId || isNaN(membershipId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid membership ID is required'));
      }

      // Validate shares
      if (!shares || isNaN(shares) || shares < 1 || shares > 20) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid shares (1-20) are required'));
      }

      // Get membership details
      const [memberships] = await this.db.execute(`
        SELECT tm.*, t.name as tontine_name
        FROM tontine_members tm 
        JOIN tontines t ON tm.tontine_id = t.id 
        WHERE tm.id = ?
      `, [membershipId]);

      if (memberships.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      // Update shares
      const [result] = await this.db.execute(
        'UPDATE tontine_members SET shares = ? WHERE id = ?',
        [finalShares, membershipId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Membership not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Member shares updated successfully'));

    } catch (error) {
      console.error('Error updating member shares:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update member shares'));
    }
  }

  // Get membership statistics for tontine
  async getMembershipStats(req, res) {
    try {
      const { tontineId } = req.params;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Get membership statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_members,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as active_members,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_members,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_members,
          SUM(CASE WHEN status = 'left' THEN 1 ELSE 0 END) as left_members,
          SUM(CASE WHEN status = 'removed' THEN 1 ELSE 0 END) as removed_members,
          SUM(shares) as total_shares
        FROM tontine_members 
        WHERE tontine_id = ?
      `, [tontineId]);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || {
        total_members: 0,
        active_members: 0,
        pending_members: 0,
        suspended_members: 0,
        left_members: 0,
        removed_members: 0,
        total_shares: 0
      }));

    } catch (error) {
      console.error('Error fetching membership stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch membership statistics'));
    }
  }
}

module.exports = MembersController;
