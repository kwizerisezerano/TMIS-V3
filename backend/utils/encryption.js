const crypto = require('crypto');

class EncryptionUtil {
  constructor() {
    // Get encryption key from environment or generate a default one
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_SECRET || 'default-encryption-key-32-chars-long';
    this.key = crypto.scryptSync(this.secretKey, 'salt', 32);
  }

  /**
   * Encrypt sensitive data
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text (base64 encoded)
   */
  encrypt(text) {
    if (!text) return text;
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      cipher.setAAD(Buffer.from('additional-data', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv + authTag + encrypted data
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return Buffer.from(result).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedText - Encrypted text (base64 encoded)
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    // Check if text is already plain (not encrypted)
    if (!encryptedText.includes(':') && !this.looksLikeEncrypted(encryptedText)) {
      return encryptedText;
    }
    
    try {
      // Decode from base64
      const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
      const parts = decoded.split(':');
      
      if (parts.length !== 3) {
        // If it doesn't match encrypted format, return as-is (might be plain text)
        return encryptedText;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAAD(Buffer.from('additional-data', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error for:', encryptedText, error.message);
      // Return original text if decryption fails (might be plain text stored incorrectly)
      return encryptedText;
    }
  }
  
  /**
   * Check if text looks like it might be encrypted
   * @param {string} text - Text to check
   * @returns {boolean} - True if looks encrypted
   */
  looksLikeEncrypted(text) {
    if (!text) return false;
    // Check if it's base64 encoded (encrypted data is base64)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(text) && text.length > 20;
  }

  /**
   * Encrypt user object sensitive fields
   * @param {object} user - User object
   * @returns {object} - User object with encrypted sensitive fields
   */
  encryptUserData(user) {
    if (!user) return user;
    
    return {
      ...user,
      names: this.encrypt(user.names),
      email: this.encrypt(user.email),
      phone: this.encrypt(user.phone),
      id_number: user.id_number ? this.encrypt(user.id_number) : null
    };
  }

  /**
   * Decrypt user object sensitive fields
   * @param {object} user - User object with encrypted fields
   * @returns {object} - User object with decrypted sensitive fields
   */
  decryptUserData(user) {
    if (!user) return user;
    
    try {
      return {
        ...user,
        names: this.decrypt(user.names),
        email: this.decrypt(user.email),
        phone: this.decrypt(user.phone),
        id_number: user.id_number ? this.decrypt(user.id_number) : null
      };
    } catch (error) {
      console.error('Error decrypting user data:', error);
      // Return user with original data if decryption fails
      return user;
    }
  }

  /**
   * Decrypt array of users
   * @param {array} users - Array of user objects
   * @returns {array} - Array of user objects with decrypted sensitive fields
   */
  decryptUsersArray(users) {
    if (!Array.isArray(users)) return users;
    
    return users.map(user => this.decryptUserData(user));
  }
}

const encryptionUtil = new EncryptionUtil();

// Bind methods to maintain context
module.exports = {
  encrypt: encryptionUtil.encrypt.bind(encryptionUtil),
  decrypt: encryptionUtil.decrypt.bind(encryptionUtil),
  encryptUserData: encryptionUtil.encryptUserData.bind(encryptionUtil),
  decryptUserData: encryptionUtil.decryptUserData.bind(encryptionUtil),
  decryptUsersArray: encryptionUtil.decryptUsersArray.bind(encryptionUtil)
};
