const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ikimina_db'
};

async function checkTriggers() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log(`Checking triggers for ${dbConfig.database}...`);
    const [triggers] = await connection.execute('SHOW TRIGGERS');
    if (triggers.length > 0) {
      console.log('Found triggers:');
      triggers.forEach(t => {
        console.log(`- Table: ${t.Table}, Event: ${t.Event}, Timing: ${t.Timing}, Statement: ${t.Statement}`);
      });
    } else {
      console.log('No triggers found.');
    }
  } catch (error) {
    console.error('Error checking triggers:', error);
  } finally {
    await connection.end();
  }
}

checkTriggers();
