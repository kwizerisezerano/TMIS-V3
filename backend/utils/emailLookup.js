const { encrypt, decrypt } = require('./encryption');

/**
 * Secure and consistent email lookup utility
 * Handles both encrypted and plain text emails in a standardized way
 */

/**
 * Find user by email - handles both encrypted and plain text consistently
 * @param {string} email - Email to search for (plain text from frontend)
 * @param {object} db - Database connection
 * @returns {Promise<Array>} - Array of matching users
 */
async function findUserByEmail(email, db) {
  if (!email) {
    return [];
  }

  try {
    // Since emails are encrypted with random IVs, we must decrypt to compare
    // Get all users and decrypt their emails
    const [allUsers] = await db.execute('SELECT * FROM users');
    
    for (const user of allUsers) {
      try {
        // Try to decrypt email
        let decryptedEmail;
        try {
          decryptedEmail = decrypt(user.email);
        } catch (decryptError) {
          // If decryption fails, email might be plain text
          decryptedEmail = user.email;
        }
        
        if (decryptedEmail && decryptedEmail.toLowerCase() === email.toLowerCase()) {
          console.log('✅ User found via email:', email);
          return [user];
        }
      } catch (error) {
        // Skip users with errors
        console.error('❌ Error processing user email:', error.message);
        continue;
      }
    }

    console.log('❌ User not found with email:', email);
    return [];

  } catch (error) {
    console.error('❌ Error in findUserByEmail:', error);
    return [];
  }
}

/**
 * Standardize email storage - always encrypt for consistency
 * @param {string} email - Email to encrypt
 * @returns {string} - Encrypted email
 */
function standardizeEmail(email) {
  if (!email) return email;
  return encrypt(email);
}

module.exports = {
  findUserByEmail,
  standardizeEmail
};
