/**
 * Loans Controller
 * Handles all loan-related business logic with consistent QueryHelpers usage
 */

const { 
  validatePhone,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate,
  QueryHelpers
} = require('../utils/common');
const { decryptUserData, encryptUserData } = require('../utils/encryption');
const DatabaseHelpers = require('../utils/databaseHelpers');
const ResponseHelpers = require('../utils/responseHelpers');
const { getLoanApplicationTemplate, getLoanRequestConfirmationTemplate, getLoanStatusUpdatedTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/email');

class LoansController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  // Helper method to calculate loan interest
  // If loan amount exceeds 2/3 of contribution, apply 15% flat interest rate
  calculateLoanInterest(loanAmount, months = 6, totalContributions = 0) {
    // Parse all inputs to numbers to ensure correct calculations
    const numLoanAmount = parseFloat(loanAmount);
    const numMonths = parseInt(months, 10);
    const numTotalContributions = parseFloat(totalContributions);
    
    const twoThirdsOfContribution = (numTotalContributions * 2) / 3;
    
    if (numLoanAmount > twoThirdsOfContribution && numTotalContributions > 0) {
      // Apply 15% flat interest rate for loans exceeding 2/3 of contribution
      const flatRate = 15; // 15% flat
      const totalInterest = (numLoanAmount * flatRate) / 100;
      return {
        monthlyInterest: totalInterest / numMonths,
        totalInterest,
        totalAmount: numLoanAmount + totalInterest,
        interestRate: flatRate,
        isExceedsLimit: true
      };
    }
    
    // Normal interest rate: 1.7% per month as per Article 28
    const monthlyRate = 1.7;
    const monthlyInterest = (numLoanAmount * monthlyRate) / 100;
    return {
      monthlyInterest,
      totalInterest: monthlyInterest * numMonths,
      totalAmount: numLoanAmount + (monthlyInterest * numMonths),
      interestRate: monthlyRate,
      isExceedsLimit: false
    };
  }

  // Helper method to calculate increased interest for overdue loans (3.4% after 3 months as per Article 28)
  calculateOverdueInterest(loanAmount, monthsOverdue) {
    if (monthsOverdue <= 3) {
      // Normal interest rate for first 3 months
      return this.calculateLoanInterest(loanAmount, monthsOverdue);
    }
    
    // After 3 months, interest rate doubles to 3.4% per month
    const normalMonths = 3;
    const increasedMonths = monthsOverdue - 3;
    const normalRate = 1.7;
    const increasedRate = 3.4;
    
    const normalInterest = (loanAmount * normalRate * normalMonths) / 100;
    const increasedInterest = (loanAmount * increasedRate * increasedMonths) / 100;
    const totalInterest = normalInterest + increasedInterest;
    
    return {
      normalInterest,
      increasedInterest,
      totalInterest,
      totalAmount: loanAmount + totalInterest,
      effectiveRate: (totalInterest / loanAmount) * 100 / monthsOverdue
    };
  }

  // Helper method to calculate max loan amount
  calculateMaxLoanAmount(totalContributions) {
    return (totalContributions * 2) / 3; // 2/3 of total contributions
  }

  // Consolidated loans endpoint with QueryHelpers
  async getLoans(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        userId, 
        tontineId,
        loanId,
        includeStats = false 
      } = req.query;

      // If specific loanId requested, return single loan
      if (loanId) {
        return this.getLoanById(req, res);
      }

      // Build where clause using QueryHelpers
      const filterConfig = QueryHelpers.getFilterConfig('loans');
      const { whereClause, params } = QueryHelpers.buildWhereClause({
        status,
        userId,
        tontineId
      }, {
        tablePrefix: 'l.',
        searchFields: filterConfig.searchFields
      });

      // Build pagination using QueryHelpers
      const pagination = QueryHelpers.buildPagination(req.query, { defaultLimit: 20, maxLimit: 100 });

      // Build complete query with proper clause ordering (JOIN before WHERE)
      const joinClause = 'JOIN users u ON l.user_id = u.id JOIN tontines t ON l.tontine_id = t.id';
      const offset = (pagination.page - 1) * pagination.limit;

      // Get data with proper clause ordering
      const dataQuery = `SELECT l.*, u.names as user_name, u.names as member_name, u.phone as user_phone, t.name as tontine_name
        FROM loans l
        ${joinClause}
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?`;

      const [data] = await this.db.execute(dataQuery, [...params, parseInt(pagination.limit), offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM loans l ${joinClause} ${whereClause}`;
      const [countResult] = await this.db.execute(countQuery, params);
      const total = countResult[0].total;

      const result = {
        data,
        pagination: {
          page: parseInt(pagination.page),
          limit: parseInt(pagination.limit),
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      };

      // Decrypt user data
      const decryptedLoans = result.data.map(loan => ({
        ...loan,
        user_name: loan.user_name ? decryptUserData({names: loan.user_name}).names : loan.user_name,
        member_name: loan.member_name ? decryptUserData({names: loan.member_name}).names : loan.member_name
      }));

      // Include statistics if requested
      if (includeStats === 'true') {
        const [stats] = await this.db.execute(`
          SELECT 
            COUNT(*) as total_loans,
            SUM(CASE WHEN status IN ('approved', 'disbursed') THEN amount ELSE 0 END) as total_disbursed,
            AVG(amount) as avg_loan_amount
          FROM loans l 
          ${whereClause}
        `, params);
        
        result.data = {
          loans: decryptedLoans,
          stats: stats[0] || { total_loans: 0, total_disbursed: 0, avg_loan_amount: 0 }
        };
      } else {
        result.data = decryptedLoans;
      }

      // Build complete pagination response
      const paginationResponse = QueryHelpers.buildPaginationResponse(
        result.pagination.total, 
        pagination
      );

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, paginationResponse));

    } catch (error) {
      console.error('Error fetching loans:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch loans');
    }
  }

  // Get loan by ID (used by consolidated endpoint)
  async getLoanById(req, res) {
    try {
      const { loanId } = req.params;

      // Validate loanId
      if (!loanId || isNaN(loanId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid loan ID is required');
      }

      // Check if loan exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'loans', 'id', loanId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      // Get loan details
      const [loans] = await this.db.execute(`
        SELECT l.*, u.names as user_name, u.phone as user_phone, t.name as tontine_name
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN tontines t ON l.tontine_id = t.id
        WHERE l.id = ?
      `, [loanId]);

      if (loans.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      const decryptedLoan = {
        ...loans[0],
        user_name: loans[0].user_name ? decryptUserData({names: loans[0].user_name}).names : loans[0].user_name
      };

      return ResponseHelpers.sendSuccessResponse(res, decryptedLoan);

    } catch (error) {
      console.error('Error fetching loan:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch loan');
    }
  }

  // Get loans for a user
  async getUserLoans(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      let whereClause = 'WHERE l.user_id = ?';
      let params = [userId];

      if (status) {
        whereClause += ' AND l.status = ?';
        params.push(status);
      }

      // Get user's loans with tontine details
      const [loans] = await this.db.execute(`
        SELECT l.*, t.name as tontine_name, t.contribution_amount
        FROM loans l 
        JOIN tontines t ON l.tontine_id = t.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM loans l 
        ${whereClause}
      `, params.slice(0, -2)); // Remove limit and offset for count

      // Calculate statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_loans,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_borrowed,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'approved' AND due_date < CURDATE() THEN amount ELSE 0 END) as overdue_amount
        FROM loans l 
        ${whereClause}
      `, params.slice(0, -2));

      return res.json(SUCCESS_RESPONSES.ok({
        loans,
        stats: stats[0] || {
          total_loans: 0,
          total_borrowed: 0,
          pending_amount: 0,
          overdue_amount: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching user loans:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch loans'));
    }
  }

  // Get loans for a tontine
  async getTontineLoans(req, res) {
    try {
      const { tontineId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      let whereClause = 'WHERE l.tontine_id = ?';
      let params = [tontineId];

      if (status) {
        whereClause += ' AND l.status = ?';
        params.push(status);
      }

      // Get tontine loans with user details
      const [loans] = await this.db.execute(`
        SELECT l.*, u.names as user_name, u.phone as user_phone
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM loans l 
        ${whereClause}
      `, params.slice(0, -2)); // Remove limit and offset for count

      // Decrypt user data
      const decryptedLoans = loans.map(loan => {
        try {
          return {
            ...loan,
            user_name: loan.user_name ? decryptUserData({ names: loan.user_name }).names : loan.user_name,
            user_phone: loan.user_phone ? decryptUserData({ phone: loan.user_phone }).phone : loan.user_phone
          };
        } catch (error) {
          return loan;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok({
        loans: decryptedLoans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching tontine loans:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch loans'));
    }
  }

  async requestLoan(req, res) {
    try {
      const { userId, user_id, tontineId, tontine_id, loanAmount, loan_amount, amount, phoneNumber, phone_number, purpose, repaymentPeriod, repayment_period, guarantors } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;
      const finalTontineId = tontineId || tontine_id;
      const finalLoanAmount = (loanAmount || loan_amount || amount) !== undefined ? parseFloat(loanAmount || loan_amount || amount) : null;
      const finalPhoneNumber = phoneNumber || phone_number;
      const finalRepaymentPeriod = repaymentPeriod || repayment_period || 6;

      // Validate required fields
      if (!finalUserId || !finalTontineId || !finalLoanAmount || !finalPhoneNumber) {
        return res.status(400).json(ERROR_RESPONSES.validation('All required fields must be provided'));
      }

      // Validate foreign keys using QueryHelpers
      if (!(await QueryHelpers.isForeignKey(this.db, 'users', 'id', finalUserId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'User not found');
      }

      if (!(await QueryHelpers.isForeignKey(this.db, 'tontines', 'id', finalTontineId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }

      // Validate phone number
      const phoneValidation = validatePhone(finalPhoneNumber);
      if (!phoneValidation.valid) {
        return ResponseHelpers.sendValidationResponse(res, phoneValidation.message);
      }

      // Validate loan amount
      if (isNaN(finalLoanAmount) || finalLoanAmount <= 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid loan amount is required');
      }

      // Check if user is member of tontine
      const [membership] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE user_id = ? AND tontine_id = ? AND status = ?',
        [finalUserId, finalTontineId, 'approved']
      );

      if (membership.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'User is not an approved member of this tontine');
      }

      // Check if tontine is active
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [finalTontineId, 'active']
      );

      if (tontine.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Tontine is not active');
      }

      // Check for duplicate active loan for this user in this tontine
      const duplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'loans', {
        user_id: finalUserId,
        tontine_id: finalTontineId,
        status: 'Pending'
      });

      if (duplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          'User already has an active loan request for this tontine'
        );
      }

      // Also check for approved loans
      const approvedDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'loans', {
        user_id: finalUserId,
        tontine_id: finalTontineId,
        status: 'Approved'
      });

      if (approvedDuplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          'User already has an approved loan for this tontine'
        );
      }

      // Calculate user's total contributions
      const [contributions] = await this.db.execute(`
        SELECT SUM(amount) as total_contributions
        FROM contributions 
        WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'
      `, [finalUserId, finalTontineId]);

      const totalContributions = contributions[0].total_contributions || 0;
      const maxLoanAmount = this.calculateMaxLoanAmount(totalContributions);

      // Calculate interest and due date (pass totalContributions to determine if 15% rate applies)
      const interest = this.calculateLoanInterest(finalLoanAmount, finalRepaymentPeriod, totalContributions);
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + finalRepaymentPeriod);
      const dueDateStr = dueDate.toISOString().slice(0, 10); // Format as YYYY-MM-DD

      // Process guarantors if provided - encrypt names and phone numbers
      let guarantorsJson = null;
      if (guarantors && Array.isArray(guarantors) && guarantors.length > 0) {
        const encryptedGuarantors = guarantors.map(g => {
          const encrypted = encryptUserData({
            names: g.name || g.names,
            phone: g.phone || g.phoneNumber
          });
          return {
            names: encrypted.names,
            phone: encrypted.phone
          };
        });
        guarantorsJson = JSON.stringify(encryptedGuarantors);
      }

      // Insert loan request with the actual interest rate used
      const [result] = await this.db.execute(`
        INSERT INTO loans (user_id, tontine_id, amount, interest_rate, total_amount, repayment_period, phone_number, guarantors, due_date, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [finalUserId, finalTontineId, finalLoanAmount, interest.interestRate, interest.totalAmount, 
          finalRepaymentPeriod, finalPhoneNumber, guarantorsJson, dueDateStr, 'Pending', getCurrentUTCDate()]);

      // Get user and admin details for notifications
      const [user] = await this.db.execute('SELECT * FROM users WHERE id = ?', [finalUserId]);
      const [admins] = await this.db.execute(
        'SELECT * FROM users WHERE role IN (?, ?)',
        ['admin', 'president']
      );

      const decryptedUser = decryptUserData(user[0]);

      // Send confirmation email to the applicant
      try {
        const applicantEmailHtml = getLoanRequestConfirmationTemplate(
          {
            loanAmount: finalLoanAmount,
            repaymentPeriod: finalRepaymentPeriod
          },
          decryptedUser
        );

        await sendEmail(
          decryptedUser.email,
          'Loan Request Received - The Future',
          applicantEmailHtml
        );
      } catch (emailError) {
        console.error('Loan confirmation email failed:', emailError);
      }

      // Send email notifications to admins
      try {
        const emailHtml = getLoanApplicationTemplate(
          { loanAmount: finalLoanAmount, phoneNumber: finalPhoneNumber, purpose }, 
          decryptedUser
        );

        for (const admin of admins) {
          try {
            const decryptedAdmin = decryptUserData(admin);
            await sendEmail(decryptedAdmin.email, 'New Loan Application', emailHtml);
          } catch (emailError) {
            console.error('Failed to send email to admin:', emailError);
          }
        }
      } catch (emailError) {
        console.error('Loan application email failed:', emailError);
      }

      // Create notification for the member who applied
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        finalUserId,
        'Loan Application Received',
        `Your loan application of RWF ${finalLoanAmount.toLocaleString()} has been received successfully. We'll review it and get back to you within 48 hours.`,
        'loan',
        getCurrentUTCDate()
      ]);

      // Create notifications for admins
      for (const admin of admins) {
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          admin.id,
          'New Loan Application',
          `A loan application of RWF ${finalLoanAmount.toLocaleString()} has been submitted by ${decryptedUser.names || 'a member'}.`,
          'loan',
          getCurrentUTCDate()
        ]);
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { loanId: result.insertId },
        'Loan application submitted successfully'
      ));

    } catch (error) {
      console.error('Error requesting loan:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to submit loan application'));
    }
  }

  // Update loan status (approve/reject)
  async updateLoanStatus(req, res) {
    try {
      const { loanId } = req.params;
      const { status, notes, approvedBy } = req.body;

      // Validate loanId
      if (!loanId || isNaN(loanId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid loan ID is required');
      }

      // Validate foreign key - check if loan exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'loans', 'id', loanId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      // Validate approvedBy if provided
      if (approvedBy && !(await QueryHelpers.isForeignKey(this.db, 'users', 'id', approvedBy))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Approving user not found');
      }

      // Validate status - include 'Waiting' and 'Received' for the loan approval workflow
      if (!status || !['pending', 'approved', 'waiting', 'received', 'disbursed', 'rejected', 'completed', 'defaulted'].includes(status)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid status is required (pending, approved, waiting, received, disbursed, rejected, completed, defaulted)');
      }

      // Get loan details
      const [loans] = await this.db.execute(
        'SELECT * FROM loans WHERE id = ?',
        [loanId]
      );

      if (loans.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Loan not found'));
      }

      // Check if status is actually changing
      const oldStatus = loans[0].status;
      const newStatus = status;

      if (oldStatus.toLowerCase() === newStatus.toLowerCase()) {
        // No status change, just return success
        return res.json(SUCCESS_RESPONSES.ok(null, 'Loan status is already ' + status));
      }

      // Update loan status
      const [result] = await this.db.execute(
        'UPDATE loans SET status = ? WHERE id = ?',
        [status, loanId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Loan not found'));
      }

      // Create notification for user based on status change
      let notificationType = 'info';
      let notificationMessage = `Your loan status has been updated to: ${status}`;

      if (status === 'approved' || status === 'waiting') {
        notificationType = 'success';
        notificationMessage = `Great news! Your loan application of RWF ${loans[0].amount} has been approved. Please confirm receipt once you receive the funds.`;
      } else if (status === 'received') {
        notificationType = 'success';
        notificationMessage = `Your loan of RWF ${loans[0].amount} has been confirmed as received. Repayment is due on ${loans[0].due_date}.`;
      } else if (status === 'disbursed') {
        notificationType = 'success';
        notificationMessage = `Your loan of RWF ${loans[0].amount} has been disbursed successfully. Repayment is due on ${loans[0].due_date}.`;
      } else if (status === 'rejected') {
        notificationType = 'error';
        notificationMessage = `Your loan application of RWF ${loans[0].amount} has been rejected. ${notes || ''}`;
      }

      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        loans[0].user_id,
        'Loan Status Updated',
        notificationMessage,
        notificationType,
        getCurrentUTCDate()
      ]);

      // Get tontine name for email
      const [tontine] = await this.db.execute(
        'SELECT name FROM tontines WHERE id = ?',
        [loans[0].tontine_id]
      );

      // Send email for ALL statuses
      const [users] = await this.db.execute(
        'SELECT names, email FROM users WHERE id = ?',
        [loans[0].user_id]
      );

      if (users.length > 0) {
        let userName = users[0].names;
        let userEmail = users[0].email;
        try {
          const decryptedUser = decryptUserData({ names: userName, email: userEmail });
          userName = decryptedUser.names;
          userEmail = decryptedUser.email;
        } catch (e) {
          // If decryption fails, use original values
        }

        const emailTemplate = getLoanStatusUpdatedTemplate({
          loanId: loanId,
          amount: loans[0].amount,
          dueDate: loans[0].due_date,
          notes: notes || ''
        }, userName, status, tontine[0]?.name || 'tontine');

        sendEmail(userEmail, 'Loan Status Updated - The Future', emailTemplate)
          .then(() => console.log(`Loan status email sent to ${userEmail} (user ID: ${loans[0].user_id})`))
          .catch(err => console.error(`Failed to send loan status email to ${userEmail} (user ID: ${loans[0].user_id}):`, err));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Loan status updated successfully'));

    } catch (error) {
      console.error('Error updating loan status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update loan status'));
    }
  }

  // Get loan by ID
  async getLoanById(req, res) {
    try {
      const { loanId } = req.params;

      // Validate loanId
      if (!loanId || isNaN(loanId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid loan ID is required'));
      }

      // Get loan details
      const [loans] = await this.db.execute(`
        SELECT l.*, u.names as user_name, u.phone as user_phone, u.email as user_email,
               t.name as tontine_name, t.contribution_amount
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN tontines t ON l.tontine_id = t.id
        WHERE l.id = ?
      `, [loanId]);

      if (loans.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Loan not found'));
      }

      // Get loan repayments from payments table
      const [repayments] = await this.db.execute(`
        SELECT * FROM payments 
        WHERE loan_id = ? AND payment_type = 'loan_payment'
        ORDER BY created_at DESC
      `, [loanId]);

      // Decrypt user data and guarantors
      const loanData = loans[0];
      let decryptedGuarantors = null;
      if (loanData.guarantors) {
        try {
          const guarantorsArray = JSON.parse(loanData.guarantors);
          decryptedGuarantors = guarantorsArray.map(g => ({
            names: g.names ? decryptUserData({ names: g.names }).names : null,
            phone: g.phone ? decryptUserData({ phone: g.phone }).phone : null
          }));
        } catch (e) {
          console.error('Failed to decrypt guarantors:', e);
        }
      }

      const decryptedLoan = {
        ...loanData,
        user_name: loanData.user_name ? decryptUserData({ names: loanData.user_name }).names : loanData.user_name,
        user_phone: loanData.user_phone ? decryptUserData({ phone: loanData.user_phone }).phone : loanData.user_phone,
        user_email: loanData.user_email ? decryptUserData({ email: loanData.user_email }).email : loanData.user_email,
        guarantors: decryptedGuarantors
      };

      return res.json(SUCCESS_RESPONSES.ok({
        ...decryptedLoan,
        repayments
      }));

    } catch (error) {
      console.error('Error fetching loan:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch loan'));
    }
  }

  // Confirm loan receipt (member confirms they received the loan funds)
  async confirmLoanReceipt(req, res) {
    try {
      const { loanId } = req.params;
      const { userId } = req.body;

      // Validate loanId
      if (!loanId || isNaN(loanId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid loan ID is required');
      }

      // Validate userId
      if (!userId || isNaN(userId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid user ID is required');
      }

      // Check if loan exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'loans', 'id', loanId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      // Get loan details with user and tontine info
      const [loans] = await this.db.execute(`
        SELECT l.*, u.names as user_name, u.email as user_email, t.name as tontine_name
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN tontines t ON l.tontine_id = t.id
        WHERE l.id = ?
      `, [loanId]);

      if (loans.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      const loan = loans[0];

      // Verify the user confirming is the loan owner
      if (loan.user_id !== parseInt(userId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Only the loan applicant can confirm receipt');
      }

      // Check if loan is in a status that allows confirmation (Approved or Waiting)
      if (!['approved', 'waiting'].includes(loan.status.toLowerCase())) {
        return ResponseHelpers.sendValidationResponse(res, 'This loan cannot be confirmed as received in its current status');
      }

      // Update loan status to received
      const [result] = await this.db.execute(
        'UPDATE loans SET status = ? WHERE id = ?',
        ['received', loanId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Loan not found'));
      }

      // Decrypt user data
      const decryptedUser = decryptUserData({
        names: loan.user_name,
        email: loan.user_email
      });

      // Get all admins and president for notifications
      const [admins] = await this.db.execute(
        'SELECT * FROM users WHERE role IN (?, ?)',
        ['admin', 'president']
      );

      // Create in-app notifications for admins
      for (const admin of admins) {
        const decryptedAdmin = decryptUserData(admin);
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          admin.id,
          'Loan Confirmed Received',
          `${decryptedUser.names} has confirmed receipt of their loan of RWF ${parseFloat(loan.amount).toLocaleString()} for ${loan.tontine_name}.`,
          'loan',
          getCurrentUTCDate()
        ]);

        // Send email notification to each admin
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9fafb; }
                .highlight { background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Loan Confirmed Received</h1>
                </div>
                <div class="content">
                  <p>Dear ${decryptedAdmin.names || 'Administrator'},</p>
                  
                  <p>This is to inform you that a member has confirmed receipt of their loan funds.</p>
                  
                  <div class="highlight">
                    <strong>Member:</strong> ${decryptedUser.names}<br>
                    <strong>Loan Amount:</strong> RWF ${parseFloat(loan.amount).toLocaleString()}<br>
                    <strong>Tontine:</strong> ${loan.tontine_name}<br>
                    <strong>Confirmed at:</strong> ${new Date().toLocaleString()}
                  </div>
                  
                  <p>The loan is now marked as "Received" and the repayment period has begun. The due date is ${new Date(loan.due_date).toLocaleDateString()}.</p>
                  
                  <p>Please update your records accordingly.</p>
                </div>
                <div class="footer">
                  <p>The Future Cooperative - Loan Management System</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await sendEmail(
            decryptedAdmin.email,
            `Loan Confirmed Received - ${decryptedUser.names}`,
            emailHtml
          );
        } catch (emailError) {
          console.error(`Failed to send loan receipt confirmation email to admin ${admin.id}:`, emailError);
        }
      }

      // Create notification for the member
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        userId,
        'Loan Receipt Confirmed',
        `You have successfully confirmed receipt of your loan of RWF ${parseFloat(loan.amount).toLocaleString()}. Repayment is due on ${new Date(loan.due_date).toLocaleDateString()}.`,
        'success',
        getCurrentUTCDate()
      ]);

      return res.json(SUCCESS_RESPONSES.ok(
        { loanId, status: 'Received' },
        'Loan receipt confirmed successfully. Admin has been notified.'
      ));

    } catch (error) {
      console.error('Error confirming loan receipt:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to confirm loan receipt');
    }
  }

  // Delete loan (admin only)
  async deleteLoan(req, res) {
    try {
      const { loanId } = req.params;

      // Validate loanId
      if (!loanId || isNaN(loanId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid loan ID is required'));
      }

      // Check if loan has repayments in payments table
      const [repayments] = await this.db.execute(
        'SELECT COUNT(*) as count FROM payments WHERE loan_id = ? AND payment_type = \'loan_payment\'',
        [loanId]
      );

      if (repayments[0].count > 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Cannot delete loan with existing repayments'));
      }

      // Delete loan
      const [result] = await this.db.execute('DELETE FROM loans WHERE id = ?', [loanId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Loan not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Loan deleted successfully'));

    } catch (error) {
      console.error('Error deleting loan:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete loan'));
    }
  }

  // Record bulk manual loans (admin only)
  async recordBulkLoans(req, res) {
    try {
      const { tontineId } = req.params;
      const { loans } = req.body;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid tontine ID is required');
      }

      // Check if tontine exists and is active
      const [tontines] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ?',
        [tontineId]
      );

      if (tontines.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }
      const tontine = tontines[0];

      // Validate loans array
      if (!Array.isArray(loans)) {
        return ResponseHelpers.sendValidationResponse(res, 'Loans must be an array');
      }

      // Process each member loan
      for (const loan of loans) {
        const { userId, amount, repaymentPeriod, status, notes } = loan;

        if (!userId || isNaN(userId)) {
          continue; // Skip invalid user ids
        }

        // If status is 'Not Granted', delete the loan record
        if (status === 'Not Granted') {
          await this.db.execute(
            'DELETE FROM loans WHERE user_id = ? AND tontine_id = ?',
            [userId, tontineId]
          );
          continue;
        }

        // Validate status value
        if (!['pending', 'approved', 'waiting', 'received', 'disbursed', 'completed'].includes(status)) {
          continue; // Skip invalid status
        }

        // Validate amount
        const finalAmount = parseFloat(amount);
        if (isNaN(finalAmount) || finalAmount < 0) {
          continue; // Skip invalid amounts
        }

        const finalRepaymentPeriod = parseInt(repaymentPeriod) || 6;

        // Calculate user's total contributions
        const [contributions] = await this.db.execute(`
          SELECT SUM(amount) as total_contributions
          FROM contributions 
          WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'
        `, [userId, tontineId]);

        const totalContributions = contributions[0].total_contributions || 0;

        // Calculate interest and due date
        const interest = this.calculateLoanInterest(finalAmount, finalRepaymentPeriod, totalContributions);
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + finalRepaymentPeriod);
        const dueDateStr = dueDate.toISOString().slice(0, 10);

        // Check if loan record already exists for this user and tontine
        const [existing] = await this.db.execute(
          'SELECT * FROM loans WHERE user_id = ? AND tontine_id = ?',
          [userId, tontineId]
        );

        if (existing.length > 0) {
          // Update existing record
          await this.db.execute(
            `UPDATE loans 
             SET amount = ?, interest_rate = ?, total_amount = ?, repayment_period = ?, due_date = ?, status = ? 
             WHERE id = ?`,
            [finalAmount, interest.interestRate, interest.totalAmount, finalRepaymentPeriod, dueDateStr, status, existing[0].id]
          );
        } else {
          // Get user's phone number
          const [users] = await this.db.execute('SELECT phone FROM users WHERE id = ?', [userId]);
          const phoneNumber = users[0]?.phone || '';

          // Insert new record
          await this.db.execute(
            `INSERT INTO loans (user_id, tontine_id, amount, interest_rate, total_amount, repayment_period, phone_number, due_date, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tontineId, finalAmount, interest.interestRate, interest.totalAmount, finalRepaymentPeriod, phoneNumber, dueDateStr, status, getCurrentUTCDate()]
          );
        }

        // Create in-app notification for the member
        const notificationTitle = 'Loan Recorded';
        const notificationMessage = `An administrator has recorded a loan of RWF ${finalAmount.toLocaleString()} for you. Status: ${status}.${notes ? ' Notes: ' + notes : ''}`;
        
        await this.db.execute(
          `INSERT INTO notifications (user_id, title, message, type, created_at) 
           VALUES (?, ?, ?, 'loan', ?)`,
          [userId, notificationTitle, notificationMessage, getCurrentUTCDate()]
        );
      }

      return ResponseHelpers.sendSuccessResponse(res, null, 'Loans saved successfully');
    } catch (error) {
      console.error('Error saving bulk loans:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to save loans');
    }
  }
}

module.exports = LoansController;
