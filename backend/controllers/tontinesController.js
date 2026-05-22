/**
 * Tontines Controller
 * Handles all tontine-related business logic with consolidated endpoints
 */

const { 
  validateNames,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate
} = require('../utils/common');
const { encryptUserData, decryptUserData } = require('../utils/encryption');
const DatabaseHelpers = require('../utils/databaseHelpers');
const ResponseHelpers = require('../utils/responseHelpers');

class TontinesController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  // Helper method to decrypt user data in arrays
  decryptUsersInArray(users) {
    if (!Array.isArray(users)) return users;
    return users.map(user => ({
      ...user,
      creator_name: user.creator_name ? decryptUserData({names: user.creator_name}).names : user.creator_name,
      names: user.names ? decryptUserData(user).names : user.names
    }));
  }

  // Consolidated tontines endpoint with query parameters
  async getTontines(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search, 
        tontineId,
        userId,
        includeMembers = false,
        includeStats = false 
      } = req.query;

      // Note: tontineId should be handled by separate getTontineById method
      // because list returns aggregated data while single returns detailed data with members

      // Build where clause and params
      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (t.name LIKE ? OR t.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (userId) {
        whereClause += ' AND EXISTS (SELECT 1 FROM tontine_members tm WHERE tm.tontine_id = t.id AND tm.user_id = ? AND tm.status = ?)';
        params.push(userId, 'approved');
      }

      // Build complete query with proper clause ordering (JOINs before WHERE)
      const joinClause = `LEFT JOIN users u ON t.creator_id = u.id
        LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
        LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
        LEFT JOIN tontines parent_t ON t.parent_id = parent_t.id`;

      const groupByClause = 'GROUP BY t.id';

      const offset = (page - 1) * limit;

      // Get data with proper clause ordering - include parent tontine name for branch identification
      const dataQuery = `SELECT t.*, u.names as creator_name, COUNT(DISTINCT tm.user_id) as member_count, 
        COALESCE(SUM(c.amount), 0) as total_contributions,
        CASE WHEN t.parent_id IS NULL THEN 'main' ELSE 'branch' END as tontine_type,
        parent_t.name as parent_tontine_name
        FROM tontines t
        ${joinClause}
        ${whereClause}
        ${groupByClause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?`;

      const [data] = await this.db.execute(dataQuery, [...params, parseInt(limit), offset]);

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT t.id) as total FROM tontines t ${joinClause} ${whereClause}`;
      const [countResult] = await this.db.execute(countQuery, params);
      const total = countResult[0].total;

      const result = {
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Decrypt user data
      const decryptedTontines = this.decryptUsersInArray(result.data);

      // Include members if requested
      if (includeMembers === 'true') {
        const tontinesWithMembers = await Promise.all(
          decryptedTontines.map(async (tontine) => {
            const [members] = await this.db.execute(`
              SELECT tm.*, u.names, u.phone, u.email
              FROM tontine_members tm 
              JOIN users u ON tm.user_id = u.id 
              WHERE tm.tontine_id = ? AND tm.status = ?
              ORDER BY tm.created_at ASC
            `, [tontine.id, 'approved']);
            
            return { ...tontine, members };
          })
        );
        result.data = tontinesWithMembers;
      } else {
        result.data = decryptedTontines;
      }

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, result.pagination));

    } catch (error) {
      console.error('Error fetching tontines:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch tontines');
    }
  }

  // Get tontine by ID (used by consolidated endpoint)
  async getTontineById(req, res) {
    try {
      const { id } = req.params;

      // Validate id
      if (!id || isNaN(id)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid tontine ID is required');
      }

      // Get tontine with details
      const [tontines] = await this.db.execute(`
        SELECT t.*, u.names as creator_name, 
               COUNT(DISTINCT tm.user_id) as member_count,
               COALESCE(SUM(c.amount), 0) as total_contributions
        FROM tontines t 
        LEFT JOIN users u ON t.creator_id = u.id 
        LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
        LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
        WHERE t.id = ?
        GROUP BY t.id, t.name, t.description, t.contribution_amount, t.contribution_frequency, 
                 t.max_members, t.creator_id, t.start_date, t.end_date, t.status, t.created_at, u.names
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM tontines t 
        ${whereClause}
      `, params);

      // Decrypt user names
      const decryptedTontines = this.decryptUsersInArray(tontines);

      return res.json(SUCCESS_RESPONSES.ok({
        tontines: decryptedTontines,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching all tontines:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch tontines'));
    }
  }

  // Get tontine by ID
  async getTontineById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Get tontine with details - include parent tontine info for branch identification
      const [tontines] = await this.db.execute(`
        SELECT t.*, u.names as creator_name,
               COUNT(DISTINCT tm.user_id) as member_count,
               COALESCE(SUM(c.amount), 0) as total_contributions,
               CASE WHEN t.parent_id IS NULL THEN 'main' ELSE 'branch' END as tontine_type,
               parent_t.name as parent_tontine_name
        FROM tontines t 
        LEFT JOIN users u ON t.creator_id = u.id 
        LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
        LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
        LEFT JOIN tontines parent_t ON t.parent_id = parent_t.id
        WHERE t.id = ?
        GROUP BY t.id, t.name, t.description, t.contribution_amount, t.contribution_frequency, 
                 t.max_members, t.creator_id, t.start_date, t.end_date, t.status, t.created_at, u.names
      `, [id]);

      if (tontines.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      // Decrypt user names
      const decryptedTontine = this.decryptUsersInArray(tontines)[0];

      // Get members
      const [members] = await this.db.execute(`
        SELECT tm.*, u.names, u.phone, u.email
        FROM tontine_members tm 
        JOIN users u ON tm.user_id = u.id 
        WHERE tm.tontine_id = ? AND tm.status = 'approved'
        ORDER BY tm.created_at ASC
      `, [id]);

      // Decrypt member data
      const decryptedMembers = members.map(member => {
        try {
          return {
            ...member,
            names: decryptUserData({ names: member.names }).names,
            phone: decryptUserData({ phone: member.phone }).phone,
            email: decryptUserData({ email: member.email }).email
          };
        } catch (error) {
          return member;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok({
        ...decryptedTontine,
        members: decryptedMembers
      }));

    } catch (error) {
      console.error('Error fetching tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch tontine'));
    }
  }

  // Create tontine
  async createTontine(req, res) {
    try {
      const { name, description, contributionAmount, contribution_amount, contributionFrequency, maxMembers, max_members, startDate, start_date, endDate, end_date, parent_id } = req.body;
      
      // Use authenticated user as creator; ignore creator_id from the request body
      const finalCreatorId = Number(req.user?.userId);
      
      // Support both camelCase and snake_case field names
      const finalDescription = description || null;
      const finalContributionAmount = Number(contributionAmount || contribution_amount) || null;
      const finalMaxMembers = Number(maxMembers || max_members) || null;
      const finalStartDate = startDate || start_date || null;
      const finalEndDate = endDate || end_date || null;

      // Validate required fields
      if (!name) {
        return res.status(400).json(ERROR_RESPONSES.validation('Name is required'));
      }

      if (!finalCreatorId || isNaN(finalCreatorId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Authenticated creator ID is required'));
      }

      // Validate name
      const nameValidation = validateNames(name);
      if (!nameValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(nameValidation.message));
      }

      // Validate contribution amount
      if (!finalContributionAmount || isNaN(finalContributionAmount) || finalContributionAmount <= 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid contribution amount is required'));
      }

      // Validate max members
      if (!finalMaxMembers || isNaN(finalMaxMembers) || finalMaxMembers < 2 || finalMaxMembers > 50) {
        return res.status(400).json(ERROR_RESPONSES.validation('Max members must be between 2 and 50'));
      }

      // Check if creator exists and is admin, president, or accountant
      const [creator] = await this.db.execute(
        'SELECT * FROM users WHERE id = ? AND role IN (?, ?, ?)',
        [finalCreatorId, 'admin', 'president', 'accountant']
      );

      if (creator.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Only admins, presidents, and accountants can create tontines');
      }

      // Determine parent_id: If not provided, find the root tontine ("The Future") and use it as parent
      // This ensures all new tontines are branches of the main tontine
      let finalParentId = parent_id || null;
      if (finalParentId === null) {
        // Find the root tontine (the one with no parent)
        const [rootTontines] = await this.db.execute(
          'SELECT id FROM tontines WHERE parent_id IS NULL LIMIT 1'
        );
        if (rootTontines.length > 0) {
          finalParentId = rootTontines[0].id;
        }
        // If no root tontine exists, this will be the root (finalParentId stays null)
      }

      // Insert tontine (set as active immediately)
      const finalContributionFreq = contributionFrequency || 'monthly';
      const [result] = await this.db.execute(`
        INSERT INTO tontines (name, description, contribution_amount, contribution_frequency, max_members, creator_id, parent_id, start_date, end_date, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [name, finalDescription, finalContributionAmount, finalContributionFreq, finalMaxMembers, finalCreatorId, finalParentId, finalStartDate, finalEndDate, 'active', getCurrentUTCDate()]);

      // Add creator as first member
      await this.db.execute(`
        INSERT INTO tontine_members (tontine_id, user_id, shares, status, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [result.insertId, finalCreatorId, 1, 'approved', getCurrentUTCDate()]);

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { tontineId: result.insertId },
        'Tontine created successfully'
      ));

    } catch (error) {
      console.error('Error creating tontine:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return ResponseHelpers.sendValidationResponse(
          res,
          'A tontine with this name already exists. Please choose a different name.'
        );
      }

      return res.status(500).json(ERROR_RESPONSES.server('Failed to create tontine'));
    }
  }

  // Update tontine
  async updateTontine(req, res) {
    try {
      const { id } = req.params;
      const { name, description, contributionAmount, contribution_amount, contributionFrequency, contribution_frequency, maxMembers, max_members, startDate, start_date, endDate, end_date, status } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalDescription = description || null;
      const finalContributionAmount = Number(contributionAmount || contribution_amount) || null;
      const finalContributionFrequency = contributionFrequency || contribution_frequency || null;
      const finalMaxMembers = Number(maxMembers || max_members) || null;
      const finalStartDate = startDate || start_date || null;
      const finalEndDate = endDate || end_date || null;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Validate name if provided
      if (name) {
        const nameValidation = validateNames(name);
        if (!nameValidation.valid) {
          return res.status(400).json(ERROR_RESPONSES.validation(nameValidation.message));
        }
      }

      // Validate status if provided
      if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required (active, inactive)'));
      }

      // Check if tontine exists
      const [existing] = await this.db.execute('SELECT * FROM tontines WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      // Update tontine - ensure all parameters are defined (not undefined)
      const safeName = name !== undefined ? name : null;
      const safeDescription = finalDescription !== undefined ? finalDescription : null;
      const safeContributionAmount = finalContributionAmount !== undefined ? finalContributionAmount : null;
      const safeContributionFrequency = finalContributionFrequency !== undefined ? finalContributionFrequency : null;
      const safeMaxMembers = finalMaxMembers !== undefined ? finalMaxMembers : null;
      const safeStartDate = finalStartDate !== undefined ? finalStartDate : null;
      const safeEndDate = finalEndDate !== undefined ? finalEndDate : null;
      const safeStatus = status !== undefined ? status : null;
      
      const [result] = await this.db.execute(`
        UPDATE tontines 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            contribution_amount = COALESCE(?, contribution_amount),
            contribution_frequency = COALESCE(?, contribution_frequency),
            max_members = COALESCE(?, max_members),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            status = COALESCE(?, status)
        WHERE id = ?
      `, [safeName, safeDescription, safeContributionAmount, safeContributionFrequency, safeMaxMembers, safeStartDate, safeEndDate, safeStatus, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Tontine updated successfully'));

    } catch (error) {
      console.error('Error updating tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update tontine'));
    }
  }

  // Update tontine status
  async updateTontineStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, userId } = req.body;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Validate status
      if (!status || !['active', 'inactive'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required (active, inactive)'));
      }

      // Check if tontine exists
      const [existing] = await this.db.execute('SELECT * FROM tontines WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      // Update tontine status
      const [result] = await this.db.execute(
        'UPDATE tontines SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      // Create notification for all members
      if (status === 'active') {
        const [members] = await this.db.execute(
          'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = ?',
          [id, 'approved']
        );

        for (const member of members) {
          await this.db.execute(`
            INSERT INTO notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, ?, ?)
          `, [
            member.user_id,
            'Tontine Activated',
            `The tontine "${existing[0].name}" has been activated. You can now start making contributions.`,
            'success',
            getCurrentUTCDate()
          ]);
        }
      }

      return res.json(SUCCESS_RESPONSES.ok(null, `Tontine ${status} successfully`));

    } catch (error) {
      console.error('Error updating tontine status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update tontine status'));
    }
  }

  // Delete tontine
  async deleteTontine(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Check if tontine has any related records
      const [relatedRecords] = await this.db.execute(`
        SELECT
          (SELECT COUNT(*) FROM tontine_members WHERE tontine_id = ?) as membership_count,
          (SELECT COUNT(*) FROM contributions WHERE tontine_id = ?) as contribution_count,
          (SELECT COUNT(*) FROM loans WHERE tontine_id = ?) as loan_count,
          (SELECT COUNT(*) FROM payments WHERE tontine_id = ?) as payment_count,
          (SELECT COUNT(*) FROM penalties WHERE tontine_id = ?) as penalty_count,
          (SELECT COUNT(*) FROM meetings WHERE tontine_id = ?) as meeting_count
      `, [id, id, id, id, id, id]);

      const counts = relatedRecords[0];
      const blockers = [];
      if (counts.membership_count > 0) blockers.push(`${counts.membership_count} membership record(s)`);
      if (counts.contribution_count > 0) blockers.push(`${counts.contribution_count} contribution record(s)`);
      if (counts.loan_count > 0) blockers.push(`${counts.loan_count} loan record(s)`);
      if (counts.payment_count > 0) blockers.push(`${counts.payment_count} payment record(s)`);
      if (counts.penalty_count > 0) blockers.push(`${counts.penalty_count} penalty record(s)`);
      if (counts.meeting_count > 0) blockers.push(`${counts.meeting_count} meeting record(s)`);

      if (blockers.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation(
          `Cannot delete tontine because related records exist: ${blockers.join(', ')}`
        ));
      }

      // Delete tontine
      const [result] = await this.db.execute('DELETE FROM tontines WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Tontine not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Tontine deleted successfully'));

    } catch (error) {
      console.error('Error deleting tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete tontine'));
    }
  }

  // Join tontine
  async joinTontine(req, res) {
    try {
      const { id } = req.params;
      const { userId, shares = 1 } = req.body;

      // Validate ID and userId
      if (!id || isNaN(id) || !userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID and user ID are required'));
      }

      // Check if tontine exists and is active
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [id, 'active']
      );

      if (tontine.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine is not active or does not exist'));
      }

      // Check if user is already a member
      const [existingMember] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE tontine_id = ? AND user_id = ?',
        [id, userId]
      );

      if (existingMember.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User is already a member of this tontine'));
      }

      // Check if tontine is full
      const [memberCount] = await this.db.execute(
        'SELECT COUNT(*) as count FROM tontine_members WHERE tontine_id = ? AND status = ?',
        [id, 'approved']
      );

      if (memberCount[0].count >= tontine[0].max_members) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine is full'));
      }

      // Add member (auto-approve)
      const [result] = await this.db.execute(`
        INSERT INTO tontine_members (tontine_id, user_id, shares, status, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [id, userId, shares, 'approved', getCurrentUTCDate()]);

      // Create notification for user
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        'Joined Tontine',
        `You have successfully joined "${tontine[0].name}". You can now start making contributions.`,
        'success',
        getCurrentUTCDate()
      ]);

      // Create notification for admins
      const [admins] = await this.db.execute(
        'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = ?',
        [id, 'approved']
      );

      for (const admin of admins) {
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          admin.user_id,
          'New Membership Request',
          `A new member has requested to join "${tontine[0].name}". Please review and approve.`,
          'info',
          getCurrentUTCDate()
        ]);
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { membershipId: result.insertId },
        'Successfully joined tontine'
      ));

    } catch (error) {
      console.error('Error joining tontine:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to join tontine'));
    }
  }

  // Get user's tontines
  async getUserTontines(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Get user's tontines
      const [tontines] = await this.db.execute(`
        SELECT t.*, tm.shares, tm.status as membership_status, tm.created_at as joined_at
        FROM tontines t 
        JOIN tontine_members tm ON t.id = tm.tontine_id 
        WHERE tm.user_id = ?
        ORDER BY t.created_at DESC
      `, [userId]);

      return res.json(SUCCESS_RESPONSES.ok(tontines));

    } catch (error) {
      console.error('Error fetching user tontines:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch user tontines'));
    }
  }
}

module.exports = TontinesController;
