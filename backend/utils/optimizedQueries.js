/**
 * Optimized Database Queries
 * High-performance query patterns and indexing strategies
 */

class OptimizedQueries {
  constructor() {
    this.queryCache = new Map();
    this.indexSuggestions = [];
  }

  // Optimized user queries with proper indexing
  static userQueries = {
    // Get user with minimal columns (fast)
    getUserBasic: `
      SELECT id, names, email, phone, role, status 
      FROM users 
      WHERE id = ? 
      LIMIT 1
    `,
    
    // Get user for authentication (indexed)
    getUserForAuth: `
      SELECT id, names, email, phone, password, role, email_verified 
      FROM users 
      WHERE email = ? 
      LIMIT 1
    `,
    
    // List users with pagination (optimized)
    listUsers: `
      SELECT id, names, email, phone, role, email_verified, created_at 
      FROM users 
      WHERE role = COALESCE(?, role) 
        AND (names LIKE ? OR email LIKE ?)
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `,
    
    // Count users (fast)
    countUsers: `
      SELECT COUNT(*) as total 
      FROM users 
      WHERE role = COALESCE(?, role)
        AND (names LIKE ? OR email LIKE ?)
    `,
    
    // User statistics (aggregated)
    userStats: `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as members,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'president' THEN 1 END) as presidents,
        COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users
      FROM users
    `
  };

  // Optimized tontine queries
  static tontineQueries = {
    // Get tontine with member count (fast)
    getTontineWithStats: `
      SELECT t.*, 
             COUNT(DISTINCT tm.user_id) as member_count,
             COALESCE(SUM(c.amount), 0) as total_contributions
      FROM tontines t 
      LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
      LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
      WHERE t.id = ?
      GROUP BY t.id
      LIMIT 1
    `,
    
    // List tontines with pagination (optimized)
    listTontines: `
      SELECT t.*, 
             COUNT(DISTINCT tm.user_id) as member_count,
             COALESCE(SUM(c.amount), 0) as total_contributions
      FROM tontines t 
      LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
      LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
      WHERE t.status = COALESCE(?, t.status)
        AND (t.name LIKE ? OR t.description LIKE ?)
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `,
    
    // Tontine statistics (aggregated)
    tontineStats: `
      SELECT 
        COUNT(*) as total_tontines,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tontines,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_tontines,
        SUM(CASE WHEN status = 'active' THEN member_count END) as total_members,
        SUM(CASE WHEN status = 'active' THEN total_contributions END) as active_contributions
      FROM (
        SELECT t.*, 
               COUNT(DISTINCT tm.user_id) as member_count,
               COALESCE(SUM(c.amount), 0) as total_contributions
        FROM tontines t 
        LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
        LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
        GROUP BY t.id
      ) tontine_stats
    `
  };

  // Optimized contribution queries
  static contributionQueries = {
    // User contributions with tontine info (fast)
    getUserContributions: `
      SELECT c.*, t.name as tontine_name, t.contribution_amount
      FROM contributions c 
      JOIN tontines t ON c.tontine_id = t.id
      WHERE c.user_id = ? 
        AND c.payment_status = COALESCE(?, c.payment_status)
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `,
    
    // User contribution statistics (aggregated)
    userContributionStats: `
      SELECT 
        COUNT(*) as total_contributions,
        SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END) as total_contributed,
        SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) as pending_amount,
        AVG(CASE WHEN payment_status = 'Approved' THEN amount END) as avg_contribution,
        MAX(created_at) as last_contribution
      FROM contributions 
      WHERE user_id = ?
        AND tontine_id = COALESCE(?, tontine_id)
    `,
    
    // Tontine contributions with member info (optimized)
    getTontineContributions: `
      SELECT c.*, u.names as member_name, u.phone, tm.shares,
             (tm.shares * t.contribution_amount) as expected_amount
      FROM contributions c 
      JOIN users u ON c.user_id = u.id 
      JOIN tontines t ON c.tontine_id = t.id
      JOIN tontine_members tm ON c.tontine_id = tm.tontine_id AND c.user_id = tm.user_id
      WHERE c.tontine_id = ? 
        AND c.payment_status = COALESCE(?, c.payment_status)
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `
  };

  // Optimized loan queries
  static loanQueries = {
    // User loans with tontine info (fast)
    getUserLoans: `
      SELECT l.*, t.name as tontine_name, t.contribution_amount
      FROM loans l 
      JOIN tontines t ON l.tontine_id = t.id
      WHERE l.user_id = ? 
        AND l.status = COALESCE(?, l.status)
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `,
    
    // User loan statistics (aggregated)
    userLoanStats: `
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'approved' THEN loan_amount ELSE 0 END) as total_borrowed,
        SUM(CASE WHEN status = 'pending' THEN loan_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status IN ('approved', 'disbursed') THEN loan_amount ELSE 0 END) as active_loans,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_loans,
        COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans
      FROM loans 
      WHERE user_id = ?
        AND tontine_id = COALESCE(?, tontine_id)
    `,
    
    // Tontine loans with member info (optimized)
    getTontineLoans: `
      SELECT l.*, u.names as borrower_name, u.phone
      FROM loans l 
      JOIN users u ON l.user_id = u.id 
      WHERE l.tontine_id = ? 
        AND l.status = COALESCE(?, l.status)
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `
  };

  // Dashboard queries (highly optimized)
  static dashboardQueries = {
    // Executive dashboard (single query)
    executiveDashboard: `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'member') as total_members,
        (SELECT COUNT(*) FROM tontines WHERE status = 'active') as active_tontines,
        (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE payment_status = 'Approved') as total_contributions,
        (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE status IN ('approved', 'disbursed')) as total_loans,
        (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM loans WHERE status = 'pending') as pending_loans
    `,
    
    // User dashboard (single query)
    userDashboard: `
      SELECT 
        (SELECT COUNT(*) FROM tontine_members WHERE user_id = ? AND status = 'approved') as active_tontines,
        (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE user_id = ? AND payment_status = 'Approved') as total_contributions,
        (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE user_id = ? AND status IN ('approved', 'disbursed')) as total_loans,
        (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = 'pending') as pending_loans,
        (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0) as unread_notifications
    `,
    
    // Tontine dashboard (single query)
    tontineDashboard: `
      SELECT 
        (SELECT COUNT(*) FROM tontine_members WHERE tontine_id = ? AND status = 'approved') as total_members,
        (SELECT COALESCE(SUM(amount), 0) FROM contributions WHERE tontine_id = ? AND payment_status = 'Approved') as total_contributions,
        (SELECT COALESCE(SUM(loan_amount), 0) FROM loans WHERE tontine_id = ? AND status IN ('approved', 'disbursed')) as total_loans,
        (SELECT COUNT(*) FROM contributions WHERE tontine_id = ? AND payment_status = 'Pending') as pending_contributions,
        (SELECT COUNT(*) FROM loans WHERE tontine_id = ? AND status = 'pending') as pending_loans
    `
  };

  // Index recommendations for performance
  static getIndexRecommendations() {
    return [
      {
        table: 'users',
        index: 'idx_users_email',
        columns: ['email'],
        reason: 'Fast user lookup by email for authentication'
      },
      {
        table: 'users',
        index: 'idx_users_role_status',
        columns: ['role', 'email_verified'],
        reason: 'Filter users by role and verification status'
      },
      {
        table: 'tontines',
        index: 'idx_tontines_status_created',
        columns: ['status', 'created_at'],
        reason: 'Filter tontines by status with pagination'
      },
      {
        table: 'tontine_members',
        index: 'idx_tontine_members_user_tontine',
        columns: ['user_id', 'tontine_id', 'status'],
        reason: 'Fast membership checks and user tontine lookup'
      },
      {
        table: 'contributions',
        index: 'idx_contributions_user_status_date',
        columns: ['user_id', 'payment_status', 'created_at'],
        reason: 'User contribution history with pagination'
      },
      {
        table: 'contributions',
        index: 'idx_contributions_tontine_status',
        columns: ['tontine_id', 'payment_status'],
        reason: 'Tontine contribution reports'
      },
      {
        table: 'loans',
        index: 'idx_loans_user_status',
        columns: ['user_id', 'status', 'created_at'],
        reason: 'User loan history with pagination'
      },
      {
        table: 'loans',
        index: 'idx_loans_tontine_status',
        columns: ['tontine_id', 'status'],
        reason: 'Tontine loan reports'
      },
      {
        table: 'notifications',
        index: 'idx_notifications_user_read',
        columns: ['user_id', 'is_read', 'created_at'],
        reason: 'User notification lookup with pagination'
      },
      {
        table: 'applications',
        index: 'idx_applications_status_date',
        columns: ['status', 'created_at'],
        reason: 'Application reports with pagination'
      }
    ];
  }

  // Query optimization suggestions
  static getOptimizationTips() {
    return [
      'Use LIMIT clauses to prevent large result sets',
      'Avoid SELECT * in production queries',
      'Use proper indexing for WHERE and JOIN conditions',
      'Use COUNT(*) instead of COUNT(column) for row counts',
      'Use COALESCE for default values in aggregations',
      'Use prepared statements to prevent SQL injection',
      'Add EXPLAIN ANALYZE to slow queries for optimization',
      'Use appropriate data types for columns',
      'Avoid subqueries when JOINs can be used',
      'Use database-specific optimizations like covering indexes'
    ];
  }

  // Query performance analyzer
  static analyzeQuery(query, params = []) {
    const analysis = {
      query,
      params,
      recommendations: [],
      estimatedCost: 'medium',
      optimizationLevel: 'good'
    };

    // Check for common performance issues
    if (query.includes('SELECT *')) {
      analysis.recommendations.push('Avoid SELECT *, specify only needed columns');
      analysis.optimizationLevel = 'needs_improvement';
    }

    if (query.includes('WHERE') && !query.includes('LIMIT')) {
      analysis.recommendations.push('Add LIMIT clause to prevent large result sets');
      analysis.estimatedCost = 'high';
    }

    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      analysis.recommendations.push('Add LIMIT clause for sorted queries');
      analysis.estimatedCost = 'high';
    }

    if (query.includes('JOIN') && !query.includes('ON')) {
      analysis.recommendations.push('Ensure JOIN conditions are properly indexed');
      analysis.optimizationLevel = 'needs_improvement';
    }

    if (query.includes('COUNT(') && query.includes('GROUP BY')) {
      analysis.recommendations.push('Consider using COUNT(*) instead of COUNT(column)');
    }

    return analysis;
  }

  // Generate optimized query based on requirements
  static generateOptimizedQuery(table, requirements = {}) {
    const {
      columns = '*',
      conditions = [],
      joins = [],
      orderBy = 'created_at DESC',
      limit = null,
      offset = null,
      groupBy = null
    } = requirements;

    let query = `SELECT ${columns} FROM ${table}`;
    const params = [];

    // Add conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.map(condition => condition.clause).join(' AND ');
      params.push(...conditions.flatMap(condition => condition.params || []));
    }

    // Add joins
    if (joins.length > 0) {
      query += ' ' + joins.join(' ');
    }

    // Add group by
    if (groupBy) {
      query += ` GROUP BY ${groupBy}`;
    }

    // Add order by
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // Add limit and offset
    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET ?`;
      params.push(offset);
    }

    return { query, params };
  }
}

module.exports = OptimizedQueries;
