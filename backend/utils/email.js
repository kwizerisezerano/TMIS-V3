const nodemailer = require('nodemailer');
const { getPenaltyTemplate, getMeetingScheduledTemplate, getAttendanceMarkedTemplate, getNewMemberJoinedTemplate, getNewMemberAdminNotificationTemplate } = require('./emailTemplates');

// Create transporter - clean password and use working Gmail config
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
const appName = process.env.APP_NAME || 'The Future';
const fromAddress = `"${appName}" <${process.env.EMAIL_USER}>`;

const transporterConfig = {
  service: 'gmail', // Use built-in Gmail service config
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(transporterConfig);

const sendVerificationEmail = async (email, code, customSubject = null) => {
  const mailOptions = {
    from: fromAddress,
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
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

const sendLoanEmail = async (email, loanData) => {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Loan Approval - ${appName} Tontine`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🏦 ${appName} - Loan Approval</h2>
        <p>Dear ${loanData.userName},</p>
        <p>Congratulations! Your loan request has been approved.</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Loan ID:</strong> #${loanData.loanId}</p>
          <p><strong>Approved Amount:</strong> RWF ${loanData.amount}</p>
          <p><strong>Interest Rate:</strong> 1.7% per month</p>
          <p><strong>Repayment Period:</strong> 6 months maximum</p>
        </div>
        
        <p>Please contact the tontine administrator to arrange loan disbursement and discuss repayment schedule.</p>
        
        <p>Thank you for being a valued member of ${appName} Tontine.</p>
        
        <p>Best regards,<br>${appName} Tontine Executive Committee</p>
        
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Loan email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Loan email send failed:', error);
    return false;
  }
};

const sendAdminLoanNotification = async (email, loanData, retryCount = 0) => {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Loan Request Processed - ${appName} Tontine`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🏦 ${appName} - Loan Notification</h2>
        <p>A loan request has been processed successfully.</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Member:</strong> ${loanData.userName}</p>
          <p><strong>Loan ID:</strong> #${loanData.loanId}</p>
          <p><strong>Amount:</strong> RWF ${loanData.amount}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        
        <p>Please arrange disbursement with the member.</p>
        
        <p>Best regards,<br>${appName} Tontine System</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin loan notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Admin notification failed:', error);
    
    // Retry up to 2 times with delay
    if (retryCount < 2) {
      console.log(`Retrying admin email (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendAdminLoanNotification(email, loanData, retryCount + 1);
    }
    
    return false;
  }
};

const sendEmail = async (email, subject, message, retryCount = 0) => {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: subject,
    html: message // Use the message directly (it's already HTML from emailTemplates.js)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error(`Email send failed (attempt ${retryCount + 1}):`, error.message);
    
    // Retry up to 2 times with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
      console.log(`Retrying email in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendEmail(email, subject, message, retryCount + 1);
    }
    
    return false;
  }
};

const sendPenaltyEmail = async (email, penaltyData) => {
  const htmlContent = getPenaltyTemplate(penaltyData);
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Penalty Applied - ${appName}`,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Penalty email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Penalty email send failed:', error);
    return false;
  }
};

const sendMeetingScheduledEmail = async (email, meetingData, userName) => {
  const htmlContent = getMeetingScheduledTemplate(meetingData, userName);
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `New Meeting Scheduled - ${meetingData.title} - ${appName}`,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Meeting scheduled email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Meeting scheduled email send failed:', error);
    return false;
  }
};

const sendAttendanceMarkedEmail = async (email, attendanceData, userName) => {
  const htmlContent = getAttendanceMarkedTemplate(attendanceData, userName);
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Attendance Recorded - ${attendanceData.meetingTitle} - ${appName}`,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Attendance marked email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Attendance marked email send failed:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, htmlContent, code, retryCount = 0) => {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Password Reset Code - ${appName}`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error(`Password reset email send failed (attempt ${retryCount + 1}):`, error.message);

    // Retry up to 2 times with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
      console.log(`Retrying password reset email in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendPasswordResetEmail(email, htmlContent, code, retryCount + 1);
    }

    return false;
  }
};

const sendEmailWithAttachment = async (email, subject, message, attachment, retryCount = 0) => {
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: subject,
    html: message,
    attachments: attachment ? [{
      filename: attachment.originalname,
      path: attachment.path,
      contentType: attachment.mimetype
    }] : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email with attachment sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error(`Email with attachment send failed (attempt ${retryCount + 1}):`, error.message);
    
    // Retry up to 2 times with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s
      console.log(`Retrying email in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendEmailWithAttachment(email, subject, message, attachment, retryCount + 1);
    }
    
    return false;
  }
};

const sendNewMemberEmail = async (email, memberData, tontineData, entryFeeData) => {
  const htmlContent = getNewMemberJoinedTemplate(memberData, tontineData, entryFeeData);
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'Welcome to ' + tontineData.name + ' - The Future',
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('New member email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('New member email send failed:', error);
    return false;
  }
};

const sendNewMemberAdminNotification = async (email, memberData, tontineData, entryFeeData) => {
  const htmlContent = getNewMemberAdminNotificationTemplate(memberData, tontineData, entryFeeData);
  
  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: 'New Member Joined - ' + tontineData.name,
    html: htmlContent
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin new member notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Admin new member notification failed:', error);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendLoanEmail, sendAdminLoanNotification, sendEmail, sendPenaltyEmail, sendPasswordResetEmail, sendEmailWithAttachment, sendMeetingScheduledEmail, sendAttendanceMarkedEmail, sendNewMemberEmail, sendNewMemberAdminNotification };
