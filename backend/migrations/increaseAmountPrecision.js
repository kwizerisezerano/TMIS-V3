const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONEY_DECIMAL = 'DECIMAL(65,2)';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ikimina_db',
  supportBigNumbers: true,
  bigNumberStrings: true
};

const amountColumns = [
  { table: 'tontines', column: 'contribution_amount', defaultValue: '20000.00' },
  { table: 'contributions', column: 'amount', defaultValue: '20000.00' },
  { table: 'loans', column: 'amount', defaultValue: '0.00' },
  { table: 'loans', column: 'total_amount', defaultValue: '0.00' },
  { table: 'payments', column: 'amount', defaultValue: '0.00' },
  { table: 'penalties', column: 'amount', defaultValue: '0.00' }
];

async function increaseAmountPrecision() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log(`Connected to ${dbConfig.database}`);

    // Set group_concat_max_len just in case
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    for (const { table, column, defaultValue } of amountColumns) {
      // Check if column exists first
      const [cols] = await connection.execute(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [dbConfig.database, table, column]
      );

      if (cols.length > 0) {
        const defaultClause = defaultValue !== undefined ? ` DEFAULT ${defaultValue}` : '';
        await connection.execute(
          `ALTER TABLE \`${table}\` MODIFY \`${column}\` ${MONEY_DECIMAL} NOT NULL${defaultClause}`
        );
        console.log(`✅ Updated ${table}.${column} to ${MONEY_DECIMAL}`);
      } else {
        console.warn(`⚠️ Column ${table}.${column} not found, skipping...`);
      }
    }

    console.log('✨ Amount precision migration completed successfully.');
  } finally {
    await connection.end();
  }
}

increaseAmountPrecision().catch((error) => {
  console.error('Amount precision migration failed:', error);
  process.exit(1);
});
