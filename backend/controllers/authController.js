/**
 * Authentication Controller
 * Handles all authentication-related business logic
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  validateNames,
  fetchAdminUsers,
  fetchUserByEmail,
  getCurrentUTCDate,
  addMinutesToUTC,
  generateVerificationCode,
  USER_ROLES,
  STATUS,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES
} = require('../utils/common');
const { encryptUserData, decryptUserData } = require('../utils/encryption');
const { findUserByEmail } = require('../utils/emailLookup');
const { 
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  getWelcomeTemplate
} = require('../utils/emailTemplates');
const { sendPasswordResetEmail, sendEmail } = require('../utils/email');

class AuthController {
  constructor(db) {
    this.db = db;
  }

  // User registration
  async register(req, res) {
    try {
      const { names, email, password, phone, role = USER_ROLES.MEMBER } = req.body;

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
      const users = await findUserByEmail(email.toLowerCase(), this.db);
      if (users && users.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User with this email or phone already exists'));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Encrypt sensitive data
      const encryptedUser = encryptUserData({
        names,
        email: email.toLowerCase(),
        phone,
        id_number: null
      });

      // Insert user
      const [result] = await this.db.execute(
        'INSERT INTO users (names, email, phone, password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [encryptedUser.names, encryptedUser.email, encryptedUser.phone, hashedPassword, role, 0]
      );

      // Send welcome email
      try {
        const emailHtml = getWelcomeTemplate({ names, email: email.toLowerCase() });
        await sendEmail(email.toLowerCase(), 'Welcome to The Future Tontine', emailHtml);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { userId: result.insertId },
        'Registration successful'
      ));

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }

  // Admin registration
  async adminRegister(req, res) {
    try {
      const { names, email, password, phone, role = USER_ROLES.MEMBER, adminId } = req.body;

      // Verify admin privileges
      const admin = await this.db.execute('SELECT * FROM users WHERE id = ? AND role IN (?, ?)', [adminId, USER_ROLES.ADMIN, USER_ROLES.PRESIDENT]);
      if (admin[0].length === 0) {
        return res.status(403).json(ERROR_RESPONSES.forbidden('Admin privileges required'));
      }

      // Validate input (same as regular registration)
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
      const users = await findUserByEmail(email.toLowerCase(), this.db);
      if (users && users.length > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User with this email or phone already exists'));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Encrypt sensitive data
      const encryptedUser = encryptUserData({
        names,
        email: email.toLowerCase(),
        phone,
        id_number: null
      });

      // Insert user
      const [result] = await this.db.execute(
        'INSERT INTO users (names, email, phone, password, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [encryptedUser.names, encryptedUser.email, encryptedUser.phone, hashedPassword, role, 1]
      );

      // Send welcome email
      try {
        const emailHtml = getWelcomeTemplate({ names, email: email.toLowerCase() }, password);
        await sendEmail(email.toLowerCase(), 'Welcome to The Future Tontine', emailHtml);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
      }

      // Add welcome notification
      await this.db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [result.insertId, 'Welcome to The Future!', 'Your account has been created by an administrator. Welcome to our tontine community!', STATUS.SUCCESS]
      );

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { userId: result.insertId },
        'Member registered successfully and welcome email sent'
      ));

    } catch (error) {
      console.error('Admin registration error:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to register member'));
    }
  }

  // User login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json(ERROR_RESPONSES.validation('Email and password are required'));
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(emailValidation.message));
      }

      // Find user
      const users = await findUserByEmail(email.toLowerCase(), this.db);
      if (!users || users.length === 0) {
        return res.status(401).json(ERROR_RESPONSES.unauthorized('Invalid credentials'));
      }

      const user = users[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(ERROR_RESPONSES.unauthorized('Invalid credentials'));
      }

      // Decrypt user data
      let decryptedUser;
      try {
        decryptedUser = decryptUserData(user);
        if (!decryptedUser || !decryptedUser.email) {
          throw new Error('Decryption returned invalid data');
        }
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        return res.status(500).json(ERROR_RESPONSES.server('Failed to process user data'));
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: decryptedUser.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
      );

      return res.status(200).json(SUCCESS_RESPONSES.ok({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          names: decryptedUser.names,
          email: decryptedUser.email,
          phone: decryptedUser.phone,
          role: user.role
        }
      }, 'Login successful'));

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Login failed. Please try again.'));
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Validate input
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(emailValidation.message));
      }

      // Find user
      const users = await findUserByEmail(email.toLowerCase(), this.db);
      if (!users || users.length === 0) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If an account with that email exists, a verification code has been sent.' });
      }

      const user = users[0];

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Clean up existing tokens
      await this.db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

      // Insert new token
      await this.db.execute(
        'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE))',
        [user.id, email.toLowerCase(), verificationCode]
      );

      // Decrypt email for sending
      const decryptedUser = decryptUserData(user);

      // Send email
      try {
        const emailHtml = getPasswordResetTemplate(decryptedUser, verificationCode);
        await sendPasswordResetEmail(decryptedUser.email, emailHtml, verificationCode);
      } catch (emailError) {
        console.error('Password reset email failed:', emailError);
      }

      return res.json({ message: 'If an account with that email exists, a verification code has been sent.' });

    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }

  // Verify reset code
  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;

      // Validate input
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation('Email and verification code are required'));
      }

      // Find token
      const [tokens] = await this.db.execute(
        'SELECT * FROM password_reset_tokens WHERE email = ? AND used = FALSE AND expires_at > UTC_TIMESTAMP()',
        [email.toLowerCase()]
      );

      if (tokens.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Invalid or expired verification code'));
      }

      const token = tokens[0];

      // Check attempts
      if (token.attempts >= token.max_attempts) {
        return res.status(400).json(ERROR_RESPONSES.validation('Maximum verification attempts reached. Please request a new code.'));
      }

      // Increment attempts
      await this.db.execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?', [token.id]);

      // Fetch updated token
      const [updatedTokens] = await this.db.execute('SELECT * FROM password_reset_tokens WHERE id = ?', [token.id]);
      const updatedToken = updatedTokens[0];

      if (code === token.token) {
        // Mark as used
        await this.db.execute('UPDATE password_reset_tokens SET used = TRUE WHERE id = ?', [token.id]);

        // Generate tokens
        const accessToken = jwt.sign(
          { userId: token.user_id, email: email, role: USER_ROLES.MEMBER },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: token.user_id, type: 'refresh' },
          process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
          { expiresIn: '7d' }
        );

        // Get user data
        const [userRecords] = await this.db.execute('SELECT * FROM users WHERE id = ?', [token.user_id]);
        if (userRecords.length > 0) {
          const decryptedUser = decryptUserData(userRecords[0]);

          return res.json(SUCCESS_RESPONSES.ok({
            message: 'Verification successful! You can now reset your password.',
            success: true,
            accessToken,
            refreshToken,
            user: {
              id: decryptedUser.id,
              names: decryptedUser.names,
              email: decryptedUser.email,
              phone: decryptedUser.phone,
              role: decryptedUser.role
            }
          }));
        }
      }

      // Wrong code - calculate remaining attempts
      const remainingAttempts = Math.max(0, updatedToken.max_attempts - updatedToken.attempts);
      return res.status(400).json({
        message: 'Invalid verification code',
        attemptsRemaining: remainingAttempts
      });

    } catch (error) {
      console.error('Verify reset code error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { newPassword, confirmPassword, email } = req.body;

      // Validate input
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation('Email is required for password reset'));
      }

      const passwordValidation = validatePassword(newPassword, confirmPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(passwordValidation.message));
      }

      // Find user
      const users = await findUserByEmail(email, this.db);
      if (!users || users.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('User not found'));
      }

      const user = users[0];

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

      return res.json({ message: 'Password reset successful! You can now login with your new password.' });

    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }

  // Get admin users
  async getAdminUsers(req, res) {
    try {
      const adminUsers = await fetchAdminUsers(this.db);
      
      // Decrypt user data
      const decryptedUsers = adminUsers.map(user => {
        try {
          return decryptUserData(user);
        } catch (error) {
          console.error('Error decrypting user data:', error);
          return user;
        }
      });

      return res.json(decryptedUsers);

    } catch (error) {
      console.error('Get admin users error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }

  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const [users] = await this.db.execute(
        'SELECT id, names, email, phone, role FROM users ORDER BY names'
      );

      return res.json(users);

    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json(ERROR_RESPONSES.server());
    }
  }
}

module.exports = AuthController;
