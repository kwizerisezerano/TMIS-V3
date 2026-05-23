/**
 * Migration to add status tracking fields to activity_log
 * and preserve existing rows.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ikimina_db'
};

async function migrateActivityLogTable() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database for activity log migration');

    const [statusColumn] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'activity_log'
        AND COLUMN_NAME = 'status'
    `, [dbConfig.database]);

    if (statusColumn.length === 0) {
      await connection.execute(`
        ALTER TABLE activity_log
        ADD COLUMN status ENUM('success', 'failure') NOT NULL DEFAULT 'success' AFTER action_description
      `);
      console.log('Added activity_log.status column');
    } else {
      console.log('activity_log.status column already exists');
    }

    const [responseStatusCodeColumn] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'activity_log'
        AND COLUMN_NAME = 'response_status_code'
    `, [dbConfig.database]);

    if (responseStatusCodeColumn.length === 0) {
      await connection.execute(`
        ALTER TABLE activity_log
        ADD COLUMN response_status_code INT(11) DEFAULT NULL AFTER status
      `);
      console.log('Added activity_log.response_status_code column');
    } else {
      console.log('activity_log.response_status_code column already exists');
    }

    console.log('Activity log migration completed successfully');
  } catch (error) {
    console.error('Activity log migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateActivityLogTable();

module.exports = migrateActivityLogTable;
