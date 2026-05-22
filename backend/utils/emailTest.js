/**
 * Test Email Service
 * Mock email service for testing that logs emails instead of sending them
 */

const nodemailer = require('nodemailer');

// Create a test transporter that logs emails instead of sending
const createTestTransporter = () => {
  // If in test mode, use Ethereal Email (fake SMTP for testing)
  if (process.env.NODE_ENV === 'test') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'test@ethereal.email',
        pass: process.env.EMAIL_PASS || 'testpass'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Production transporter
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const transporter = createTestTransporter();

// Test email functions that log instead of sending when in test mode
const sendVerificationEmail = async (email, code, customSubject = null) => {
  const appName = process.env.APP_NAME || 'The Future';
  
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - Verification Code to ${email}: ${code}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: customSubject || `Verify Your ${appName} Account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;"> ${appName} - Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code expires in 1 minute.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
};

const sendEmail = async (email, subject, message) => {
  const appName = process.env.APP_NAME || 'The Future';
  
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - ${subject} to ${email}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: subject,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;">${message}</div>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
};

const sendPasswordResetEmail = async (email, code) => {
  const appName = process.env.APP_NAME || 'The Future';
  
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - Password Reset Code to ${email}: ${code}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: `Password Reset Code - ${appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">🔐 Password Reset</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${code}
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Password reset email failed:', error.message);
    return false;
  }
};

const sendLoanEmail = async (email, loanData) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - Loan Notification to ${email}`);
    return true;
  }
  
  // ... rest of implementation
  console.log(`📧 Loan email would be sent to ${email}`);
  return true;
};

const sendAdminLoanNotification = async (email, loanData) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - Admin Loan Notification to ${email}`);
    return true;
  }
  
  console.log(`📧 Admin notification would be sent to ${email}`);
  return true;
};

const sendPenaltyEmail = async (email, penaltyData) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 TEST EMAIL - Penalty Notification to ${email}`);
    return true;
  }
  
  console.log(`📧 Penalty email would be sent to ${email}`);
  return true;
};

module.exports = {
  sendVerificationEmail,
  sendLoanEmail,
  sendAdminLoanNotification,
  sendEmail,
  sendPenaltyEmail,
  sendPasswordResetEmail,
  createTestTransporter
};
