/**
 * QueryHelpers Tests
 * Comprehensive testing for QueryHelpers utility functions
 */

const QueryHelpers = require('../../utils/queryHelpers');
const TestDatabaseSetup = require('../setup');
const TestHelpers = require('../utils/testHelpers');

describe('QueryHelpers', () => {
  let testDb;
  let testHelpers;
  let testData;

  beforeAll(async () => {
    // Setup test database
    const dbSetup = new TestDatabaseSetup();
    testDb = await dbSetup.setup();
    
    // Initialize test helpers
    const app = require('../../server');
    testHelpers = new TestHelpers(app, testDb);
    
    // Get test data
    testData = require('../seeders/testDataSeeder').getTestData();
  });

  afterAll(async () => {
    // Cleanup test database
    if (testDb) {
      await testDb.end();
    }
  });

  beforeEach(async () => {
    // Reset database before each test
    await testHelpers.cleanupTestData();
  });

  describe('buildWhereClause', () => {
    test('should build basic where clause', () => {
      const criteria = {
        status: 'active',
        type: 'contribution'
      };

      const result = QueryHelpers.buildWhereClause(criteria);

      expect(result.whereClause).toBe('WHERE 1=1 AND status = ? AND type = ?');
      expect(result.params).toEqual(['active', 'contribution']);
    });

    test('should handle empty criteria', () => {
      const criteria = {};

      const result = QueryHelpers.buildWhereClause(criteria);

      expect(result.whereClause).toBe('WHERE 1=1');
      expect(result.params).toEqual([]);
    });

    test('should handle null/undefined values', () => {
      const criteria = {
        status: 'active',
        type: null,
        category: undefined,
        priority: 'high'
      };

      const result = QueryHelpers.buildWhereClause(criteria);

      expect(result.whereClause).toBe('WHERE 1=1 AND status = ? AND priority = ?');
      expect(result.params).toEqual(['active', 'high']);
    });

    test('should handle table prefix', () => {
      const criteria = {
        status: 'active',
        type: 'contribution'
      };

      const result = QueryHelpers.buildWhereClause(criteria, {
        tablePrefix: 't.'
      });

      expect(result.whereClause).toBe('WHERE 1=1 AND t.status = ? AND t.type = ?');
      expect(result.params).toEqual(['active', 'contribution']);
    });

    test('should handle custom filters', () => {
      const criteria = {
        status: 'active',
        search: 'test'
      };

      const result = QueryHelpers.buildWhereClause(criteria, {
        customFilters: {
          search: (value) => {
            if (value) {
              return 'AND (name LIKE ? OR description LIKE ?)';
            }
            return '';
          }
        }
      });

      expect(result.whereClause).toBe('WHERE 1=1 AND status = ? AND (name LIKE ? OR description LIKE ?)');
      expect(result.params).toEqual(['active', 'test', 'test']);
    });

    test('should handle exclude conditions', () => {
      const criteria = {
        status: 'active'
      };

      const result = QueryHelpers.buildWhereClause(criteria, {
        excludeColumn: 'id',
        excludeId: 123
      });

      expect(result.whereClause).toBe('WHERE 1=1 AND status = ? AND id != ?');
      expect(result.params).toEqual(['active', 123]);
    });

    test('should handle search fields', () => {
      const criteria = {
        search: 'test search'
      };

      const result = QueryHelpers.buildWhereClause(criteria, {
        searchFields: ['name', 'description', 'category']
      });

      expect(result.whereClause).toBe('WHERE 1=1 AND (name LIKE ? OR description LIKE ? OR category LIKE ?)');
      expect(result.params).toEqual(['%test search%', '%test search%', '%test search%']);
    });

    test('should handle date range filters', () => {
      const criteria = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const result = QueryHelpers.buildWhereClause(criteria, {
        dateFilters: {
          startDate: 'created_at',
          endDate: 'created_at'
        }
      });

      expect(result.whereClause).toBe('WHERE 1=1 AND created_at >= ? AND created_at <= ?');
      expect(result.params).toEqual(['2024-01-01', '2024-12-31']);
    });
  });

  describe('buildPagination', () => {
    test('should build pagination with default values', () => {
      const query = {};

      const result = QueryHelpers.buildPagination(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    test('should build pagination with custom values', () => {
      const query = {
        page: 3,
        limit: 50
      };

      const result = QueryHelpers.buildPagination(query);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(100);
    });

    test('should enforce max limit', () => {
      const query = {
        page: 1,
        limit: 200
      };

      const result = QueryHelpers.buildPagination(query, {
        maxLimit: 100
      });

      expect(result.limit).toBe(100);
    });

    test('should handle invalid page values', () => {
      const query = {
        page: -1,
        limit: 20
      };

      const result = QueryHelpers.buildPagination(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    test('should handle string page values', () => {
      const query = {
        page: '3',
        limit: '25'
      };

      const result = QueryHelpers.buildPagination(query);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
    });
  });

  describe('buildPaginationResponse', () => {
    test('should build pagination response', () => {
      const total = 100;
      const pagination = {
        page: 2,
        limit: 20,
        offset: 20
      };

      const result = QueryHelpers.buildPaginationResponse(total, pagination);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(100);
      expect(result.pages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    test('should handle first page', () => {
      const total = 50;
      const pagination = {
        page: 1,
        limit: 20,
        offset: 0
      };

      const result = QueryHelpers.buildPaginationResponse(total, pagination);

      expect(result.page).toBe(1);
      expect(result.pages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    test('should handle last page', () => {
      const total = 40;
      const pagination = {
        page: 2,
        limit: 20,
        offset: 20
      };

      const result = QueryHelpers.buildPaginationResponse(total, pagination);

      expect(result.page).toBe(2);
      expect(result.pages).toBe(2);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    test('should handle empty results', () => {
      const total = 0;
      const pagination = {
        page: 1,
        limit: 20,
        offset: 0
      };

      const result = QueryHelpers.buildPaginationResponse(total, pagination);

      expect(result.page).toBe(1);
      expect(result.total).toBe(0);
      expect(result.pages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });
  });

  describe('checkForeignKey', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should return true for existing foreign key', async () => {
      const exists = await QueryHelpers.checkForeignKey(testDb, 'users', 'id', testData.users[0].id);

      expect(exists).toBe(true);
    });

    test('should return false for non-existent foreign key', async () => {
      const exists = await QueryHelpers.checkForeignKey(testDb, 'users', 'id', 99999);

      expect(exists).toBe(false);
    });

    test('should handle invalid table name', async () => {
      const exists = await QueryHelpers.checkForeignKey(testDb, 'invalid_table', 'id', 1);

      expect(exists).toBe(false);
    });

    test('should handle invalid column name', async () => {
      const exists = await QueryHelpers.checkForeignKey(testDb, 'users', 'invalid_column', 1);

      expect(exists).toBe(false);
    });

    test('should handle null value', async () => {
      const exists = await QueryHelpers.checkForeignKey(testDb, 'users', 'id', null);

      expect(exists).toBe(false);
    });
  });

  describe('checkDuplicate', () => {
    beforeEach(async () => {
      // Seed test data
      await require('../seeders/testDataSeeder').seedAll(testDb);
    });

    test('should detect duplicate record', async () => {
      const result = await QueryHelpers.checkDuplicate(testDb, 'users', {
        email: testData.users[0].email
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.status).toBe('duplicate');
      expect(result.data).toBeDefined();
      expect(result.constraint).toBe('email');
    });

    test('should return no duplicate for unique values', async () => {
      const result = await QueryHelpers.checkDuplicate(testDb, 'users', {
        email: 'unique@example.com'
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.status).toBe('unique');
      expect(result.data).toBeNull();
    });

    test('should handle multi-column constraints', async () => {
      const result = await QueryHelpers.checkDuplicate(testDb, 'tontine_members', {
        tontine_id: testData.tontines[0].id,
        user_id: testData.users[0].id
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.constraint).toBe('unique_tontine_user');
      expect(result.constraintColumns).toEqual(['tontine_id', 'user_id']);
    });

    test('should handle exclusion for updates', async () => {
      const result = await QueryHelpers.checkDuplicate(testDb, 'users', {
        email: testData.users[0].email
      }, {
        excludeId: testData.users[0].id
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.status).toBe('unique');
    });

    test('should handle database errors', async () => {
      // Mock database to throw error
      const originalExecute = testDb.execute;
      testDb.execute = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await QueryHelpers.checkDuplicate(testDb, 'users', {
        email: 'test@example.com'
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.status).toBe('error');
      expect(result.message).toContain('Error checking duplicates');

      // Restore original method
      testDb.execute = originalExecute;
    });

    test('should handle constraint violation errors', async () => {
      // Mock database to throw constraint violation error
      const originalExecute = testDb.execute;
      testDb.execute = jest.fn().mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        message: 'Duplicate entry for key \'unique_email\''
      });

      const result = await QueryHelpers.checkDuplicate(testDb, 'users', {
        email: 'test@example.com'
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.constraint).toBe('unique_email');

      // Restore original method
      testDb.execute = originalExecute;
    });
  });

  describe('validateConstraints', () => {
    test('should validate single field constraint', async () => {
      const constraints = {
        email: 'test@example.com'
      };

      const result = await QueryHelpers.validateConstraints(testDb, 'users', constraints);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate multiple field constraints', async () => {
      const constraints = {
        email: 'unique@example.com',
        phone: '+250788123456'
      };

      const result = await QueryHelpers.validateConstraints(testDb, 'users', constraints);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should return validation errors for duplicates', async () => {
      await require('../seeders/testDataSeeder').seedAll(testDb);

      const constraints = {
        email: testData.users[0].email
      };

      const result = await QueryHelpers.validateConstraints(testDb, 'users', constraints);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('email already exists');
    });

    test('should handle foreign key constraints', async () => {
      const constraints = {
        user_id: 99999 // Non-existent user
      };

      const result = await QueryHelpers.validateConstraints(testDb, 'applications', constraints);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('User not found');
    });
  });

  describe('getFilterConfig', () => {
    test('should return filter config for known tables', () => {
      const config = QueryHelpers.getFilterConfig('users');

      expect(config).toHaveProperty('searchFields');
      expect(config).toHaveProperty('dateFields');
      expect(config).toHaveProperty('statusFields');
      expect(Array.isArray(config.searchFields)).toBe(true);
    });

    test('should return default config for unknown tables', () => {
      const config = QueryHelpers.getFilterConfig('unknown_table');

      expect(config).toHaveProperty('searchFields', []);
      expect(config).toHaveProperty('dateFields', []);
      expect(config).toHaveProperty('statusFields', []);
    });

    test('should include valid search fields for applications', () => {
      const config = QueryHelpers.getFilterConfig('applications');

      expect(config.searchFields).toContain('names');
      expect(config.searchFields).toContain('email');
      expect(config.searchFields).toContain('phone');
    });

    test('should include valid status fields for loans', () => {
      const config = QueryHelpers.getFilterConfig('loan_requests');

      expect(config.statusFields).toContain('status');
      expect(config.statusFields).toContain('Pending');
      expect(config.statusFields).toContain('Approved');
      expect(config.statusFields).toContain('Rejected');
    });
  });

  describe('buildSortClause', () => {
    test('should build sort clause with single field', () => {
      const result = QueryHelpers.buildSortClause('name', 'asc');

      expect(result).toBe('ORDER BY name ASC');
    });

    test('should build sort clause with multiple fields', () => {
      const result = QueryHelpers.buildSortClause(['name', 'created_at'], ['asc', 'desc']);

      expect(result).toBe('ORDER BY name ASC, created_at DESC');
    });

    test('should handle table prefix', () => {
      const result = QueryHelpers.buildSortClause('name', 'asc', 'u.');

      expect(result).toBe('ORDER BY u.name ASC');
    });

    test('should return empty string for no sort', () => {
      const result = QueryHelpers.buildSortClause();

      expect(result).toBe('');
    });

    test('should handle invalid sort direction', () => {
      const result = QueryHelpers.buildSortClause('name', 'invalid');

      expect(result).toBe('ORDER BY name ASC'); // Default to ASC
    });
  });

  describe('Error Handling', () => {
    test('should handle null database connection', async () => {
      await expect(QueryHelpers.checkForeignKey(null, 'users', 'id', 1))
        .rejects.toThrow();
    });

    test('should handle malformed criteria', () => {
      expect(() => {
        QueryHelpers.buildWhereClause(null);
      }).not.toThrow();
    });

    test('should handle malformed pagination', () => {
      expect(() => {
        QueryHelpers.buildPagination(null);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large result sets efficiently', async () => {
      // Create many test records
      const testUser = await testHelpers.createTestUser();
      
      // Test large pagination
      const result = QueryHelpers.buildPagination({
        page: 100,
        limit: 50
      });

      expect(result.offset).toBe(4950);
      expect(result.page).toBe(100);
    });

    test('should handle complex where clauses efficiently', () => {
      const complexCriteria = {
        status: 'active',
        type: 'contribution',
        category: 'monthly',
        priority: 'high',
        search: 'test search query',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const result = QueryHelpers.buildWhereClause(complexCriteria, {
        searchFields: ['name', 'description'],
        dateFilters: {
          startDate: 'created_at',
          endDate: 'created_at'
        }
      });

      expect(result.params.length).toBeGreaterThan(5);
      expect(result.whereClause).toContain('WHERE 1=1');
    });
  });
});
