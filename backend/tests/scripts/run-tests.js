/**
 * Test Runner Script with Database Cleanup
 * Cleans the test database before running tests to avoid data duplication
 */

const { execSync } = require('child_process');
const path = require('path');
const { cleanupTestDatabase } = require('./cleanup-test-db');

// Parse command line arguments
const args = process.argv.slice(2);
const testPattern = args[0] || 'tests'; // Default to all tests
const withCoverage = args.includes('--coverage');
const watchMode = args.includes('--watch');

async function runTests() {
  try {
    console.log('🚀 Starting test execution with database cleanup...\n');

    // Step 1: Clean test database
    await cleanupTestDatabase();
    console.log('');

    // Step 2: Run migrations to set up fresh database
    console.log('🔧 Running database migrations...');
    try {
      execSync('node tests/migrations/setup.js', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '../..') 
      });
      console.log('✅ Database migrations completed\n');
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError.message);
      process.exit(1);
    }

    // Step 3: Build Jest command
    let jestCommand = 'npx jest';
    
    if (watchMode) {
      jestCommand += ' --watch';
    }
    
    if (withCoverage) {
      jestCommand += ' --coverage --coverageDirectory=tests/coverage';
    }
    
    // Add test pattern
    jestCommand += ` ${testPattern}`;

    console.log(`🧪 Running tests: ${jestCommand}`);
    console.log('=' .repeat(60));

    // Step 4: Run tests
    try {
      execSync(jestCommand, { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '../..'),
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (testError) {
      console.error('\n❌ Tests failed:', testError.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

// Display help information
function showHelp() {
  console.log(`
📋 Test Runner Usage:

  node tests/scripts/run-tests.js [pattern] [options]

Patterns:
  tests                     Run all tests (default)
  tests/controllers         Run only controller tests
  tests/controllers/*.test.js Run specific controller test
  tests/integration         Run integration tests
  tests/middleware          Run middleware tests
  tests/utils               Run utility tests

Options:
  --coverage               Generate coverage report
  --watch                  Run tests in watch mode
  --help                   Show this help message

Examples:
  node tests/scripts/run-tests.js
  node tests/scripts/run-tests.js tests/controllers --coverage
  node tests/scripts/run-tests.js tests/controllers/authController.test.js
  node tests/scripts/run-tests.js tests/integration --watch
  `);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
