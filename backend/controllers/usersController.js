/**
 * Users Controller
 * Handles all user-related business logic with consistent patterns
 */

const bcrypt = require('bcryptjs');
const { 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validateNames,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  USER_ROLES,
  getCurrentUTCDate
} = require('../utils/common');
const { encryptUserData, decryptUserData } = require('../utils/encryption');
const { findUserByEmail } = require('../utils/emailLookup');
const { getWelcomeTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/email');
const { notifyMemberAddedToTontine } = require('../utils/memberNotificationHelpers');

class UsersController {
  constructor(db) {
    this.db = db;
  }

  // Single users endpoint with query parameters
  async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        search, 
        userId: queryUserId,
        includeProfile = false 
      } = req.query;

      // Check for userId in URL params or query params
      const userId = req.params.userId || queryUserId

      // If specific userId requested, handle single user in same method
      if (userId) {
        // Validate userId
        if (!userId || isNaN(userId)) {
          return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
        }

        // Get user data
        const [user] = await this.db.execute(
          'SELECT id, names, email, phone, role, email_verified, id_number, created_at FROM users WHERE id = ?',
          [userId]
        );
        
        if (!user) {
          return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
        }

        // Decrypt user data
        const decryptedUser = decryptUserData(user);

        // Include profile details if requested
        if (includeProfile === 'true') {
          const stats = await this.getUserStats(userId);
          return res.json(SUCCESS_RESPONSES.ok({ ...decryptedUser, stats }, 'User fetched successfully'));
        }

        return res.json(SUCCESS_RESPONSES.ok(decryptedUser, 'User fetched successfully'));
      }

      // Build where clause and parameters
      let whereClause = '';
      let params = [];
      
      if (role) {
        whereClause += ' WHERE role = ?';
        params.push(role);
      }
      
      if (search) {
        whereClause += whereClause ? ' AND names LIKE ?' : ' WHERE names LIKE ?';
        params.push(`%${search}%`);
      }

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Get paginated results
      const [users] = await this.db.execute(
        `SELECT id, names, email, phone, role, email_verified, created_at 
         FROM users${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
      
      // Get total count
      const [countResult] = await this.db.execute(
        `SELECT COUNT(*) as total FROM users${whereClause}`,
        params
      );
      
      const result = {
        data: users,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };

      // Decrypt user data
      const decryptedUsers = result.data.map(user => {
        try {
          return decryptUserData(user);
        } catch (error) {
          console.error('Error decrypting user data:', error);
          return user;
        }
      });

      // Include profile details if requested
      if (includeProfile === 'true') {
        const usersWithProfiles = await Promise.all(
          decryptedUsers.map(async (user) => {
            const stats = await this.getUserStats(user.id);
            return { ...user, stats };
          })
        );
        result.data = usersWithProfiles;
      } else {
        result.data = decryptedUsers;
      }

      return res.json(SUCCESS_RESPONSES.ok(result.data, 'Users fetched successfully', result.pagination));

    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch users'));
    }
  }

  
  // Helper method to get user stats
  async getUserStats(userId) {
    try {
      const [contribStats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_contributions,
          SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_contributed
        FROM contributions 
        WHERE user_id = ? AND payment_status = 'Approved'
      `, [userId]);

      const [loanStats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_loans,
          SUM(CASE WHEN status IN ('approved', 'disbursed') THEN loan_amount ELSE 0 END) as total_borrowed
        FROM loans 
        WHERE user_id = ? AND status IN ('approved', 'disbursed')
      `, [userId]);

      return {
        contributions: contribStats[0] || { total_contributions: 0, total_contributed: 0 },
        loans: loanStats[0] || { total_loans: 0, total_borrowed: 0 }
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { contributions: { total_contributions: 0, total_contributed: 0 }, loans: { total_loans: 0, total_borrowed: 0 } };
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const { names, phone, id_number } = req.body;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Validate input
      if (names) {
        const nameValidation = validateNames(names);
        if (!nameValidation.valid) {
          return res.status(400).json(ERROR_RESPONSES.validation(nameValidation.message));
        }
      }

      if (phone) {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
          return res.status(400).json(ERROR_RESPONSES.validation(phoneValidation.message));
        }
      }

      // Check if user exists
      const [existingUsers] = await this.db.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (existingUsers.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      // Get current user data for encryption
      const currentUser = decryptUserData(existingUsers[0]);

      // Check for duplicate phone if phone is being updated
      if (phone && phone !== currentUser.phone) {
        const [phoneCheck] = await this.db.execute(
          'SELECT id FROM users WHERE phone = ? AND id != ?',
          [phone, userId]
        );

        if (phoneCheck.length > 0) {
          return res.status(400).json(ERROR_RESPONSES.validation('Phone number already exists'));
        }
      }

      // Check for duplicate ID number if ID number is being updated
      if (id_number !== undefined && id_number !== currentUser.id_number) {
        if (id_number) {
          const [idNumberCheck] = await this.db.execute(
            'SELECT id FROM users WHERE id_number = ? AND id != ?',
            [id_number, userId]
          );

          if (idNumberCheck.length > 0) {
            return res.status(400).json(ERROR_RESPONSES.validation('ID number already exists'));
          }
        }
      }

      // Prepare updated data
      const updatedData = {
        names: names || currentUser.names,
        phone: phone || currentUser.phone,
        id_number: id_number !== undefined ? id_number : currentUser.id_number
      };

      // Encrypt updated data
      const encryptedData = encryptUserData(updatedData);

      // Update user
      const [result] = await this.db.execute(
        'UPDATE users SET names = ?, phone = ?, id_number = ? WHERE id = ?',
        [encryptedData.names, encryptedData.phone, encryptedData.id_number || null, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      // Get updated user data
      const [updatedUsers] = await this.db.execute(
        'SELECT id, names, email, phone, role, email_verified, id_number, created_at FROM users WHERE id = ?',
        [userId]
      );

      const decryptedUpdatedUser = decryptUserData(updatedUsers[0]);

      return res.json(SUCCESS_RESPONSES.ok(decryptedUpdatedUser, 'Profile updated successfully'));

    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update profile'));
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json(ERROR_RESPONSES.validation('All password fields are required'));
      }

      const passwordValidation = validatePassword(newPassword, confirmPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(passwordValidation.message));
      }

      // Get user
      const [users] = await this.db.execute('SELECT * FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json(ERROR_RESPONSES.validation('Current password is incorrect'));
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const [result] = await this.db.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Password changed successfully'));

    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to change password'));
    }
  }

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (role) {
        whereClause += ' AND role = ?';
        params.push(role);
      }

      if (search) {
        whereClause += ' AND (names LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Get users with pagination
      const [users] = await this.db.execute(`
        SELECT id, names, email, phone, role, email_verified, created_at 
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM users ${whereClause}
      `, params);

      // Decrypt user data
      const decryptedUsers = users.map(user => {
        try {
          return decryptUserData(user);
        } catch (error) {
          console.error('Error decrypting user data:', error);
          return user;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok({
        users: decryptedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching all users:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch users'));
    }
  }

  // Create user (admin only)
  async createUser(req, res) {
    try {
      const { names, email, phone, password, role = USER_ROLES.MEMBER, id_number, tontineId } = req.body;

      // Validate input
      const nameValidation = validateNames(names);
      if (!nameValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(nameValidation.message));
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(emailValidation.message));
      }

      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(phoneValidation.message));
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(passwordValidation.message));
      }

      // Check if user already exists
      const existingUsers = await findUserByEmail(email.toLowerCase(), this.db);
      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User with this email already exists'));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Encrypt sensitive data
      const encryptedUser = encryptUserData({
        names,
        email: email.toLowerCase(),
        phone,
        id_number: id_number || null
      });

      // Insert user
      const [result] = await this.db.execute(
        'INSERT INTO users (names, email, phone, password, role, email_verified, id_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [encryptedUser.names, encryptedUser.email, encryptedUser.phone, hashedPassword, role, 1, encryptedUser.id_number || null]
      );

      const userId = result.insertId;

      let memberOnboarding = null;

      // Add user to tontine if tontineId is provided
      if (tontineId) {
        try {
          await this.db.execute(`
            INSERT INTO tontine_members (tontine_id, user_id, shares, status, joined_at) 
            VALUES (?, ?, ?, ?, ?)
          `, [tontineId, userId, 1, 'approved', getCurrentUTCDate()]);

          memberOnboarding = await notifyMemberAddedToTontine(this.db, {
            userId,
            tontineId
          });
        } catch (tontineError) {
          console.error('Failed to add user to tontine:', tontineError);
        }
      }

      // Send welcome email
      try {
        const emailHtml = getWelcomeTemplate({ names, email: email.toLowerCase() }, password);
        await sendEmail(email.toLowerCase(), 'Welcome to The Future Tontine', emailHtml);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        {
          userId: result.insertId,
          entryFee: memberOnboarding?.entryFee || null
        },
        'User created successfully'
      ));

    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to create user'));
    }
  }

  // Update user role (admin only)
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Validate role
      if (!role || !Object.values(USER_ROLES).includes(role)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid role is required'));
      }

      // Update user role
      const [result] = await this.db.execute(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'User role updated successfully'));

    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update user role'));
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      // Check if user has active tontines or loans
      const [activeRecords] = await this.db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM tontine_members WHERE user_id = ?) as tontine_memberships,
          (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status IN ('pending', 'approved')) as active_loans
      `, [userId, userId]);

      if (activeRecords[0].tontine_memberships > 0 || activeRecords[0].active_loans > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Cannot delete user with active tontine memberships or loans'));
      }

      // Delete user
      const [result] = await this.db.execute('DELETE FROM users WHERE id = ?', [userId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('User not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'User deleted successfully'));

    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete user'));
    }
  }
}

module.exports = UsersController;
