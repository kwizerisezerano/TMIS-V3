/**
 * Consistent email templates for all application communications
 * Based on the application email design for brand consistency
 */

// Base email template structure with modern design
const getBaseTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 20px 20px 20px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background: #ffffff; padding: 40px 30px 0 30px; text-align: center;">
                  <img src="https://res.cloudinary.com/danzeqybu/image/upload/v1783173071/logo_yfob25.png" alt="The Future Logo" style="width: 60px; height: 60px; margin-bottom: 12px;">
                  <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">The Future</h1>
                  <p style="color: #047857; margin: 6px 0 0 0; font-size: 15px; font-weight: 500;">Digital Tontine Management System</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 30px 40px 30px;">
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Membership application email template
const getMembershipApplicationTemplate = (applicantData) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      New Membership Application
    </h2>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px;">Applicant Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Full Names:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">${applicantData.names}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Email:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">${applicantData.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Phone:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">${applicantData.phone}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;"><strong>Applied On:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #d1fae5;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Terms &amp; Conditions:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:13px;font-weight:bold;background:${applicantData.agreedToTerms ? '#d1fae5' : '#fee2e2'};color:${applicantData.agreedToTerms ? '#065f46' : '#991b1b'};">
              ${applicantData.agreedToTerms ? 'Agreed' : 'Not agreed'}
            </span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Next Steps</h3>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">
        1. Review the application details<br>
        2. Conduct background verification<br>
        3. Approve or reject the application<br>
        4. Communicate decision to applicant
      </p>
    </div>
    
   
  `;
  
  return getBaseTemplate('New Membership Application - The Future', content);
};

// Password reset email template
const getPasswordResetTemplate = (userData, verificationCode) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Password Reset Request
    </h2>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userData.names}</strong>,<br><br>
        You requested to reset your password. Use the verification code below to proceed:
      </p>
    </div>
    
    <div style="background: #f0fdf4; border: 2px dashed #10b981; padding: 30px; text-align: center; margin: 25px 0; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; color: #059669; font-size: 14px; font-weight: bold;">VERIFICATION CODE</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #059669; font-family: monospace;">
        ${verificationCode}
      </div>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Important</h3>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        • This code expires in 15 minutes<br>
        • You have maximum 3 attempts to enter the correct code<br>
        • If you exceed attempts, you'll need to request a new code
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't request this password reset, please ignore this email.
    </p>
  `;

  return getBaseTemplate('Password Reset - The Future', content);
};

// Email verification template
const getEmailVerificationTemplate = (verificationCode) => {
  const content = `
    <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px;">
      Email Verification
    </h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
      Welcome to The Future! Please verify your email address using the code below:
    </p>
    
    <div style="background: #f0f9ff; border: 2px dashed #3b82f6; padding: 30px; text-align: center; margin: 25px 0; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">VERIFICATION CODE</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3b82f6; font-family: monospace;">
        ${verificationCode}
      </div>
    </div>
    
    <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        <strong>Information:</strong><br>
        • This code expires in 15 minutes<br>
        • Keep this code secure and don't share it<br>
        • Enter the code to complete your registration
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If you didn't create an account with us, please ignore this email.
    </p>
  `;
  
  return getBaseTemplate('Email Verification - The Future', content);
};

// Welcome email template
const getWelcomeTemplate = (userData, password = null) => {
  const content = `
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Dear <strong style="color: #111827;">${userData.names}</strong>,
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
      Your account has been created successfully! You can now access our digital tontine platform and start your journey to financial prosperity.
    </p>
    
    ${password ? `
    <table role="presentation" style="width: 100%; background-color: #f0fdf4; border-radius: 8px; border: 2px solid #86efac; margin-bottom: 32px;">
      <tr>
        <td style="padding: 24px;">
          <h3 style="color: #059669; margin: 0 0 20px 0; font-size: 18px; font-weight: 700; text-align: center;">Your Login Credentials</h3>
          <table role="presentation" style="width: 100%; max-width: 400px; margin: 0 auto;">
            <tr>
              <td style="padding: 16px; background-color: #ffffff; border-radius: 6px; margin-bottom: 12px;">
                <p style="color: #065f46; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</p>
                <p style="color: #111827; font-size: 16px; font-family: monospace; margin: 0; word-break: break-all;">${userData.email}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; background-color: #ffffff; border-radius: 6px;">
                <p style="color: #065f46; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</p>
                <p style="color: #111827; font-size: 20px; font-family: monospace; margin: 0; font-weight: 700; letter-spacing: 1px;">${password}</p>
              </td>
            </tr>
          </table>
          <div style="background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px; margin-top: 20px; border-radius: 4px;">
            <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
              <strong>Important:</strong> Change your password immediately after first login for security.
            </p>
          </div>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="http://localhost:3000/login" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
        Login to Dashboard
      </a>
    </div>
    
    <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Quick Start Guide</h3>
          <p style="padding: 6px 0; color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>1.</strong> Login with your credentials<br>
            <strong>2.</strong> Change your password<br>
            <strong>3.</strong> Complete your profile<br>
            <strong>4.</strong> Start contributing to your tontine
          </p>
        </td>
      </tr>
    </table>
    
    <table role="presentation" style="width: 100%; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <tr>
        <td style="padding: 16px;">
          <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
            <strong>Security Notice:</strong> Never share your password with anyone. Our team will never ask for your password via email or phone.
          </p>
        </td>
      </tr>
    </table>
  `;
  
  return getBaseTemplate('Welcome to The Future', content);
};

// Loan application notification template
const getLoanApplicationTemplate = (loanData, userData) => {
  const content = `
    <h2 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">
      New Loan Application
    </h2>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin: 0 0 15px 0; font-size: 18px;">Loan Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;"><strong>Applicant:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">${userData.names}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;"><strong>Loan Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">RWF ${Number(loanData.loanAmount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;"><strong>Phone:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">${loanData.phoneNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Applied On:</strong></td>
          <td style="padding: 8px 0;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Review Required</h3>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">
        Please review this loan application and make a decision within 48 hours.
      </p>
    </div>
  `;
  
  return getBaseTemplate('New Loan Application - The Future', content);
};

// Loan request confirmation email template for the applicant
const getLoanRequestConfirmationTemplate = (loanData, userData) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Loan Request Received
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userData.names}</strong>,<br><br>
        Your loan request has been received successfully. You will get your loan within 48 hours.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Loan Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Loan Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(loanData.loanAmount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Repayment Period:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${loanData.repaymentPeriod} months</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Submitted On:</strong></td>
          <td style="padding: 8px 0;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
      </table>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      Thank you for using The Future Digital Tontine Management System.
    </p>
  `;

  return getBaseTemplate('Loan Request Received - The Future', content);
};

// Penalty notification email template
const getPenaltyTemplate = (penaltyData) => {
  const content = `
    <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">
      Penalty Applied
    </h2>

    <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${penaltyData.userName}</strong>,<br><br>
        A penalty has been applied to your account according to the cooperative constitution.
      </p>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Penalty Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">RWF ${penaltyData.amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;"><strong>Reason:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">${penaltyData.reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Date:</strong></td>
          <td style="padding: 8px 0;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
      </table>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 10px 0; font-size: 16px;">Next Steps</h3>
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
        Please settle this penalty as soon as possible to maintain your good standing in the cooperative. 
        You can view your penalties and make payments through your dashboard.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
        Go to Dashboard
      </a>
    </div>

    <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 16px; border-radius: 8px; margin-top: 20px;">
      <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong>Note:</strong> According to Article 36 of the cooperative constitution:<br>
        • Absence from meeting: 5,000 RWF<br>
        • Late arrival to meeting: 1,000 RWF
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      If you believe this penalty was applied in error, please contact the Executive Committee.
    </p>
  `;

  return getBaseTemplate('Penalty Notification - The Future', content);
};

// Attendance marked email template
const getAttendanceMarkedTemplate = (attendanceData, userName) => {
  const meetingDate = new Date(attendanceData.meetingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusColors = {
    present: '#10b981',
    absent: '#dc2626',
    late: '#f59e0b',
    excused: '#3b82f6'
  };

  const statusColor = statusColors[attendanceData.status] || '#6b7280';

  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Attendance Recorded
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        Your attendance has been recorded for the following meeting. Please review the details below.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Meeting & Attendance Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Meeting:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${attendanceData.meetingTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date & Time:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${meetingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Your Status:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:14px;font-weight:bold;background:${statusColor}20;color:${statusColor};">
              ${attendanceData.status.charAt(0).toUpperCase() + attendanceData.status.slice(1)}
            </span>
          </td>
        </tr>
        ${attendanceData.excuseReason ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Excuse Reason:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${attendanceData.excuseReason}</td>
        </tr>` : ''}
        ${attendanceData.penaltyApplied ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Penalty Applied:</strong></td>
          <td style="padding: 8px 0;"><span style="color: #dc2626; font-weight: bold;">Yes</span></td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 25px;">
      <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong>Important:</strong> If you believe this attendance record is incorrect, please contact the Executive Committee within 48 hours to dispute it.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      Thank you for your participation in the cooperative.
    </p>
  `;

  return getBaseTemplate('Attendance Recorded - The Future', content);
};

// Meeting scheduled email template
const getMeetingScheduledTemplate = (meetingData, userName) => {
  const meetingDate = new Date(meetingData.meetingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      New Meeting Scheduled
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        A new meeting has been scheduled for your tontine. Your attendance is important!
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Meeting Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Title:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${meetingData.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date & Time:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${meetingDate}</td>
        </tr>
        ${meetingData.location ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${meetingData.location}</td>
        </tr>` : ''}
        ${meetingData.agenda ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Agenda:</strong></td>
          <td style="padding: 8px 0;">${meetingData.agenda}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Important Notice</h3>
      <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
        <strong>Attendance is mandatory.</strong> According to Article 36 of the cooperative constitution:<br>
        • Absence from meeting: <strong>5,000 RWF</strong> penalty<br>
        • Late arrival to meeting: <strong>1,000 RWF</strong> penalty
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      We look forward to seeing you at the meeting!
    </p>
  `;

  return getBaseTemplate('Meeting Scheduled - The Future', content);
};

// Contribution approved email template (keep for backward compatibility)
const getContributionApprovedTemplate = (contributionData, userName) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Contribution Approved
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        Great news! Your contribution has been approved successfully.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Contribution Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(contributionData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tontine:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${contributionData.tontineName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date(contributionData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Status:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:#d1fae5;color:#065f46;">
              Approved
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Your Progress</h3>
      <p style="color: #1e3a8a; font-size: 14px; line-height: 1.6; margin: 0;">
        Thank you for your continued commitment to the cooperative. Your contributions help build our collective future!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
        View Dashboard
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      You can view all your contributions and account details on your dashboard.
    </p>
  `;

  return getBaseTemplate('Contribution Approved - The Future', content);
};

// Contribution status updated email template (for all statuses)
const getContributionStatusUpdatedTemplate = (contributionData, userName, status, tontineName) => {
  const statusColors = {
    'Approved': '#10b981',
    'Rejected': '#dc2626',
    'Pending': '#f59e0b',
    'Failed': '#dc2626'
  };

  const statusText = {
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Pending': 'Pending',
    'Failed': 'Failed'
  };

  const statusBgColors = {
    'Approved': '#d1fae5',
    'Rejected': '#fee2e2',
    'Pending': '#fef3c7',
    'Failed': '#fee2e2'
  };

  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Contribution Status Updated
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        An administrator has updated the status of your contribution.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Contribution Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tontine:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${tontineName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(contributionData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date(contributionData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Status:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:${statusBgColors[status]};color:${statusColors[status]};">
              ${statusText[status]}
            </span>
          </td>
        </tr>
        ${contributionData.notes ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Notes:</strong></td>
          <td style="padding: 8px 0;">${contributionData.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      If you have any questions, please contact The Future administration.
    </p>
  `;

  return getBaseTemplate('Contribution Status Updated - The Future', content);
};

// Penalty payment recorded email template (keep for backward compatibility)
const getPenaltyPaymentRecordedTemplate = (penaltyData, userName) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Penalty Payment Recorded
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        An administrator has recorded your penalty payment. Please review the details below.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Penalty Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(penaltyData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Reason:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${penaltyData.reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Status:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:#d1fae5;color:#065f46;">
              Paid
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 25px;">
      <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong>Important:</strong> If you believe this payment was recorded in error, please contact the Executive Committee.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      Thank you for your commitment to the cooperative.
    </p>
  `;

  return getBaseTemplate('Penalty Payment Recorded - The Future', content);
};

// Penalty status updated email template (for all statuses)
const getPenaltyStatusUpdatedTemplate = (penaltyData, userName, status) => {
  const statusColors = {
    'paid': '#10b981',
    'pending': '#f59e0b',
    'waived': '#6b7280'
  };

  const statusText = {
    'paid': 'Paid',
    'pending': 'Pending',
    'waived': 'Waived'
  };

  const statusBgColors = {
    'paid': '#d1fae5',
    'pending': '#fef3c7',
    'waived': '#f3f4f6'
  };

  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Penalty Status Updated
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        An administrator has updated the status of your penalty.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Penalty Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(penaltyData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Reason:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${penaltyData.reason}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Status:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:${statusBgColors[status]};color:${statusColors[status]};">
              ${statusText[status]}
            </span>
          </td>
        </tr>
        ${penaltyData.notes ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Notes:</strong></td>
          <td style="padding: 8px 0;">${penaltyData.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      If you have any questions, please contact The Future administration.
    </p>
  `;

  return getBaseTemplate('Penalty Status Updated - The Future', content);
};

// Loan payment recorded email template
const getLoanPaymentRecordedTemplate = (paymentData, userName) => {
  const statusColors = {
    pending: '#f59e0b',
    completed: '#10b981',
    failed: '#dc2626'
  };
  
  const statusLabel = paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1);
  const statusColor = statusColors[paymentData.status] || '#6b7280';
  
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Loan Payment Recorded
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        An administrator has recorded a loan payment for you. Please review the details below.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(paymentData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date(paymentData.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:${statusColor}20;color:${statusColor};">
              ${statusLabel}
            </span>
          </td>
        </tr>
        ${paymentData.notes ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Notes:</strong></td>
          <td style="padding: 8px 0;">${paymentData.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 25px;">
      <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong>Important:</strong> If you believe this payment was recorded in error, please contact the Executive Committee.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      Thank you for your commitment to repaying your loan.
    </p>
  `;

  return getBaseTemplate('Loan Payment Recorded - The Future', content);
};

// Loan status updated email template (for all statuses)
const getLoanStatusUpdatedTemplate = (loanData, userName, status, tontineName) => {
  const statusColors = {
    'approved': '#10b981',
    'waiting': '#10b981',
    'received': '#10b981',
    'disbursed': '#10b981',
    'pending': '#f59e0b',
    'rejected': '#dc2626',
    'completed': '#6b7280',
    'defaulted': '#dc2626'
  };

  const statusText = {
    'approved': 'Approved',
    'waiting': 'Waiting for Confirmation',
    'received': 'Received',
    'disbursed': 'Disbursed',
    'pending': 'Pending',
    'rejected': 'Rejected',
    'completed': 'Completed',
    'defaulted': 'Defaulted'
  };

  const statusBgColors = {
    'approved': '#d1fae5',
    'waiting': '#d1fae5',
    'received': '#d1fae5',
    'disbursed': '#d1fae5',
    'pending': '#fef3c7',
    'rejected': '#fee2e2',
    'completed': '#f3f4f6',
    'defaulted': '#fee2e2'
  };

  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Loan Status Updated
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${userName}</strong>,<br><br>
        An administrator has updated the status of your loan.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Loan Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tontine:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${tontineName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(loanData.amount).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${loanData.dueDate ? new Date(loanData.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Status:</strong></td>
          <td style="padding: 8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:bold;background:${statusBgColors[status] || '#f3f4f6'};color:${statusColors[status] || '#6b7280'};">
              ${statusText[status] || status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
        </tr>
        ${loanData.notes ? `
        <tr>
          <td style="padding: 8px 0;"><strong>Notes:</strong></td>
          <td style="padding: 8px 0;">${loanData.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      If you have any questions, please contact The Future administration.
    </p>
  `;

  return getBaseTemplate('Loan Status Updated - The Future', content);
};

// New member joined confirmation email template
const getNewMemberJoinedTemplate = (memberData, tontineData, entryFeeData) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      Welcome to ${tontineData.name}!
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        Dear <strong>${memberData.names}</strong>,<br><br>
        Congratulations! You have successfully joined "${tontineData.name}" tontine.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Membership Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tontine Name:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${tontineData.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Joined On:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Monthly Contribution:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">RWF ${Number(tontineData.contribution_amount || 20000).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Entry Fee (10%):</strong></td>
          <td style="padding: 8px 0; color: #059669; font-weight: bold;">
            RWF ${Number(entryFeeData.entryFee || 0).toLocaleString()}
            ${entryFeeData.entryFee === 0 ? '<span style="font-size: 12px; color: #6b7280; display: block;">(No accumulated contributions yet)</span>' : ''}
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Next Steps</h3>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">
        1. Contact the Executive Committee to arrange entry fee payment<br>
        2. Start making your monthly contributions<br>
        3. Attend the next General Assembly meeting
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);">
        Go to Dashboard
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      Welcome to The Future Savings Group! We're excited to have you as a member.
    </p>
  `;

  return getBaseTemplate('Welcome to ' + tontineData.name + ' - The Future', content);
};

// New member joined admin notification email template
const getNewMemberAdminNotificationTemplate = (memberData, tontineData, entryFeeData) => {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      New Member Joined!
    </h2>

    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
        A new member has joined "${tontineData.name}" tontine.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin-bottom: 25px;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Member Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Member Name:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${memberData.names}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${memberData.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Tontine:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${tontineData.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Joined On:</strong></td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Entry Fee Due:</strong></td>
          <td style="padding: 8px 0; color: #dc2626; font-weight: bold;">
            RWF ${Number(entryFeeData.entryFee || 0).toLocaleString()}
            ${entryFeeData.entryFee === 0 ? '<span style="font-size: 12px; color: #6b7280; display: block;">(No accumulated contributions yet)</span>' : ''}
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 16px;">Action Required</h3>
      <p style="color: #92400e; margin: 0; line-height: 1.6;">
        Please contact the new member to arrange entry fee payment and welcome them to the tontine.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
      This is an automated notification from The Future Digital Tontine Management System.
    </p>
  `;

  return getBaseTemplate('New Member Joined - ' + tontineData.name, content);
};

module.exports = {
  getMembershipApplicationTemplate,
  getPasswordResetTemplate,
  getEmailVerificationTemplate,
  getWelcomeTemplate,
  getLoanApplicationTemplate,
  getLoanRequestConfirmationTemplate,
  getPenaltyTemplate,
  getAttendanceMarkedTemplate,
  getMeetingScheduledTemplate,
  getContributionApprovedTemplate,
  getContributionStatusUpdatedTemplate,
  getLoanPaymentRecordedTemplate,
  getPenaltyPaymentRecordedTemplate,
  getPenaltyStatusUpdatedTemplate,
  getLoanStatusUpdatedTemplate,
  getNewMemberJoinedTemplate,
  getNewMemberAdminNotificationTemplate
};
