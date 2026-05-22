/**
 * Common utilities and validations used across the application
 */

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(078|079|072|073)\d{7}$/,
  password: {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  },
  names: /^[a-zA-Z\s]+$/,
  idNumber: /^[0-9]{16}$/
};

// Common validation messages
const VALIDATION_MESSAGES = {
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid Rwandan phone number (078XXXXXXXX)',
  password: {
    required: 'Password is required',
    minLength: 'Password must be at least 8 characters long',
    hasUppercase: 'Password must contain at least 1 uppercase letter',
    hasLowercase: 'Password must contain at least 1 lowercase letter',
    hasNumber: 'Password must contain at least 1 number',
    hasSpecialChar: 'Password must contain at least 1 special character',
    match: 'Passwords do not match'
  },
  names: 'Names can only contain letters and spaces',
  idNumber: 'ID number must be exactly 16 digits'
};

// Common roles
const USER_ROLES = {
  ADMIN: 'admin',
  PRESIDENT: 'president',
  MEMBER: 'member',
  ACCOUNTANT: 'accountant'
};

// Common status values
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  USED: true,
  UNUSED: false
};

// Common error responses
const ERROR_RESPONSES = {
  validation: (message) => ({ status: 400, success: false, message }),
  unauthorized: (message = 'Authentication required') => ({ status: 401, success: false, message }),
  forbidden: (message = 'Access denied') => ({ status: 403, success: false, message }),
  notFound: (message = 'Resource not found') => ({ status: 404, success: false, message }),
  server: (message = 'Internal server error') => ({ status: 500, success: false, message }),
  tooManyRequests: (message = 'Too many requests, please try again later') => ({ status: 429, success: false, message })
};

// Common success responses
const SUCCESS_RESPONSES = {
  created: (data, message = 'Created successfully') => ({ status: 201, success: true, message, data }),
  ok: (data, message = 'Operation successful') => ({ status: 200, success: true, message, data })
};

// Validation functions
const validateEmail = (email) => {
  if (!email) return { valid: false, message: VALIDATION_MESSAGES.email };
  if (!VALIDATION_PATTERNS.email.test(email)) return { valid: false, message: VALIDATION_MESSAGES.email };
  return { valid: true };
};

const validatePhone = (phone) => {
  if (!phone) return { valid: false, message: VALIDATION_MESSAGES.phone };
  if (!VALIDATION_PATTERNS.phone.test(phone)) return { valid: false, message: VALIDATION_MESSAGES.phone };
  return { valid: true };
};

const validatePassword = (password, confirmPassword = null) => {
  if (!password) return { valid: false, message: VALIDATION_MESSAGES.password.required };
  if (password.length < VALIDATION_PATTERNS.password.minLength) {
    return { valid: false, message: VALIDATION_MESSAGES.password.minLength };
  }
  if (!VALIDATION_PATTERNS.password.hasUppercase.test(password)) {
    return { valid: false, message: VALIDATION_MESSAGES.password.hasUppercase };
  }
  if (!VALIDATION_PATTERNS.password.hasLowercase.test(password)) {
    return { valid: false, message: VALIDATION_MESSAGES.password.hasLowercase };
  }
  if (!VALIDATION_PATTERNS.password.hasNumber.test(password)) {
    return { valid: false, message: VALIDATION_MESSAGES.password.hasNumber };
  }
  if (!VALIDATION_PATTERNS.password.hasSpecialChar.test(password)) {
    return { valid: false, message: VALIDATION_MESSAGES.password.hasSpecialChar };
  }
  if (confirmPassword && password !== confirmPassword) {
    return { valid: false, message: VALIDATION_MESSAGES.password.match };
  }
  return { valid: true };
};

const validateNames = (names) => {
  if (!names) return { valid: false, message: VALIDATION_MESSAGES.names };
  if (!VALIDATION_PATTERNS.names.test(names.trim())) return { valid: false, message: VALIDATION_MESSAGES.names };
  return { valid: true };
};

const validateIdNumber = (idNumber) => {
  if (!idNumber) return { valid: false, message: VALIDATION_MESSAGES.idNumber };
  if (!VALIDATION_PATTERNS.idNumber.test(idNumber)) return { valid: false, message: VALIDATION_MESSAGES.idNumber };
  return { valid: true };
};

// Database query helpers
const fetchAdminUsers = async (db) => {
  try {
    const [adminUsers] = await db.execute(
      'SELECT * FROM users WHERE role IN (?, ?, ?)',
      [USER_ROLES.ADMIN, USER_ROLES.PRESIDENT, USER_ROLES.ACCOUNTANT]
    );
    return adminUsers;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};

const fetchUserByEmail = async (db, email) => {
  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

// Common date helpers
const getCurrentUTCDate = () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

const addMinutesToUTC = (minutes) => {
  const date = new Date();
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

const isDateValid = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Generate random codes
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateReferenceNumber = (prefix = 'REF') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

// QueryHelpers for building database queries
const QueryHelpers = require('./queryHelpers');

module.exports = {
  // Validation patterns
  PATTERNS: VALIDATION_PATTERNS,
  
  // Validation messages
  MESSAGES: VALIDATION_MESSAGES,
  
  // User roles and status
  USER_ROLES,
  STATUS,
  
  // Response helpers
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  
  // Validation functions
  validateEmail,
  validatePhone,
  validatePassword,
  validateNames,
  validateIdNumber,
  
  // Database helpers
  fetchAdminUsers,
  
  // Date helpers
  getCurrentUTCDate,
  formatDate,
  isDateValid,
  
  // Code generators
  generateVerificationCode,
  generateReferenceNumber,

  // Query helpers
  QueryHelpers
};
