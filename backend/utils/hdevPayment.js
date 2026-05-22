const https = require('https');
const querystring = require('querystring');

class HdevPayment {
  constructor() {
    this.apiId = process.env.HDEV_API_ID || '';
    this.apiKey = process.env.HDEV_API_KEY || '';
    this.testMode = process.env.HDEV_TEST_MODE === 'true';
    this.hostname = 'payment.hdevtech.cloud';
    this.basePath = '/api_pay/api';
  }

  configure({ apiId, apiKey, testMode } = {}) {
    if (apiId) this.apiId = apiId;
    if (apiKey) this.apiKey = apiKey;
    if (testMode !== undefined) this.testMode = testMode;
    return this;
  }

  ensureConfigured() {
    // In test mode, allow operations without credentials
    if (this.testMode) {
      return true;
    }
    if (!this.apiId || !this.apiKey) {
      throw new Error('HDEV payment credentials are not configured. Set HDEV_API_ID and HDEV_API_KEY in .env, or set HDEV_TEST_MODE=true for testing.');
    }
  }

  request(postData) {
    this.ensureConfigured();

    const encodedData = querystring.stringify(postData);
    const options = {
      hostname: this.hostname,
      path: `${this.basePath}/${this.apiId}/${this.apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(encodedData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const trimmed = responseData.trim();
            const parsed = trimmed.startsWith('{')
              ? JSON.parse(trimmed)
              : { raw_response: responseData, success: false };

            resolve(parsed);
          } catch (error) {
            resolve({ raw_response: responseData, success: false, parse_error: error.message });
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HDEV API request failed: ${error.message}`));
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('HDEV API request timeout'));
      });

      req.write(encodedData);
      req.end();
    });
  }

  pay(tel, amount, transactionRef, callbackUrl) {
    // In test mode, simulate a successful payment
    if (this.testMode) {
      console.log(`[HDEV Test Mode] Simulating payment: ${amount} RWF to ${tel}, ref: ${transactionRef}`);
      return Promise.resolve({
        success: true,
        status: 'success',
        tx_ref: transactionRef,
        message: 'Test mode - payment simulated successfully',
        test_mode: true
      });
    }
    
    return this.request({
      ref: 'pay',
      tel,
      tx_ref: transactionRef,
      amount,
      link: callbackUrl
    });
  }

  get_pay(transactionRef) {
    return this.request({
      ref: 'read',
      tx_ref: transactionRef
    });
  }

  validatePhoneNumber(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    // Support various Rwanda phone formats: 07XXXXXXX, 7XXXXXXX, 2507XXXXXXX, +2507XXXXXXX
    return /^(0?[7][2389]\d{7}|2507[2389]\d{7}|\+2507[2389]\d{7})$/.test(cleanPhone);
  }

  formatPhoneNumber(phone) {
    let cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.slice(1);
    }
    if (cleanPhone.startsWith('2507')) {
      return cleanPhone; // Already in international format
    }
    if (cleanPhone.startsWith('07')) {
      cleanPhone = `250${cleanPhone.slice(1)}`;
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      // Handle numbers like 790989830 -> 250790989830
      cleanPhone = `250${cleanPhone}`;
    }
    return cleanPhone;
  }

  getStatus(response) {
    const status = String(response?.status || response?.payment_status || '').toLowerCase();
    if (response?.success === true && !status) return 'success';
    if (response?.success === false && !status) return 'failed';
    return status;
  }

  isSuccessfulResponse(response) {
    return ['success', 'successful', 'completed', 'paid', 'approved'].includes(this.getStatus(response));
  }

  isFailedResponse(response) {
    return ['failed', 'fail', 'cancelled', 'canceled', 'rejected', 'declined', 'error'].includes(this.getStatus(response));
  }

  isPendingResponse(response) {
    return ['pending', 'processing', 'initiated'].includes(this.getStatus(response));
  }
}

module.exports = new HdevPayment();
