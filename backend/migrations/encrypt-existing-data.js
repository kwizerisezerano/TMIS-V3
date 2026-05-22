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

async function encryptExistingData() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database for encryption migration');

    // Import encryption utility
    const { encryptUserData, decryptUserData } = require('../utils/encryption');

    // Get all existing users
    const [users] = await connection.execute('SELECT * FROM users');
    console.log(`Found ${users.length} users to encrypt`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      try {
        // Check if data is already encrypted (try to decrypt)
        let isEncrypted = false;
        try {
          const decrypted = decryptUserData(user);
          // If decryption succeeds and the data looks different, it might already be encrypted
          // We'll use a simple heuristic: if the email contains special encryption characters
          isEncrypted = user.email.includes(':') || user.names.includes(':');
        } catch (error) {
          // If decryption fails, data is likely already encrypted
          isEncrypted = true;
        }

        if (isEncrypted) {
          console.log(`Skipping user ${user.id} - data appears to be already encrypted`);
          skippedCount++;
          continue;
        }

        // Encrypt the user data
        const encryptedUser = encryptUserData({
          names: user.names,
          email: user.email,
          phone: user.phone,
          id_number: user.id_number
        });

        // Update the user with encrypted data
        await connection.execute(
          'UPDATE users SET names = ?, email = ?, phone = ?, id_number = ? WHERE id = ?',
          [
            encryptedUser.names,
            encryptedUser.email,
            encryptedUser.phone,
            encryptedUser.id_number,
            user.id
          ]
        );

        console.log(`✅ Encrypted data for user ${user.id}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Failed to encrypt data for user ${user.id}:`, error.message);
      }
    }

    console.log(`\n📊 Encryption Migration Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Encrypted: ${updatedCount}`);
    console.log(`   Skipped (already encrypted): ${skippedCount}`);
    console.log(`   Failed: ${users.length - updatedCount - skippedCount}`);

    // Verify encryption by decrypting a sample
    if (updatedCount > 0) {
      console.log('\n🔍 Verifying encryption...');
      const [sampleUsers] = await connection.execute('SELECT * FROM users LIMIT 3');
      
      for (const user of sampleUsers) {
        try {
          const decrypted = decryptUserData(user);
          console.log(`✅ User ${user.id} decrypted successfully: ${decrypted.names}`);
        } catch (error) {
          console.error(`❌ Failed to decrypt user ${user.id}:`, error.message);
        }
      }
    }

    console.log('\n✅ Encryption migration completed successfully!');

  } catch (error) {
    console.error('❌ Encryption migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration if called directly
if (require.main === module) {
  encryptExistingData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { encryptExistingData };
