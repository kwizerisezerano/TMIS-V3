const { decrypt } = require('./encryption');

/**
 * Decrypt email address that might be single or double encrypted
 * @param {string} encryptedEmail - Possibly encrypted email
 * @returns {string} - Decrypted email address
 */
function decryptEmail(encryptedEmail) {
  if (!encryptedEmail) return encryptedEmail;
  
  try {
    // First decryption attempt
    const firstDecrypt = decrypt(encryptedEmail);
    
    // Check if the result looks like a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(firstDecrypt)) {
      console.log('✅ Email decrypted successfully (single encryption)');
      return firstDecrypt;
    }
    
    // If not a valid email, try double decryption
    console.log('🔍 Attempting double decryption...');
    try {
      const secondDecrypt = decrypt(firstDecrypt);
      if (emailRegex.test(secondDecrypt)) {
        console.log('✅ Email decrypted successfully (double encryption)');
        return secondDecrypt;
      }
    } catch (doubleDecryptError) {
      console.log('❌ Double decryption failed:', doubleDecryptError.message);
    }
    
    // If still not valid, return the first decrypt result
    console.log('⚠️ Could not get valid email format, returning first decrypt');
    return firstDecrypt;
    
  } catch (error) {
    console.error('❌ Email decryption failed:', error.message);
    return encryptedEmail; // Return original if all decryption fails
  }
}

module.exports = { decryptEmail };
