/**
 * Test Database Cleanup Script
 * Cleans the test database before running tests to avoid data duplication
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD || '',
  database: process.env.TEST_DB_NAME || 'tmis_test',
  multipleStatements: true
};

async function cleanupTestDatabase() {
  let connection;
  
  try {
    console.log('🧹 Cleaning test database...');
    
    // Connect to test database
    connection = await mysql.createConnection(TEST_DB_CONFIG);
    console.log('✅ Connected to test database');

    // Get all tables in the database
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('ℹ️  No tables found in test database');
      return;
    }

    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop all tables in correct order (child tables first)
    const tableNames = tables.map(table => Object.values(table)[0]);
    const dropOrder = [
      'password_reset_tokens',
      'notifications', 
      'penalties',
      'payments',
      'loans',
      'meetings',
      'applications',
      'contributions',
      'members',
      'tontines',
      'users'
    ];
    
    console.log(`🗑️  Dropping ${tableNames.length} tables: ${dropOrder.join(', ')}`);
    
    for (const tableName of dropOrder) {
      await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Test database cleaned successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning test database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestDatabase()
    .then(() => {
      console.log('🎉 Test database cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestDatabase };
