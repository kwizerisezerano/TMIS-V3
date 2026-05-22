/**
 * Test Database Migration Setup
 * Creates database schema for testing
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

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up test database schema...');
    
    // Connect to test database
    connection = await mysql.createConnection(TEST_DB_CONFIG);
    console.log('✅ Connected to test database');

    // Create tables one by one to avoid SQL syntax issues
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        names VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'president', 'member') DEFAULT 'member',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS tontines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        president_id INT NOT NULL,
        max_members INT NOT NULL DEFAULT 10,
        contribution_amount DECIMAL(10,2) NOT NULL,
        frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
        status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (president_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tontine_id INT NOT NULL,
        role ENUM('member', 'president') DEFAULT 'member',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        UNIQUE KEY unique_member (user_id, tontine_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        tontine_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        contribution_date DATE NOT NULL,
        status ENUM('paid', 'pending', 'overdue') DEFAULT 'paid',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tontine_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INT,
        review_date TIMESTAMP NULL,
        review_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        tontine_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        interest_rate DECIMAL(5,2) DEFAULT 0.00,
        duration_months INT NOT NULL,
        purpose TEXT,
        status ENUM('pending', 'approved', 'rejected', 'disbursed', 'repaid') DEFAULT 'pending',
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by INT,
        approval_date TIMESTAMP NULL,
        disbursed_date TIMESTAMP NULL,
        due_date TIMESTAMP NULL,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50),
        status ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tontine_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_date DATETIME NOT NULL,
        location VARCHAR(255),
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS penalties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NOT NULL,
        tontine_id INT NOT NULL,
        type ENUM('late_contribution', 'missed_meeting', 'other') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status ENUM('pending', 'paid', 'waived') DEFAULT 'pending',
        imposed_date DATE NOT NULL,
        due_date DATE,
        FOREIGN KEY (member_id) REFERENCES members(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
        status ENUM('unread', 'read') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    ];

    // Execute each table creation separately
    for (const sql of tables) {
      await connection.execute(sql);
    }

    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
