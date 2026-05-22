/**
 * Migration to add 'type' column to penalties table
 * This fixes the schema mismatch with the penalties controller
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'ikimina_db'
};

async function migratePenaltiesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database for penalties migration');

    // Check if 'type' column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
        AND TABLE_NAME = 'penalties' 
        AND COLUMN_NAME = 'type'
    `);

    if (columns.length === 0) {
      console.log('Adding "type" column to penalties table...');
      
      // Add the type column
      await connection.execute(`
        ALTER TABLE penalties 
        ADD COLUMN type varchar(50) NOT NULL DEFAULT 'general' AFTER tontine_id
      `);
      
      console.log('✅ "type" column added successfully');
    } else {
      console.log('✅ "type" column already exists');
    }

    // Update status enum to include 'waived'
    await connection.execute(`
      ALTER TABLE penalties 
      MODIFY COLUMN status ENUM('pending','paid','waived') DEFAULT 'pending'
    `);
    console.log('✅ Updated status enum to include "waived"');

    console.log('✅ Penalties table migration completed successfully!');

  } catch (error) {
    console.error('❌ Penalties table migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migratePenaltiesTable();

module.exports = migratePenaltiesTable;