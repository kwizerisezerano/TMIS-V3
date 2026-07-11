const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ikimina_db'
  });

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS surplus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tontine_id INT NOT NULL,
        amount DECIMAL(65,2) NOT NULL,
        source ENUM('contribution','loan','penalty') NOT NULL,
        source_id INT NOT NULL,
        destination ENUM('contribution','loan','penalty') DEFAULT NULL,
        destination_id INT DEFAULT NULL,
        status ENUM('pending','allocated','used') DEFAULT 'pending',
        member_note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        allocated_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (tontine_id) REFERENCES tontines(id),
        INDEX idx_user_tontine (user_id, tontine_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ surplus table created');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

migrate();
