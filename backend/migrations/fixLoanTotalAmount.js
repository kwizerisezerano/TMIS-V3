
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

// Helper function to calculate loan interest
function calculateLoanInterest(loanAmount, months = 6, totalContributions = 0) {
  const numLoanAmount = parseFloat(loanAmount);
  const numMonths = parseInt(months, 10);
  const numTotalContributions = parseFloat(totalContributions);
  
  const twoThirdsOfContribution = (numTotalContributions * 2) / 3;
  
  if (numLoanAmount > twoThirdsOfContribution && numTotalContributions > 0) {
    const flatRate = 15;
    const totalInterest = (numLoanAmount * flatRate) / 100;
    return {
      totalAmount: numLoanAmount + totalInterest,
    };
  }
  
  const monthlyRate = 1.7;
  const monthlyInterest = (numLoanAmount * monthlyRate) / 100;
  const totalInterest = monthlyInterest * numMonths;
  return {
    totalAmount: numLoanAmount + totalInterest,
  };
}

async function fixLoanTotalAmounts() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    // Get all loans
    const [loans] = await connection.execute('SELECT * FROM loans');
    console.log(`Found ${loans.length} loans to check`);
    
    for (const loan of loans) {
      // Get user's total contributions for this tontine
      const [contributions] = await connection.execute(
        'SELECT SUM(amount) as total_contributions FROM contributions WHERE user_id = ? AND tontine_id = ? AND payment_status = "Approved"',
        [loan.user_id, loan.tontine_id]
      );
      
      const totalContributions = contributions[0].total_contributions || 0;
      
      // Recalculate total_amount
      const { totalAmount } = calculateLoanInterest(
        loan.amount,
        loan.repayment_period,
        totalContributions
      );
      
      // Update the loan
      await connection.execute(
        'UPDATE loans SET total_amount = ? WHERE id = ?',
        [totalAmount, loan.id]
      );
      
      console.log(`Updated loan ${loan.id}: total_amount set to ${totalAmount}`);
    }
    
    console.log('✅ All loan total_amount values fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing loan total amounts:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixLoanTotalAmounts();
