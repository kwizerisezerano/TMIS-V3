/*  */const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'ikimina_db'
};

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    console.log('Connected to MySQL server');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ikimina_db`);
    console.log(`Database "ikimina_db" created or already exists`);
    
    await connection.end();

    // Connect to the specific database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to ikimina_db database');

    // Drop and recreate the database
    await connection.query('DROP DATABASE IF EXISTS ikimina_db');
    await connection.query('CREATE DATABASE ikimina_db');
    console.log('Database dropped and recreated');
    await connection.end();

    // Reconnect to the new database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to fresh ikimina_db database');

    // Create users table with bcrypt hashed password and encrypted sensitive fields
    await connection.execute(`
      CREATE TABLE users (
        id int(11) NOT NULL AUTO_INCREMENT,
        names text NOT NULL,                    -- Encrypted field
        email text NOT NULL UNIQUE,             -- Encrypted field  
        password varchar(255) NOT NULL,         -- Bcrypt hash (not encrypted)
        phone text NOT NULL UNIQUE,             -- Encrypted field
        role enum('member','admin','accountant') DEFAULT 'member',
        email_verified tinyint(1) DEFAULT 0,
        verification_code varchar(6) DEFAULT NULL,
        verification_key varchar(64) DEFAULT NULL,
        verification_attempts int DEFAULT 0,
        id_number text DEFAULT NULL UNIQUE,     -- Encrypted field
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id)
      )
    `);
    console.log('Users table created');

    // Create tontines table
    await connection.execute(`
      CREATE TABLE tontines (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        description text,
        contribution_amount decimal(10,2) NOT NULL DEFAULT 20000.00,
        contribution_frequency varchar(50) NOT NULL DEFAULT 'monthly',
        max_members int(11) NOT NULL DEFAULT 20,
        creator_id int(11) NOT NULL,
        parent_id int(11) DEFAULT NULL,
        start_date date,
        end_date date,
        status enum('active','inactive','completed') DEFAULT 'active',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_creator_tontine_name (creator_id, name),
        FOREIGN KEY (creator_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES tontines(id) ON DELETE SET NULL
      )
    `);
    console.log('Tontines table created');

    // Create tontine_members table
    await connection.execute(`
      CREATE TABLE tontine_members (
        id int(11) NOT NULL AUTO_INCREMENT,
        tontine_id int(11) NOT NULL,
        user_id int(11) NOT NULL,
        shares int(11) DEFAULT 1,
        joined_at timestamp NOT NULL DEFAULT current_timestamp(),
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        status enum('pending','approved','rejected') DEFAULT 'pending',
        PRIMARY KEY (id),
        UNIQUE KEY unique_tontine_user (tontine_id, user_id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Tontine members table created');

    // Create contributions table
    await connection.execute(`
      CREATE TABLE contributions (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL DEFAULT 20000.00,
        payment_method varchar(100) NOT NULL DEFAULT 'mobile_money',
        contribution_date date DEFAULT (curdate()),
        transaction_ref varchar(255) NOT NULL,
        payment_status enum('Approved','Pending','Failed') DEFAULT 'Pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_transaction_ref (transaction_ref),
        UNIQUE KEY unique_contribution_user_date (user_id, tontine_id, contribution_date),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Contributions table created');

    // Create loans table (renamed from loan_requests to match controller queries)
    await connection.execute(`
      CREATE TABLE loans (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        amount decimal(10,2) NOT NULL,
        interest_rate decimal(5,2) NOT NULL DEFAULT 1.70,
        total_amount decimal(10,2) NOT NULL,
        repayment_period int DEFAULT 6,
        due_date date DEFAULT NULL,
        phone_number varchar(20) NOT NULL,
        guarantors text DEFAULT NULL,
        status enum('Pending','Approved','Waiting','Received','Disbursed','Rejected','Repaid','Completed','Defaulted') DEFAULT 'Pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_tontine_active_loan (user_id, tontine_id, status),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Loans table created');

    // Create payments table (general purpose payment tracking for all types)
    await connection.execute(`
      CREATE TABLE payments (
        id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        tontine_id int(11) DEFAULT NULL,
        loan_id int(11) DEFAULT NULL,
        payment_type enum('contribution','loan_payment','penalty','other') DEFAULT 'contribution',
        amount decimal(10,2) NOT NULL,
        payment_method varchar(100) DEFAULT 'mobile_money',
        payment_data text DEFAULT NULL,
        status enum('pending','completed','failed','cancelled') DEFAULT 'pending',
        notes text DEFAULT NULL,
        transaction_ref varchar(255) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_transaction_ref (transaction_ref),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (loan_id) REFERENCES loans(id)
      )
    `);
    console.log('Payments table created');

    // Create notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
        \`read\` BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read_created (user_id, \`read\`, created_at)
      )
    `);

    // Create password reset tokens table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(6) NOT NULL,
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_email (email),
        INDEX idx_expires (expires_at)
      )
    `);
    console.log('Notifications table created');

    // Create penalties table
    await connection.execute(`
      CREATE TABLE penalties (
        id int(11) NOT NULL AUTO_INCREMENT,
        loan_id int(11) DEFAULT NULL,
        user_id int(11) NOT NULL,
        tontine_id int(11) NOT NULL,
        type varchar(50) NOT NULL,
        amount decimal(10,2) NOT NULL,
        reason text NOT NULL,
        status enum('pending','paid','waived') DEFAULT 'pending',
        paid_at timestamp NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_loan_penalty (user_id, loan_id, status),
        FOREIGN KEY (loan_id) REFERENCES loans(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id)
      )
    `);
    console.log('Penalties table created');

    // Create meetings table
    await connection.execute(`
      CREATE TABLE meetings (
        id int(11) NOT NULL AUTO_INCREMENT,
        tontine_id int(11) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        meeting_date datetime NOT NULL,
        location varchar(255),
        agenda text,
        status enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
        created_by int(11) NOT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_tontine_meeting_date_time (tontine_id, meeting_date),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('Meetings table created');

    // Create applications table
    await connection.execute(`
      CREATE TABLE applications (
        id int(11) NOT NULL AUTO_INCREMENT,
        names text NOT NULL,
        email text NOT NULL,
        phone text NOT NULL,
        id_number text DEFAULT NULL,
        status enum('pending','approved','rejected') DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_email (email),
        UNIQUE KEY unique_phone (phone),
        UNIQUE KEY unique_id_number (id_number)
      )
    `);
    console.log('Applications table created');

    // Create application_files table
    await connection.execute(`
      CREATE TABLE application_files (
        id int(11) NOT NULL AUTO_INCREMENT,
        application_id int(11) NOT NULL,
        filename varchar(255) NOT NULL,
        file_path varchar(500) NOT NULL,
        file_size int(11) NOT NULL,
        mime_type varchar(100) NOT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `);
    console.log('Application files table created');

    // Create meeting_attendance table
    await connection.execute(`
      CREATE TABLE meeting_attendance (
        id int(11) NOT NULL AUTO_INCREMENT,
        meeting_id int(11) NOT NULL,
        user_id int(11) NOT NULL,
        status enum('present','absent','late','excused') DEFAULT 'absent',
        arrival_time timestamp NULL,
        excuse_reason text,
        penalty_applied tinyint(1) DEFAULT 0,
       recorded_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_attendance (meeting_id, user_id),
        FOREIGN KEY (meeting_id) REFERENCES meetings(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('Meeting attendance table created');

    // Create activity_log table to track all PUT/POST actions
    await connection.execute(`
      CREATE TABLE activity_log (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) DEFAULT NULL,
        action_type ENUM('POST', 'PUT', 'DELETE') NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT(11) DEFAULT NULL,
        action_description TEXT NOT NULL,
        old_data TEXT,
        new_data TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_user_id (user_id),
        INDEX idx_action_type (action_type),
        INDEX idx_entity_type (entity_type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Activity log table created');

    // Insert default users from The Future leadership
    // Use bcrypt for password hashing (secure one-way hash)
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('future2024', 10);
    
    // Use encryption for sensitive fields (reversible encryption for names, email, phone, id_number)
    const { encryptUserData } = require('../utils/encryption');
    
    const leaders = [
      ['NDAGIJIMANA Florien', 'tabitakwizerisezerano@gmail.com', '0788570890', 'admin'], // President
      ['Dr. Athanase HATEGEKIMANA', 'kwizerisezerano@gmail.com', '0788738036', 'admin'], // V/President
      ['NIYONGOMBWA Didier', 'akayezuberna@gmail.com', '0788602741', 'accountant'], // Secretary/Accountant
      ['RUZIGANA Victor', 'victor@thefuture.com', '0788679876', 'member'], // Advisor
      ['HABIMANA Adolphe', 'adolphe@thefuture.com', '0788565026', 'member'], // Advisor
      ['KWIZERA Ivan', 'ivan@thefuture.com', '0788828128', 'member'], // Auditor President
      ['DUSABIMANA Edmond', 'edmond@thefuture.com', '0788786066', 'member'], // Auditor V/President
      ['NIYIRORA Jean Damascene', 'jean@thefuture.com', '0783107539', 'member'], // Auditor Secretary
      ['KAMANA Celestin', 'celestin@thefuture.com', '0788680791', 'member'],
      ['MUKWIYE Philippe', 'philippe@thefuture.com', '0784156785', 'member'],
      ['HABIMANA Jean Bosco', 'jeanbosco@thefuture.com', '0788616459', 'member'],
      ['UWIRINGIYIMANA Clement', 'clement@thefuture.com', '0784031935', 'member'],
      ['MUTABAZI Arsene', 'arsene@thefuture.com', '0788354338', 'member'],
      ['RUMANZI Aime', 'aime@thefuture.com', '0788474683', 'member'],
      ['HARERIMANA Germain', 'germain@thefuture.com', '0788532451', 'member']
    ];
    
    let creatorId = null;
    for (const [names, email, phone, role] of leaders) {
      // Encrypt sensitive data before insertion
      const encryptedUser = encryptUserData({
        names,
        email,
        phone,
        id_number: null
      });
      
      const [result] = await connection.execute(
        `INSERT INTO users (names, email, password, phone, role, email_verified, created_at) 
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [encryptedUser.names, encryptedUser.email, defaultPassword, encryptedUser.phone, role]
      );
      
      if (names === 'NDAGIJIMANA Florien') {
        creatorId = result.insertId; // President creates the tontine
      }
    }
    console.log('The Future leadership members created');

    // Insert default tontine "The Future" and add all members
    const [tontineResult] = await connection.execute(
      `INSERT INTO tontines (name, description, contribution_amount, contribution_frequency, 
       max_members, creator_id, start_date, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'The Future',
        'Official tontine for The Future members - Founded at Runda on 14/01/2024',
        20000.00,
        'monthly',
        20,
        creatorId,
        '2024-01-14',
        'active'
      ]
    );
    const tontineId = tontineResult.insertId;
    console.log('Default tontine "The Future" created');

    // Add all leadership members to the tontine
    const [allUsers] = await connection.execute('SELECT id FROM users');
    for (const user of allUsers) {
      await connection.execute(
        `INSERT INTO tontine_members (tontine_id, user_id, joined_at, status) 
         VALUES (?, ?, NOW(), 'approved')`,
        [tontineId, user.id]
      );
    }
    console.log('All members added to The Future tontine');

    console.log('✅ Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();