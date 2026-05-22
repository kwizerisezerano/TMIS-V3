/**
 * Test Helpers Utility
 * Provides common testing utilities and helper functions
 */

const request = require('supertest');
const { DatabaseHelpers, ResponseHelpers } = require('../../utils/common');

class TestHelpers {
  constructor(app, database) {
    this.app = app;
    this.database = new DatabaseHelpers(database);
  }

  /**
   * Create authenticated request with test user token
   */
  authenticatedRequest(user) {
    const token = this.generateTestToken(user);
    return request(this.app)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Generate test JWT token for user
   */
  generateTestToken(user) {
    // Simple test token - in production, use proper JWT
    return Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    })).toString('base64');
  }

  /**
   * Expect successful response
   */
  expectSuccess(response, expectedData = null) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
    
    return response.body;
  }

  /**
   * Expect created response
   */
  expectCreated(response, expectedData = null) {
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
    
    return response.body;
  }

  /**
   * Expect validation error response
   */
  expectValidationError(response, expectedMessage = null) {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
    
    return response.body;
  }

  /**
   * Expect not found response
   */
  expectNotFound(response, expectedMessage = null) {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
    
    return response.body;
  }

  /**
   * Expect server error response
   */
  expectServerError(response, expectedMessage = null) {
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('success', false);
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
    
    return response.body;
  }

  /**
   * Expect paginated response
   */
  expectPaginated(response, expectedCount = null) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('pages');
    
    if (expectedCount !== null) {
      expect(response.body.data).toHaveLength(expectedCount);
    }
    
    return response.body;
  }

  /**
   * Clean up test data from database
   */
  async cleanupTestData() {
    const tables = [
      'meeting_attendance',
      'meetings',
      'penalties',
      'notifications',
      'loan_payments',
      'loan_requests',
      'contributions',
      'tontine_members',
      'tontines',
      'users',
      'applications',
      'application_files',
      'password_reset_tokens'
    ];

    for (const table of tables) {
      try {
        await this.database.execute(`DELETE FROM ${table}`);
        await this.database.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch (error) {
        // Ignore errors for tables that don't exist
      }
    }
  }

  /**
   * Create test user in database
   */
  async createTestUser(userData = {}) {
    const defaultUser = {
      names: 'Test User',
      email: 'test@example.com',
      phone: '+250788123456',
      role: 'member',
      id_number: '1199080012345678'
    };

    const user = { ...defaultUser, ...userData };
    const { encryptUserData } = require('../../utils/encryption');
    const { getCurrentUTCDate } = require('../../utils/common');
    const bcrypt = require('bcryptjs');

    const encryptedUser = encryptUserData(user);
    const hashedPassword = await bcrypt.hash('test123', 10);

    const [result] = await this.database.execute(`
      INSERT INTO users (names, email, phone, role, email_verified, id_number, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      encryptedUser.names,
      encryptedUser.email,
      encryptedUser.phone,
      user.role,
      1,
      encryptedUser.id_number,
      getCurrentUTCDate()
    ]);

    return {
      id: result.insertId,
      ...user,
      password: hashedPassword
    };
  }

  /**
   * Create test tontine in database
   */
  async createTestTontine(tontineData = {}) {
    const defaultTontine = {
      name: 'Test Tontine',
      description: 'Test tontine description',
      contribution_amount: 20000.00,
      contribution_frequency: 'monthly',
      max_members: 10,
      creator_id: 1,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'active'
    };

    const tontine = { ...defaultTontine, ...tontineData };
    const { getCurrentUTCDate } = require('../../utils/common');

    const [result] = await this.database.execute(`
      INSERT INTO tontines (name, description, contribution_amount, contribution_frequency, max_members, creator_id, start_date, end_date, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tontine.name,
      tontine.description,
      tontine.contribution_amount,
      tontine.contribution_frequency,
      tontine.max_members,
      tontine.creator_id,
      tontine.start_date,
      tontine.end_date,
      tontine.status,
      getCurrentUTCDate()
    ]);

    return {
      id: result.insertId,
      ...tontine
    };
  }

  /**
   * Create test application in database
   */
  async createTestApplication(applicationData = {}) {
    const defaultApplication = {
      names: 'Test Applicant',
      email: 'applicant@test.com',
      phone: '+250788555666',
      id_number: '1199080055667788',
      status: 'pending'
    };

    const application = { ...defaultApplication, ...applicationData };
    const { encryptUserData } = require('../../utils/encryption');
    const { getCurrentUTCDate } = require('../../utils/common');

    const encryptedApp = encryptUserData(application);

    const [result] = await this.database.execute(`
      INSERT INTO applications (names, email, phone, id_number, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      encryptedApp.names,
      encryptedApp.email,
      encryptedApp.phone,
      encryptedApp.id_number,
      application.status,
      getCurrentUTCDate(),
      getCurrentUTCDate()
    ]);

    return {
      id: result.insertId,
      ...application
    };
  }

  /**
   * Assert database record exists
   */
  async assertRecordExists(table, conditions) {
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const params = Object.values(conditions);
    
    const [records] = await this.database.execute(
      `SELECT * FROM ${table} WHERE ${whereClause}`,
      params
    );
    
    expect(records.length).toBeGreaterThan(0);
    return records[0];
  }

  /**
   * Assert database record does not exist
   */
  async assertRecordNotExists(table, conditions) {
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const params = Object.values(conditions);
    
    const [records] = await this.database.execute(
      `SELECT * FROM ${table} WHERE ${whereClause}`,
      params
    );
    
    expect(records.length).toBe(0);
  }

  /**
   * Get record count from table
   */
  async getRecordCount(table, conditions = {}) {
    if (Object.keys(conditions).length === 0) {
      const [result] = await this.database.execute(`SELECT COUNT(*) as count FROM ${table}`);
      return result[0].count;
    }
    
    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const params = Object.values(conditions);
    
    const [result] = await this.database.execute(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`,
      params
    );
    
    return result[0].count;
  }

  /**
   * Wait for async operation
   */
  async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  generateRandomEmail() {
    return `test${Math.random().toString(36).substring(7)}@example.com`;
  }

  generateRandomPhone() {
    return `+250788${Math.random().toString().substring(2, 8)}`;
  }

  generateRandomIdNumber() {
    return `11990800${Math.random().toString().substring(2, 10)}`;
  }

  generateRandomName() {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const lastNames = ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }
}

module.exports = TestHelpers;
