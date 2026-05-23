/**
 * Payments Controller
 * Handles all payment-related business logic with consistent QueryHelpers usage
 */

const { 
  validatePhone,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate,
  QueryHelpers
} = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');
const DatabaseHelpers = require('../utils/databaseHelpers');
const ResponseHelpers = require('../utils/responseHelpers');
const hdevPayment = require('../utils/hdevPayment');
const { getLoanPaymentRecordedTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/email');

class PaymentsController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  async handleHdevCallback(req, res) {
    try {
      const payload = req.body || {};
      const transactionRef = payload.tx_ref || payload.transaction_ref || payload.ref;

      if (!transactionRef) {
        return ResponseHelpers.sendValidationResponse(res, 'Transaction reference is required');
      }

      const statusResponse = Object.keys(payload).length > 0
        ? payload
        : await hdevPayment.get_pay(transactionRef);

      const [payments] = await this.db.execute(
        'SELECT * FROM payments WHERE transaction_ref = ? LIMIT 1',
        [transactionRef]
      );

      if (payments.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Payment not found');
      }

      const payment = payments[0];
      if (hdevPayment.isSuccessfulResponse(statusResponse)) {
        await this.db.execute(
          'UPDATE payments SET status = ?, payment_data = ? WHERE id = ?',
          ['completed', JSON.stringify(statusResponse), payment.id]
        );

        // Handle different payment types
        if (payment.payment_type === 'contribution' && payment.tontine_id) {
          // Update contribution status
          await this.db.execute(
            `UPDATE contributions
             SET payment_status = 'Approved'
             WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Pending'
             ORDER BY created_at DESC
             LIMIT 1`,
            [payment.user_id, payment.tontine_id]
          );
        }
        // Note: Loan payments and penalty payments are tracked in the payments table only
        // No separate update needed - status in payments table is the source of truth
      } else if (hdevPayment.isFailedResponse(statusResponse)) {
        await this.db.execute(
          'UPDATE payments SET status = ?, payment_data = ? WHERE id = ?',
          ['failed', JSON.stringify(statusResponse), payment.id]
        );

        if (payment.tontine_id) {
          await this.db.execute(
            `UPDATE contributions
             SET payment_status = 'Rejected'
             WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Pending'
             ORDER BY created_at DESC
             LIMIT 1`,
            [payment.user_id, payment.tontine_id]
          );
        }
      } else {
        await this.db.execute(
          'UPDATE payments SET payment_data = ? WHERE id = ?',
          [JSON.stringify(statusResponse), payment.id]
        );
      }

      return ResponseHelpers.sendSuccessResponse(res, { transactionRef }, 'HDEV callback processed');
    } catch (error) {
      console.error('Error processing HDEV callback:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to process HDEV callback'));
    }
  }

  // Consolidated payments endpoint with QueryHelpers
  async getPayments(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        status, 
        userId,
        paymentId,
        includeStats = false 
      } = req.query;

      // If specific paymentId requested, return single payment
      if (paymentId) {
        return this.getPaymentById(req, res);
      }

      // Build where clause using QueryHelpers
      const filterConfig = QueryHelpers.getFilterConfig('payments');
      let { whereClause, params } = QueryHelpers.buildWhereClause({
        status: status,
        userId
      }, {
        tablePrefix: 'p.',
        customFilters: {
          paymentType: (value) => {
            if (value) {
              whereClause += ` AND p.payment_type = ?`;
              params.push(value);
            }
          }
        }
      });

      // Add type filter if provided
      if (type) {
        whereClause += ` AND p.payment_type = ?`;
        params.push(type);
      }

      // Build pagination using QueryHelpers
      const pagination = QueryHelpers.buildPagination(req.query, { defaultLimit: 20, maxLimit: 100 });

      // Build complete query with proper clause ordering (JOIN before WHERE)
      const joinClause = 'JOIN users u ON p.user_id = u.id';
      const offset = (pagination.page - 1) * pagination.limit;

      // Get data with proper clause ordering
      const dataQuery = `SELECT p.*, u.names as user_name, u.names as member_name, u.phone as user_phone
        FROM payments p
        ${joinClause}
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`;

      const [data] = await this.db.execute(dataQuery, [...params, parseInt(pagination.limit), offset]);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM payments p ${joinClause} ${whereClause}`;
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
      const decryptedPayments = result.data.map(payment => ({
        ...payment,
        user_name: payment.user_name ? decryptUserData({names: payment.user_name}).names : payment.user_name,
        member_name: payment.member_name ? decryptUserData({names: payment.member_name}).names : payment.member_name
      }));

      // Include statistics if requested
      if (includeStats === 'true') {
        const [stats] = await this.db.execute(`
          SELECT 
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = 'Completed' THEN amount ELSE 0 END) as total_amount,
            AVG(amount) as avg_amount
          FROM payments p 
          ${whereClause}
        `, params);
        
        result.data = {
          payments: decryptedPayments,
          stats: stats[0] || { total_payments: 0, total_amount: 0, avg_amount: 0 }
        };
      } else {
        result.data = decryptedPayments;
      }

      // Build complete pagination response
      const paginationResponse = QueryHelpers.buildPaginationResponse(
        result.pagination.total, 
        pagination
      );

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, paginationResponse));

    } catch (error) {
      console.error('Error fetching payments:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch payments');
    }
  }

  // Get payment by ID (used by consolidated endpoint)
  async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;

      // Validate paymentId
      if (!paymentId || isNaN(paymentId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid payment ID is required');
      }

      // Check if payment exists
      if (!(await QueryHelpers.isForeignKey(this.db, 'payments', 'id', paymentId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Payment not found');
      }

      // Get payment details
      const [payments] = await this.db.execute(`
        SELECT p.*, u.names as user_name, u.phone as user_phone
        FROM payments p 
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [paymentId]);

      if (payments.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Payment not found');
      }

      const decryptedPayment = {
        ...payments[0],
        user_name: payments[0].user_name ? decryptUserData({names: payments[0].user_name}).names : payments[0].user_name
      };

      return ResponseHelpers.sendSuccessResponse(res, decryptedPayment);

    } catch (error) {
      console.error('Error fetching payment:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch payment');
    }
  }

  // Get payments for a user
  async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate userId
      if (!userId || isNaN(userId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid user ID is required'));
      }

      let whereClause = 'WHERE p.user_id = ?';
      let params = [userId];

      if (type) {
        whereClause += ' AND p.payment_type = ?';
        params.push(type);
      }

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      // Get user's payments
      const [payments] = await this.db.execute(`
        SELECT p.*, t.name as tontine_name
        FROM payments p 
        LEFT JOIN tontines t ON p.tontine_id = t.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM payments p 
        ${whereClause}
      `, params.slice(0, -2));

      // Calculate statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN payment_type = 'contribution' AND status = 'completed' THEN amount ELSE 0 END) as total_contributions,
          SUM(CASE WHEN payment_type = 'loan_payment' AND status = 'completed' THEN amount ELSE 0 END) as total_loan_payments
        FROM payments p 
        ${whereClause}
      `, params.slice(0, -2));

      return res.json(SUCCESS_RESPONSES.ok({
        payments,
        stats: stats[0] || {
          total_payments: 0,
          total_paid: 0,
          pending_amount: 0,
          total_contributions: 0,
          total_loan_payments: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching user payments:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch payments'));
    }
  }

  // Process contribution payment
  async processContributionPayment(req, res) {
    try {
      const { userId, user_id, tontineId, tontine_id, amount, paymentMethod, payment_method, paymentData, payment_data } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;
      const finalTontineId = tontineId || tontine_id;
      const finalPaymentMethod = paymentMethod || payment_method;
      const finalPaymentData = paymentData || payment_data;
      const finalAmount = amount !== undefined && amount !== null ? amount.toString() : null;

      // Validate required fields
      if (!finalUserId || !finalTontineId || !finalAmount || !finalPaymentMethod) {
        return res.status(400).json(ERROR_RESPONSES.validation('All required fields must be provided'));
      }

      // Validate foreign keys using QueryHelpers
      if (!(await QueryHelpers.isForeignKey(this.db, 'users', 'id', finalUserId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'User not found');
      }

      if (!(await QueryHelpers.isForeignKey(this.db, 'tontines', 'id', finalTontineId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }

      // Validate amount
      if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid payment amount is required');
      }

      // Check if user is member of tontine
      const [membership] = await this.db.execute(
        'SELECT * FROM tontine_members WHERE user_id = ? AND tontine_id = ? AND status = ?',
        [finalUserId, finalTontineId, 'approved']
      );

      if (membership.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'User is not an approved member of this tontine');
      }

      // Get tontine details
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [finalTontineId, 'active']
      );

      if (tontine.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Tontine is not active');
      }

      let retryContributionId = null;
      const [existingContributions] = await this.db.execute(
        `SELECT id, payment_status, transaction_ref
         FROM contributions
         WHERE user_id = ? AND tontine_id = ? AND contribution_date = CURDATE()
         LIMIT 1`,
        [finalUserId, finalTontineId]
      );

      if (existingContributions.length > 0) {
        const existing = existingContributions[0];
        const status = String(existing.payment_status || '').toLowerCase();

        if (status === 'approved') {
          return ResponseHelpers.sendValidationResponse(res, 'Your contribution for today has already been approved.');
        }

        if (status === 'pending') {
          return ResponseHelpers.sendValidationResponse(
            res,
            'You already have a contribution payment for today. Please wait for it to be processed.'
          );
        }

        retryContributionId = existing.id;
      }

      const { phone: topPhone } = req.body;
      const phoneNumber = topPhone || finalPaymentData?.phone;
      if (!phoneNumber || !hdevPayment.validatePhoneNumber(phoneNumber)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid mobile money phone number is required');
      }

      // Generate unique transaction reference
      const transactionRef = `PAY-${Date.now()}-${finalUserId}-${finalTontineId}`;
      
      // Check for duplicate transaction reference
      const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'payments', {
        transaction_ref: transactionRef
      });

      if (refDuplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          'Transaction reference conflict. Please try again.'
        );
      }

      const formattedPhone = hdevPayment.formatPhoneNumber(phoneNumber);
      const callbackUrl = process.env.HDEV_CALLBACK_URL ||
        `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3300}`}/api/v1/payments/hdev/callback`;

      const hdevResponse = await hdevPayment.pay(
        formattedPhone,
        amount,
        transactionRef,
        callbackUrl
      );

      const gatewayAccepted = hdevPayment.isSuccessfulResponse(hdevResponse) ||
        hdevResponse?.tx_ref ||
        hdevResponse?.transaction_ref ||
        hdevResponse?.status;

      if (!gatewayAccepted) {
        return ResponseHelpers.sendValidationResponse(
          res,
          hdevResponse?.message || hdevResponse?.raw_response || 'Payment gateway rejected the request'
        );
      }

      const paymentDataToStore = {
        ...(finalPaymentData || {}),
        phone: formattedPhone,
        gateway: 'hdev',
        gateway_response: hdevResponse
      };

      // Create payment record
      const [result] = await this.db.execute(`
        INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [finalUserId, finalTontineId, 'contribution', amount, 'mobile_money', JSON.stringify(paymentDataToStore), 'pending', transactionRef, getCurrentUTCDate()]);

      if (retryContributionId) {
        await this.db.execute(
          `UPDATE contributions
           SET amount = ?, payment_method = ?, transaction_ref = ?, payment_status = 'Pending', created_at = ?
           WHERE id = ?`,
          [amount, 'mobile_money', transactionRef, getCurrentUTCDate(), retryContributionId]
        );
      } else {
        // Create contribution record with the same gateway reference used by HDEV.
        await this.db.execute(`
          INSERT INTO contributions (user_id, tontine_id, amount, payment_method, transaction_ref, payment_status, contribution_date, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
        `, [finalUserId, finalTontineId, amount, 'mobile_money', transactionRef, 'Pending', getCurrentUTCDate()]);
      }

      // Create notification for user
      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        finalUserId,
        'Contribution Payment Received',
        `Your contribution payment of RWF ${amount} to ${tontine[0].name} has been received and is pending approval.`,
        'payment',
        getCurrentUTCDate()
      ]);

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { paymentId: result.insertId, transactionRef, gateway: 'hdev', gatewayResponse: hdevResponse },
        'Contribution payment request sent successfully'
      ));

    } catch (error) {
      console.error('Error processing contribution payment:', error);
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('unique_contribution_user_date')) {
        return ResponseHelpers.sendValidationResponse(
          res,
          'You already have a contribution payment for today. Please wait for it to be processed.'
        );
      }

      return res.status(500).json(ERROR_RESPONSES.server('Failed to process payment'));
    }
  }

  // Process loan payment
  async processLoanPayment(req, res) {
    try {
      const { userId, user_id, loanId, loan_id, amount, paymentAmount, paymentMethod, payment_method, paymentData, payment_data } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;
      const finalLoanId = loanId || loan_id;
      const finalAmount = (amount || paymentAmount) !== undefined && (amount || paymentAmount) !== null ? (amount || paymentAmount).toString() : null;
      const finalPaymentMethod = paymentMethod || payment_method;
      const finalPaymentData = paymentData || payment_data;

      // Validate required fields
      if (!finalUserId || !finalLoanId || !finalAmount || !finalPaymentMethod) {
        return ResponseHelpers.sendValidationResponse(res, 'All required fields must be provided');
      }

      // Validate foreign keys using QueryHelpers
      if (!(await QueryHelpers.isForeignKey(this.db, 'users', 'id', finalUserId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'User not found');
      }

      if (!(await QueryHelpers.isForeignKey(this.db, 'loans', 'id', finalLoanId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Loan not found');
      }

      // Validate amount
      if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid payment amount is required');
      }

      // Check if loan exists and belongs to user (Approved, Disbursed, or Received status)
      const [loan] = await this.db.execute(
        'SELECT * FROM loans WHERE id = ? AND user_id = ? AND status IN (?, ?, ?)',
        [finalLoanId, finalUserId, 'Approved', 'Disbursed', 'Received']
      );

      if (loan.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Loan not found or not eligible for payment');
      }

      // Process mobile money payment through HDEV
      if (finalPaymentMethod === 'mobile_money') {
        const { phone, description } = req.body;
        const phoneNumber = phone || finalPaymentData?.phone;
        if (!phoneNumber || !hdevPayment.validatePhoneNumber(phoneNumber)) {
          return ResponseHelpers.sendValidationResponse(res, 'Valid mobile money phone number is required');
        }

        // Generate unique transaction reference
        const transactionRef = `LOAN-PAY-${Date.now()}-${finalUserId}-${finalLoanId}`;
        
        // Check for duplicate transaction reference
        const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'payments', {
          transaction_ref: transactionRef
        });

        if (refDuplicateCheck.isDuplicate) {
          return ResponseHelpers.sendValidationResponse(res, 
            'Transaction reference conflict. Please try again.'
          );
        }

        const formattedPhone = hdevPayment.formatPhoneNumber(phoneNumber);
        const callbackUrl = process.env.HDEV_CALLBACK_URL ||
          `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3300}`}/api/v1/payments/hdev/callback`;

        const hdevResponse = await hdevPayment.pay(
          formattedPhone,
          finalAmount,
          transactionRef,
          callbackUrl
        );

        const gatewayAccepted = hdevPayment.isSuccessfulResponse(hdevResponse) ||
          hdevResponse?.tx_ref ||
          hdevResponse?.transaction_ref ||
          hdevResponse?.status;

        if (!gatewayAccepted) {
          return ResponseHelpers.sendValidationResponse(
            res,
            hdevResponse?.message || hdevResponse?.raw_response || 'Payment gateway rejected the request'
          );
        }

        const paymentDataToStore = {
          ...(finalPaymentData || {}),
          phone: formattedPhone,
          gateway: 'hdev',
          gateway_response: hdevResponse
        };

        // Create payment record
        const [result] = await this.db.execute(`
          INSERT INTO payments (user_id, tontine_id, loan_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [finalUserId, loan[0].tontine_id, finalLoanId, 'loan_payment', finalAmount, 'mobile_money', JSON.stringify(paymentDataToStore), 'pending', transactionRef, getCurrentUTCDate()]);

        // Create notification for user
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          finalUserId,
          'Loan Payment Received',
          `Your loan payment of RWF ${finalAmount} has been received and is pending approval.`,
          'payment',
          getCurrentUTCDate()
        ]);

        return res.status(201).json(SUCCESS_RESPONSES.created(
          { paymentId: result.insertId, transactionRef, gateway: 'hdev', gatewayResponse: hdevResponse },
          'Loan payment request sent successfully'
        ));
      } else {
        // Handle non-mobile money payments (bank, cash)
        const transactionRef = `LOAN-PAY-${Date.now()}-${finalUserId}-${finalLoanId}`;
        
        // Check for duplicate transaction reference
        const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'payments', {
          transaction_ref: transactionRef
        });
        
        if (refDuplicateCheck.isDuplicate) {
          return ResponseHelpers.sendValidationResponse(res, 
            'Transaction reference conflict. Please try again.'
          );
        }

        // Create payment record
        const [result] = await this.db.execute(`
          INSERT INTO payments (user_id, tontine_id, loan_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [finalUserId, loan[0].tontine_id, finalLoanId, 'loan_payment', finalAmount, finalPaymentMethod, JSON.stringify(finalPaymentData || {}), 'pending', transactionRef, getCurrentUTCDate()]);

        // Create notification for user
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          finalUserId,
          'Loan Payment Received',
          `Your loan payment of RWF ${finalAmount} has been received and is pending approval.`,
          'payment',
          getCurrentUTCDate()
        ]);

        return res.status(201).json(SUCCESS_RESPONSES.created(
          { paymentId: result.insertId },
          'Loan payment received and pending approval'
        ));
      }

    } catch (error) {
      console.error('Error processing loan payment:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to process payment'));
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { status, notes } = req.body;

      // Validate paymentId
      if (!paymentId || isNaN(paymentId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid payment ID is required'));
      }

      // Validate status
      if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required'));
      }

      // Get payment details
      const [payments] = await this.db.execute(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (payments.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Payment not found'));
      }

      // Update payment
      const [result] = await this.db.execute(
        'UPDATE payments SET status = ?, notes = ?, updated_at = ? WHERE id = ?',
        [status, notes || null, getCurrentUTCDate(), paymentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Payment not found'));
      }

      // Update related records
      const payment = payments[0];
      if (payment.payment_type === 'contribution' && payment.tontine_id) {
        await this.db.execute(
          'UPDATE contributions SET payment_status = ? WHERE user_id = ? AND tontine_id = ? AND payment_status = ?',
          [status === 'completed' ? 'Approved' : status, payment.user_id, payment.tontine_id, 'Pending']
        );
      }
      // Note: Loan payments and penalty payments are tracked in the payments table only
      // No separate update needed - status in payments table is the source of truth

      // Create notification for user
      const notificationType = status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info';
      const notificationMessage = status === 'completed' 
        ? `Your payment of RWF ${payment.amount} has been completed successfully.`
        : status === 'failed'
        ? `Your payment of RWF ${payment.amount} failed. ${notes || ''}`
        : `Your payment status has been updated to: ${status}`;

      await this.db.execute(`
        INSERT INTO notifications (user_id, title, message, type, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        payment.user_id,
        'Payment Status Updated',
        notificationMessage,
        notificationType,
        getCurrentUTCDate()
      ]);

      return res.json(SUCCESS_RESPONSES.ok(null, 'Payment status updated successfully'));

    } catch (error) {
      console.error('Error updating payment status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update payment status'));
    }
  }

  // Get payment history for a user (contributions, loan payments, penalties)
  async getPaymentHistory(req, res) {
    try {
      // Support getting userId from query param or from authenticated user (req.user)
      const { userId: queryUserId } = req.query;
      const userId = queryUserId || (req.user && req.user.id);

      if (!userId) {
        return res.status(400).json(ERROR_RESPONSES.validation('User ID is required'));
      }

      // Get contributions - include all statuses, default to 'Pending' if null
      const [contributions] = await this.db.execute(`
        SELECT c.*, t.name as tontine_name, 
               COALESCE(c.payment_status, 'Pending') as payment_status
        FROM contributions c
        JOIN tontines t ON c.tontine_id = t.id
        WHERE c.user_id = ?
        ORDER BY c.contribution_date DESC, c.created_at DESC
      `, [userId]);

      // Get loan payments from payments table (includes all statuses)
      const [loanPayments] = await this.db.execute(`
        SELECT p.*, l.amount as loan_amount, t.name as tontine_name,
               COALESCE(p.status, 'pending') as payment_status
        FROM payments p
        JOIN loans l ON p.loan_id = l.id
        JOIN tontines t ON l.tontine_id = t.id
        WHERE p.user_id = ? AND p.payment_type = 'loan_payment'
        ORDER BY p.created_at DESC
      `, [userId]);

      // Get penalty payments from payments table (includes all statuses)
      const [penaltyPayments] = await this.db.execute(`
        SELECT p.*, t.name as tontine_name, pen.reason
        FROM payments p
        LEFT JOIN tontines t ON p.tontine_id = t.id
        LEFT JOIN penalties pen ON JSON_UNQUOTE(JSON_EXTRACT(p.payment_data, '$.penaltyId')) = pen.id OR JSON_UNQUOTE(JSON_EXTRACT(p.payment_data, '$.penalty_id')) = pen.id
        WHERE p.user_id = ? AND p.payment_type = 'penalty'
        ORDER BY p.created_at DESC
      `, [userId]);

      return res.json(SUCCESS_RESPONSES.ok({
        contributions,
        loanPayments,
        penaltyPayments
      }));

    } catch (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch payment history'));
    }
  }

  // Process penalty payment
  // Added: Penalty payment endpoint for mobile money payments
  async processPenaltyPayment(req, res) {
    try {
      const { userId, user_id, penaltyId, penalty_id, amount, paymentMethod, payment_method, paymentData, payment_data } = req.body;
      
      // Support both camelCase and snake_case field names
      const finalUserId = userId || user_id;
      const finalPenaltyId = penaltyId || penalty_id;
      const finalAmount = parseFloat(amount);
      const finalPaymentMethod = paymentMethod || payment_method;
      const finalPaymentData = paymentData || payment_data;

      // Validate required fields
      if (!finalUserId || !finalPenaltyId || !finalAmount || !finalPaymentMethod) {
        return res.status(400).json(ERROR_RESPONSES.validation('All required fields must be provided'));
      }

      // Validate foreign keys using QueryHelpers
      if (!(await QueryHelpers.isForeignKey(this.db, 'users', 'id', finalUserId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'User not found');
      }

      if (!(await QueryHelpers.isForeignKey(this.db, 'penalties', 'id', finalPenaltyId))) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Penalty not found');
      }

      // Validate amount
      if (isNaN(finalAmount) || finalAmount <= 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid payment amount is required');
      }

      // Check if penalty exists and belongs to user and is pending
      const [penalty] = await this.db.execute(
        'SELECT * FROM penalties WHERE id = ? AND user_id = ? AND status = ?',
        [finalPenaltyId, finalUserId, 'pending']
      );

      if (penalty.length === 0) {
        return ResponseHelpers.sendValidationResponse(res, 'Penalty not found or already paid');
      }

      // Process mobile money payment through HDEV
      if (finalPaymentMethod === 'mobile_money') {
        const { phone } = req.body;
        const phoneNumber = phone || finalPaymentData?.phone;
        if (!phoneNumber || !hdevPayment.validatePhoneNumber(phoneNumber)) {
          return ResponseHelpers.sendValidationResponse(res, 'Valid mobile money phone number is required');
        }

        // Generate unique transaction reference
        const transactionRef = `PENALTY-PAY-${Date.now()}-${finalUserId}-${finalPenaltyId}`;
        
        // Check for duplicate transaction reference
        const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'payments', {
          transaction_ref: transactionRef
        });

        if (refDuplicateCheck.isDuplicate) {
          return ResponseHelpers.sendValidationResponse(res, 
            'Transaction reference conflict. Please try again.'
          );
        }

        const formattedPhone = hdevPayment.formatPhoneNumber(phoneNumber);
        const callbackUrl = process.env.HDEV_CALLBACK_URL ||
          `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3300}`}/api/v1/payments/hdev/callback`;

        const hdevResponse = await hdevPayment.pay(
          formattedPhone,
          finalAmount,
          transactionRef,
          callbackUrl
        );

        const gatewayAccepted = hdevPayment.isSuccessfulResponse(hdevResponse) ||
          hdevResponse?.tx_ref ||
          hdevResponse?.transaction_ref ||
          hdevResponse?.status;

        if (!gatewayAccepted) {
          return ResponseHelpers.sendValidationResponse(
            res,
            hdevResponse?.message || hdevResponse?.raw_response || 'Payment gateway rejected the request'
          );
        }

        const paymentDataToStore = {
          ...(finalPaymentData || {}),
          phone: formattedPhone,
          gateway: 'hdev',
          gateway_response: hdevResponse,
          penalty_id: finalPenaltyId
        };

        // Create payment record
        const [result] = await this.db.execute(`
          INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [finalUserId, penalty[0].tontine_id, 'penalty', finalAmount, 'mobile_money', JSON.stringify(paymentDataToStore), 'pending', transactionRef, getCurrentUTCDate()]);

        // Create notification for user
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          finalUserId,
          'Penalty Payment Received',
          `Your penalty payment of RWF ${finalAmount} has been received and is pending approval.`,
          'payment',
          getCurrentUTCDate()
        ]);

        return res.status(201).json(SUCCESS_RESPONSES.created(
          { paymentId: result.insertId, transactionRef, gateway: 'hdev', gatewayResponse: hdevResponse },
          'Penalty payment request sent successfully'
        ));
      } else {
        // Handle non-mobile money payments (bank, cash)
        const transactionRef = `PENALTY-PAY-${Date.now()}-${finalUserId}-${finalPenaltyId}`;
        
        // Check for duplicate transaction reference
        const refDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'payments', {
          transaction_ref: transactionRef
        });
        
        if (refDuplicateCheck.isDuplicate) {
          return ResponseHelpers.sendValidationResponse(res, 
            'Transaction reference conflict. Please try again.'
          );
        }

        // Create payment record
        const [result] = await this.db.execute(`
          INSERT INTO payments (user_id, tontine_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [finalUserId, penalty[0].tontine_id, 'penalty', finalAmount, finalPaymentMethod, JSON.stringify(finalPaymentData || {}), 'pending', transactionRef, getCurrentUTCDate()]);

        // Create notification for user
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at) 
          VALUES (?, ?, ?, ?, ?)
        `, [
          finalUserId,
          'Penalty Payment Received',
          `Your penalty payment of RWF ${finalAmount} has been received and is pending approval.`,
          'payment',
          getCurrentUTCDate()
        ]);

        return res.status(201).json(SUCCESS_RESPONSES.created(
          { paymentId: result.insertId },
          'Penalty payment received and pending approval'
        ));
      }

    } catch (error) {
      console.error('Error processing penalty payment:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to process penalty payment'));
    }
  }

  // Record manual loan payments (admin only)
  async recordManualLoanPayments(req, res) {
    try {
      const { tontineId } = req.params;
      const { payments, paymentDate } = req.body;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid tontine ID is required');
      }

      // Check if tontine exists
      const [tontines] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ?',
        [tontineId]
      );

      if (tontines.length === 0) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Tontine not found');
      }

      // Validate paymentDate
      if (!paymentDate) {
        return ResponseHelpers.sendValidationResponse(res, 'Payment date is required');
      }

      // Validate payments array
      if (!Array.isArray(payments)) {
        return ResponseHelpers.sendValidationResponse(res, 'Payments must be an array');
      }

      // Process each loan payment
      for (const payment of payments) {
        const { userId, loanId, amount, status, notes } = payment;

        if (!userId || isNaN(userId) || !loanId || isNaN(loanId)) {
          continue; // Skip invalid user/loan ids
        }

        // Validate amount
        const finalAmount = parseFloat(amount);
        if (isNaN(finalAmount) || finalAmount <= 0) {
          continue; // Skip invalid amounts
        }

        // Check if loan exists and belongs to user in this tontine
        const [loan] = await this.db.execute(
          'SELECT * FROM loans WHERE id = ? AND user_id = ? AND tontine_id = ?',
          [loanId, userId, tontineId]
        );

        if (loan.length === 0) {
          continue; // Skip if loan not found
        }

        // Generate unique transaction reference
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const transactionRef = `LOAN-PAY-ADMIN-${Date.now()}-${userId}-${loanId}-${randomSuffix}`;

        // Check if payment record already exists for this loan, user, and date
        const [existing] = await this.db.execute(
          'SELECT * FROM payments WHERE user_id = ? AND loan_id = ? AND DATE(created_at) = DATE(?) AND payment_type = ?',
          [userId, loanId, paymentDate, 'loan_payment']
        );

        if (existing.length > 0) {
          // Update existing record
          await this.db.execute(
            `UPDATE payments 
             SET amount = ?, status = ?, payment_method = 'manual', payment_data = ?, updated_at = ? 
             WHERE id = ?`,
            [finalAmount, status, JSON.stringify({ notes: notes || '' }), getCurrentUTCDate(), existing[0].id]
          );
        } else {
          // Insert new record
          await this.db.execute(
            `INSERT INTO payments (user_id, tontine_id, loan_id, payment_type, amount, payment_method, payment_data, status, transaction_ref, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tontineId, loanId, 'loan_payment', finalAmount, 'manual', JSON.stringify({ notes: notes || '' }), status, transactionRef, getCurrentUTCDate()]
          );
        }

        // Create in-app notification for the member
        const notificationTitle = 'Loan Payment Recorded';
        const notificationMessage = `An administrator has recorded a loan payment of RWF ${finalAmount.toLocaleString()} for you on ${paymentDate}. Status: ${status}.${notes ? ' Notes: ' + notes : ''}`;
        
        await this.db.execute(
          `INSERT INTO notifications (user_id, title, message, type, created_at) 
           VALUES (?, ?, ?, 'payment', ?)`,
          [userId, notificationTitle, notificationMessage, getCurrentUTCDate()]
        );

        // Fetch user details to get email and name
        const [users] = await this.db.execute(
          'SELECT names, email FROM users WHERE id = ?',
          [userId]
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

          // Send email notification
          const emailTemplate = getLoanPaymentRecordedTemplate({
            loanId: loanId,
            amount: finalAmount,
            paymentDate: paymentDate,
            status: status,
            notes: notes || ''
          }, userName);

          sendEmail(userEmail, 'Loan Payment Recorded - The Future', emailTemplate)
            .then(() => console.log(`Loan payment email sent to ${userEmail} (user ID: ${userId})`))
            .catch(err => console.error(`Failed to send loan payment email to ${userEmail} (user ID: ${userId}):`, err));
        }
      }

      return ResponseHelpers.sendSuccessResponse(res, null, 'Loan payments saved successfully');
    } catch (error) {
      console.error('Error saving manual loan payments:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to save loan payments');
    }
  }

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const { tontineId, userId, period } = req.query;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (tontineId) {
        whereClause += ' AND p.tontine_id = ?';
        params.push(tontineId);
      }

      if (userId) {
        whereClause += ' AND p.user_id = ?';
        params.push(userId);
      }

      if (period) {
        switch (period) {
          case 'today':
            whereClause += ' AND DATE(p.created_at) = CURDATE()';
            break;
          case 'week':
            whereClause += ' AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
          case 'month':
            whereClause += ' AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
        }
      }

      // Get payment statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN payment_type = 'contribution' AND status = 'completed' THEN amount ELSE 0 END) as contributions,
          SUM(CASE WHEN payment_type = 'loan_payment' AND status = 'completed' THEN amount ELSE 0 END) as loan_payments,
          AVG(CASE WHEN status = 'completed' THEN amount END) as avg_payment
        FROM payments p 
        ${whereClause}
      `, params);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || {
        total_payments: 0,
        total_amount: 0,
        pending_amount: 0,
        contributions: 0,
        loan_payments: 0,
        avg_payment: 0
      }));

    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch payment statistics'));
    }
  }
}

module.exports = PaymentsController;
