/**
 * Query Helper Functions
 * Reusable query building utilities for consistent GET operations
 */

class QueryHelpers {
  /**
   * Build WHERE clause and parameters from query filters
   * @param {Object} filters - Query parameters
   * @param {Object} options - Configuration options
   * @returns {Object} { whereClause, params }
   */
  static buildWhereClause(filters = {}, options = {}) {
    const {
      tablePrefix = '', // e.g. 't.', 'u.', 'a.'
      customFilters = {}, // Custom filter handlers
      excludeFilters = [] // Filters to exclude
    } = options;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // Common filter patterns
    const filterHandlers = {
      // ID filters
      id: (value) => {
        if (value) {
          whereClause += ` AND ${tablePrefix}id = ?`;
          params.push(value);
        }
      },
      
      userId: (value) => {
        if (value) {
          whereClause += ` AND ${tablePrefix}user_id = ?`;
          params.push(value);
        }
      },
      
      tontineId: (value) => {
        if (value) {
          whereClause += ` AND ${tablePrefix}tontine_id = ?`;
          params.push(value);
        }
      },
      
      applicationId: (value) => {
        if (value) {
          whereClause += ` AND ${tablePrefix}application_id = ?`;
          params.push(value);
        }
      },
      
      // Status filters
      status: (value) => {
        if (value) {
          if (Array.isArray(value)) {
            const placeholders = value.map(() => '?').join(',');
            whereClause += ` AND ${tablePrefix}status IN (${placeholders})`;
            params.push(...value);
          } else {
            whereClause += ` AND ${tablePrefix}status = ?`;
            params.push(value);
          }
        }
      },
      
      // Role filters
      role: (value) => {
        if (value) {
          if (Array.isArray(value)) {
            const placeholders = value.map(() => '?').join(',');
            whereClause += ` AND ${tablePrefix}role IN (${placeholders})`;
            params.push(...value);
          } else {
            whereClause += ` AND ${tablePrefix}role = ?`;
            params.push(value);
          }
        }
      },
      
      // Search filters (text search)
      search: (value) => {
        if (value) {
          const searchFields = options.searchFields || ['name', 'email', 'description'];
          const searchConditions = searchFields.map(field => `${tablePrefix}${field} LIKE ?`);
          whereClause += ` AND (${searchConditions.join(' OR ')})`;
          const searchValue = `%${value}%`;
          params.push(...Array(searchFields.length).fill(searchValue));
        }
      },
      
      // Date range filters
      dateFrom: (value) => {
        if (value) {
          whereClause += ` AND DATE(${tablePrefix}created_at) >= DATE(?)`;
          params.push(value);
        }
      },
      
      dateTo: (value) => {
        if (value) {
          whereClause += ` AND DATE(${tablePrefix}created_at) <= DATE(?)`;
          params.push(value);
        }
      },
      
      // Boolean filters
      isActive: (value) => {
        if (value !== undefined) {
          whereClause += ` AND ${tablePrefix}is_active = ?`;
          params.push(value === 'true' || value === true ? 1 : 0);
        }
      },
      
      isRead: (value) => {
        if (value !== undefined) {
          whereClause += ` AND ${tablePrefix}is_read = ?`;
          params.push(value === 'true' || value === true ? 1 : 0);
        }
      },
      
      // Payment status filters
      paymentStatus: (value) => {
        if (value) {
          if (Array.isArray(value)) {
            const placeholders = value.map(() => '?').join(',');
            whereClause += ` AND ${tablePrefix}payment_status IN (${placeholders})`;
            params.push(...value);
          } else {
            whereClause += ` AND ${tablePrefix}payment_status = ?`;
            params.push(value);
          }
        }
      },
      
      // Membership status filters
      membershipStatus: (value) => {
        if (value) {
          whereClause += ` AND ${tablePrefix}status = ?`;
          params.push(value);
        }
      }
    };

    // Apply custom filters
    Object.assign(filterHandlers, customFilters);

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (excludeFilters.includes(key)) return;
      
      const handler = filterHandlers[key];
      if (handler && filters[key] !== undefined && filters[key] !== '') {
        handler(filters[key]);
      }
    });

    return { whereClause, params };
  }

  /**
   * Build pagination parameters and return complete pagination object
   * @param {Object} query - Query parameters
   * @param {Object} options - Configuration options
   * @returns {Object} { page, limit, offset, pagination }
   */
  static buildPagination(query = {}, options = {}) {
    const { defaultLimit = 20, maxLimit = 100 } = options;
    
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || defaultLimit;
    
    // Validate and sanitize
    page = Math.max(1, page);
    limit = Math.min(maxLimit, Math.max(1, limit));
    
    const offset = (page - 1) * limit;
    
    return { 
      page, 
      limit, 
      offset,
      pagination: {
        page,
        limit,
        offset,
        hasNext: false, // Will be set by caller
        hasPrev: page > 1,
        totalPages: 0 // Will be set by caller
      }
    };
  }

  /**
   * Build complete pagination response with total count
   * @param {number} total - Total number of records
   * @param {Object} pagination - Pagination object from buildPagination
   * @returns {Object} Complete pagination object
   */
  static buildPaginationResponse(total, pagination) {
    const totalPages = Math.ceil(total / pagination.limit);
    
    return {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      offset: pagination.offset
    };
  }

  /**
   * Check foreign key existence and return status
   * @param {Object} db - Database connection
   * @param {string} table - Foreign table name
   * @param {string} column - Foreign column name
   * @param {mixed} value - Value to check
   * @param {Object} options - Additional options
   * @returns {Object} { exists, data, status }
   */
  static async checkForeignKey(db, table, column, value, options = {}) {
    const { 
      selectColumns = '*', 
      additionalConditions = '',
      additionalParams = [] 
    } = options;

    try {
      const query = `
        SELECT ${selectColumns} 
        FROM ${table} 
        WHERE ${column} = ? 
        ${additionalConditions ? 'AND ' + additionalConditions : ''}
        LIMIT 1
      `;
      
      const [results] = await db.execute(query, [value, ...additionalParams]);
      
      const exists = results.length > 0;
      
      return {
        exists,
        data: exists ? results[0] : null,
        status: exists ? 'exists' : 'not_found',
        message: exists ? `Record found in ${table}` : `Record not found in ${table}`,
        table,
        column,
        value
      };
      
    } catch (error) {
      return {
        exists: false,
        data: null,
        status: 'error',
        message: `Error checking ${table}.${column}: ${error.message}`,
        table,
        column,
        value,
        error
      };
    }
  }

  /**
   * Check for duplicate records using database constraints
   * @param {Object} db - Database connection
   * @param {string} table - Table name
   * @param {Object} criteria - Criteria to check for duplicates
   * @param {Object} options - Additional options
   * @returns {Object} { isDuplicate, data, status, constraint }
   */
  static async checkDuplicate(db, table, criteria = {}, options = {}) {
    const { 
      excludeId = null, // Exclude specific ID from duplicate check
      excludeColumn = 'id',
      selectColumns = '*',
      customConditions = '',
      useConstraint = true // Use database constraint name if available
    } = options;

    try {
      // Define table-specific constraints
      const tableConstraints = {
        'users': {
          email: 'email',        // Direct UNIQUE constraint
          phone: 'phone',        // Direct UNIQUE constraint
          id_number: 'id_number' // Direct UNIQUE constraint
        },
        'tontines': {
          unique_creator_tontine_name: ['creator_id', 'name']
        },
        'applications': {
          unique_email: 'email',
          unique_phone: 'phone',
          unique_id_number: 'id_number'
        },
        'tontine_members': {
          unique_tontine_user: ['tontine_id', 'user_id']
        },
        'contributions': {
          unique_transaction_ref: 'transaction_ref',
          unique_contribution_user_date: ['user_id', 'tontine_id', 'contribution_date']
        },
        'loans': {
          unique_user_tontine_active_loan: ['user_id', 'tontine_id', 'status']
        },
        'payments': {
          unique_transaction_ref: 'transaction_ref'
        },
        'penalties': {
          unique_user_loan_penalty: ['user_id', 'loan_id', 'status']
        },
        'meetings': {
          unique_tontine_meeting_date_time: ['tontine_id', 'meeting_date']
        },
        'meeting_attendance': {
          unique_attendance: ['meeting_id', 'user_id']
        }
      };

      const constraints = tableConstraints[table] || {};
      
      // Find matching constraint based on criteria
      let matchedConstraint = null;
      let constraintColumns = [];

      if (useConstraint) {
        for (const [constraintName, constraintDef] of Object.entries(constraints)) {
          if (Array.isArray(constraintDef)) {
            // Multi-column constraint
            if (constraintDef.every(col => criteria[col] !== undefined && criteria[col] !== null)) {
              matchedConstraint = constraintName;
              constraintColumns = constraintDef;
              break;
            }
          } else {
            // Single column constraint
            if (criteria[constraintDef] !== undefined && criteria[constraintDef] !== null) {
              matchedConstraint = constraintName;
              constraintColumns = [constraintDef];
              break;
            }
          }
        }
      }

      // If no constraint matched, use the original criteria-based check
      if (!matchedConstraint) {
        const conditions = [];
        const params = [];

        // Build conditions from criteria
        Object.keys(criteria).forEach(key => {
          if (criteria[key] !== undefined && criteria[key] !== null) {
            conditions.push(`${key} = ?`);
            params.push(criteria[key]);
          }
        });

        // Add exclusion condition
        if (excludeId) {
          conditions.push(`${excludeColumn} != ?`);
          params.push(excludeId);
        }

        // Add custom conditions
        if (customConditions) {
          conditions.push(customConditions);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        const query = `
          SELECT ${selectColumns} 
          FROM ${table} 
          ${whereClause}
          LIMIT 1
        `;
        
        const [results] = await db.execute(query, params);
        
        const isDuplicate = results.length > 0;
        
        return {
          isDuplicate,
          data: isDuplicate ? results[0] : null,
          status: isDuplicate ? 'duplicate' : 'unique',
          message: isDuplicate ? `Duplicate record found in ${table}` : `No duplicate found in ${table}`,
          table,
          criteria,
          totalFound: results.length,
          constraint: null
        };
      }

      // Use constraint-based check
      const conditions = [];
      const params = [];

      constraintColumns.forEach(col => {
        conditions.push(`${col} = ?`);
        params.push(criteria[col]);
      });

      // Add exclusion condition
      if (excludeId) {
        conditions.push(`${excludeColumn} != ?`);
        params.push(excludeId);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      
      const query = `
        SELECT ${selectColumns} 
        FROM ${table} 
        ${whereClause}
        LIMIT 1
      `;
      
      const [results] = await db.execute(query, params);
      
      const isDuplicate = results.length > 0;
      
      return {
        isDuplicate,
        data: isDuplicate ? results[0] : null,
        status: isDuplicate ? 'duplicate' : 'unique',
        message: isDuplicate 
          ? `Duplicate record found in ${table} (violates ${matchedConstraint} constraint)` 
          : `No duplicate found in ${table}`,
        table,
        criteria,
        totalFound: results.length,
        constraint: matchedConstraint,
        constraintColumns
      };
      
    } catch (error) {
      // If it's a constraint violation error, extract constraint name
      if (error.code === 'ER_DUP_ENTRY') {
        const constraintMatch = error.message.match(/for key '(.+)'/);
        const constraintName = constraintMatch ? constraintMatch[1] : 'unknown';
        
        return {
          isDuplicate: true,
          data: null,
          status: 'duplicate',
          message: `Duplicate record found in ${table} (violates ${constraintName} constraint)`,
          table,
          criteria,
          totalFound: 1,
          constraint: constraintName,
          error
        };
      }
      
      return {
        isDuplicate: false,
        data: null,
        status: 'error',
        message: `Error checking duplicates in ${table}: ${error.message}`,
        table,
        criteria,
        error
      };
    }
  }

  /**
   * Check multiple foreign keys at once
   * @param {Object} db - Database connection
   * @param {Array} foreignKeys - Array of foreign key checks
   * @returns {Object} { allExist, results, failed }
   */
  static async checkMultipleForeignKeys(db, foreignKeys) {
    const results = [];
    const failed = [];

    for (const fk of foreignKeys) {
      const { table, column, value, options = {} } = fk;
      const result = await this.checkForeignKey(db, table, column, value, options);
      results.push(result);
      
      if (!result.exists) {
        failed.push(result);
      }
    }

    return {
      allExist: failed.length === 0,
      results,
      failed,
      totalChecks: foreignKeys.length,
      passedChecks: foreignKeys.length - failed.length
    };
  }

  /**
   * Check multiple duplicate criteria at once
   * @param {Object} db - Database connection
   * @param {string} table - Table name
   * @param {Array} criteriaList - Array of criteria objects
   * @param {Object} options - Additional options
   * @returns {Object} { hasDuplicates, results, duplicates }
   */
  static async checkMultipleDuplicates(db, table, criteriaList, options = {}) {
    const results = [];
    const duplicates = [];

    for (const criteria of criteriaList) {
      const result = await this.checkDuplicate(db, table, criteria, options);
      results.push(result);
      
      if (result.isDuplicate) {
        duplicates.push(result);
      }
    }

    return {
      hasDuplicates: duplicates.length > 0,
      results,
      duplicates,
      totalChecks: criteriaList.length,
      duplicateCount: duplicates.length
    };
  }

  /**
   * Validate foreign keys and duplicates in one call
   * @param {Object} db - Database connection
   * @param {Array} foreignKeys - Foreign key checks
   * @param {string} table - Table for duplicate check
   * @param {Object} duplicateCriteria - Criteria for duplicate check
   * @param {Object} options - Additional options
   * @returns {Object} Combined validation result
   */
  static async validateConstraints(db, foreignKeys, table, duplicateCriteria, options = {}) {
    const { excludeId } = options;
    
    // Check foreign keys
    const fkCheck = await this.checkMultipleForeignKeys(db, foreignKeys);
    
    // Check duplicates
    const duplicateCheck = await this.checkDuplicate(db, table, duplicateCriteria, { excludeId });
    
    const isValid = fkCheck.allExist && !duplicateCheck.isDuplicate;
    
    return {
      isValid,
      foreignKeys: fkCheck,
      duplicates: duplicateCheck,
      errors: [
        ...fkCheck.failed,
        ...(duplicateCheck.isDuplicate ? [duplicateCheck] : [])
      ],
      summary: {
        totalChecks: fkCheck.totalChecks + 1,
        passedChecks: fkCheck.passedChecks + (duplicateCheck.isDuplicate ? 0 : 1),
        failedChecks: fkCheck.failed.length + (duplicateCheck.isDuplicate ? 1 : 0)
      }
    };
  }

  /**
   * Build ORDER BY clause
   * @param {Object} query - Query parameters
   * @param {Object} options - Configuration options
   * @returns {string} orderByClause
   */
  static buildOrderBy(query = {}, options = {}) {
    const {
      defaultSort = 'created_at',
      defaultOrder = 'DESC',
      allowedSorts = ['created_at', 'updated_at', 'name', 'email', 'status', 'amount'],
      tablePrefix = ''
    } = options;
    
    let sortBy = query.sortBy || defaultSort;
    let sortOrder = query.sortOrder || defaultOrder;
    
    // Validate sort field
    if (!allowedSorts.includes(sortBy)) {
      sortBy = defaultSort;
    }
    
    // Validate sort order
    sortOrder = sortOrder.toUpperCase();
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      sortOrder = defaultOrder;
    }
    
    return `ORDER BY ${tablePrefix}${sortBy} ${sortOrder}`;
  }

  /**
   * Build complete query with WHERE, ORDER BY, and LIMIT
   * @param {Object} query - Query parameters
   * @param {Object} options - Configuration options
   * @returns {Object} { whereClause, params, orderBy, limit, offset }
   */
  static buildQuery(query = {}, options = {}) {
    const { whereOptions = {}, paginationOptions = {}, orderOptions = {} } = options;
    
    // Build WHERE clause
    const { whereClause, params } = this.buildWhereClause(query, whereOptions);
    
    // Build pagination
    const { page, limit, offset } = this.buildPagination(query, paginationOptions);
    
    // Build ORDER BY
    const orderBy = this.buildOrderBy(query, orderOptions);
    
    return {
      whereClause,
      params,
      orderBy,
      limit,
      offset,
      page
    };
  }

  /**
   * Common filter configurations for different resources
   */
  static FILTER_CONFIGS = {
    users: {
      searchFields: ['names', 'email', 'phone'],
      allowedSorts: ['created_at', 'updated_at', 'names', 'email', 'role'],
      tablePrefix: 'u.'
    },
    
    applications: {
      searchFields: ['names', 'email', 'phone'],
      allowedSorts: ['created_at', 'updated_at', 'names', 'email', 'status'],
      tablePrefix: 'a.'
    },
    
    tontines: {
      searchFields: ['name', 'description'],
      allowedSorts: ['created_at', 'updated_at', 'name', 'status'],
      tablePrefix: 't.'
    },
    
    contributions: {
      searchFields: ['names', 'email'],
      allowedSorts: ['created_at', 'updated_at', 'amount', 'payment_status'],
      tablePrefix: 'c.'
    },
    
    loans: {
      searchFields: ['names', 'email'],
      allowedSorts: ['created_at', 'updated_at', 'loan_amount', 'status'],
      tablePrefix: 'l.'
    },
    
    payments: {
      searchFields: ['names', 'email'],
      allowedSorts: ['created_at', 'updated_at', 'amount', 'payment_status'],
      tablePrefix: 'p.'
    },
    
    notifications: {
      searchFields: ['title', 'message'],
      allowedSorts: ['created_at', 'updated_at', 'title', 'type', 'is_read'],
      tablePrefix: 'n.'
    },
    
    meetings: {
      searchFields: ['title', 'description'],
      allowedSorts: ['created_at', 'updated_at', 'meeting_date', 'title', 'status'],
      tablePrefix: 'm.'
    },
    
    members: {
      searchFields: ['names', 'email', 'phone'],
      allowedSorts: ['created_at', 'updated_at', 'names', 'status'],
      tablePrefix: 'tm.'
    }
  };

  /**
   * Get filter configuration for a specific resource
   * @param {string} resource - Resource name
   * @returns {Object} Filter configuration
   */
  static getFilterConfig(resource) {
    return this.FILTER_CONFIGS[resource] || {
      searchFields: ['name'],
      allowedSorts: ['created_at', 'updated_at'],
      tablePrefix: ''
    };
  }

  // Alias methods for more intuitive naming
  /**
   * Alias for checkForeignKey - returns boolean if foreign key exists
   * @param {Object} db - Database connection
   * @param {string} table - Foreign table name
   * @param {string} column - Foreign column name
   * @param {mixed} value - Value to check
   * @param {Object} options - Additional options
   * @returns {boolean} true if foreign key exists, false otherwise
   */
  static async isForeignKey(db, table, column, value, options = {}) {
    const result = await this.checkForeignKey(db, table, column, value, options);
    return result.exists;
  }

  /**
   * Alias for checkDuplicate - returns boolean if duplicate exists
   * @param {Object} db - Database connection
   * @param {string} table - Table name
   * @param {Object} criteria - Criteria to check for duplicates
   * @param {Object} options - Additional options
   * @returns {boolean} true if duplicate exists, false otherwise
   */
  static async isDuplicate(db, table, criteria = {}, options = {}) {
    const result = await this.checkDuplicate(db, table, criteria, options);
    return result.isDuplicate;
  }

  /**
   * Quick foreign key validation - returns boolean with error handling
   * @param {Object} db - Database connection
   * @param {string} table - Foreign table name
   * @param {string} column - Foreign column name
   * @param {mixed} value - Value to check
   * @returns {boolean} true if foreign key exists, false otherwise
   */
  static async validateForeignKey(db, table, column, value) {
    try {
      const result = await this.checkForeignKey(db, table, column, value);
      return result.exists;
    } catch (error) {
      console.error(`Foreign key validation error for ${table}.${column}:`, error);
      return false;
    }
  }

  /**
   * Quick duplicate validation - returns boolean with error handling
   * @param {Object} db - Database connection
   * @param {string} table - Table name
   * @param {Object} criteria - Criteria to check for duplicates
   * @returns {boolean} true if duplicate exists, false otherwise
   */
  static async validateDuplicate(db, table, criteria = {}) {
    try {
      const result = await this.checkDuplicate(db, table, criteria);
      return result.isDuplicate;
    } catch (error) {
      console.error(`Duplicate validation error for ${table}:`, error);
      return false;
    }
  }
}

module.exports = QueryHelpers;
