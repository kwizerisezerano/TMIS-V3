const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ikimina_db',
  supportBigNumbers: true,
  bigNumberStrings: true
};

async function testPrecision() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('Testing precision for 2,000,000,000...');
    
    // Create a temporary table to test
    await connection.execute('CREATE TEMPORARY TABLE test_precision (amount DECIMAL(65,2))');
    
    const largeAmount = '2000000000.00';
    await connection.execute('INSERT INTO test_precision (amount) VALUES (?)', [largeAmount]);
    
    const [rows] = await connection.execute('SELECT amount FROM test_precision');
    console.log('Inserted:', largeAmount);
    console.log('Retrieved:', rows[0].amount);
    
    if (rows[0].amount === largeAmount) {
      console.log('✅ Precision test PASSED! Database handles 2B correctly.');
    } else {
      console.log('❌ Precision test FAILED! Value was changed.');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await connection.end();
  }
}

testPrecision();
