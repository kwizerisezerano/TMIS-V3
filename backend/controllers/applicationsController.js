/**
 * Applications Controller
 * Handles all application-related business logic with consolidated endpoints
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/applications/', 'uploads/'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});
const { 
  validateEmail, 
  validatePhone, 
  validateNames,
  fetchAdminUsers,
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  STATUS,
  getCurrentUTCDate
} = require('../utils/common');
const { encryptUserData } = require('../utils/encryption');
const { getMembershipApplicationTemplate } = require('../utils/emailTemplates');
const { sendEmail, sendEmailWithAttachment } = require('../utils/email');
const { QueryHelpers } = require('../utils/common');
const DatabaseHelpers = require('../utils/databaseHelpers');
const ResponseHelpers = require('../utils/responseHelpers');

class ApplicationsController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
    
    // Configure multer for file uploads
    this.upload = multer({ 
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'uploads/applications/');
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + '-' + file.originalname);
        }
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
          return cb(null, true);
        } else {
          cb(new Error('Only images, PDFs and documents are allowed'));
        }
      }
    });
  }

  // Consolidated applications endpoint with query parameters
  async getApplications(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        search, 
        applicationId,
        includeFiles = false 
      } = req.query;

      // Note: applicationId should be handled by separate getApplicationById method
      // because list and single endpoints return different data structures

      // Build where clause using QueryHelpers
      const filterConfig = QueryHelpers.getFilterConfig('applications');
      const { whereClause, params } = QueryHelpers.buildWhereClause({
        status,
        search
      }, {
        tablePrefix: 'a.',
        searchFields: filterConfig.searchFields
      });

      // Build pagination using QueryHelpers
      const pagination = QueryHelpers.buildPagination(req.query, { defaultLimit: 20, maxLimit: 100 });

      // Build complete query with proper clause ordering (JOIN before WHERE)
      const joinClause = 'LEFT JOIN application_files af ON a.id = af.application_id';
      const groupByClause = 'GROUP BY a.id';
      const offset = (pagination.page - 1) * pagination.limit;

      // Get data with proper clause ordering
      const dataQuery = `SELECT a.*, COUNT(DISTINCT af.id) as file_count
        FROM applications a
        ${joinClause}
        ${whereClause}
        ${groupByClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?`;

      const [data] = await this.db.execute(dataQuery, [...params, parseInt(pagination.limit), offset]);

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT a.id) as total FROM applications a ${joinClause} ${whereClause}`;
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

      // Build complete pagination response
      const paginationResponse = QueryHelpers.buildPaginationResponse(
        result.pagination.total,
        pagination
      );

      // Include files if requested
      if (includeFiles === 'true') {
        const applicationsWithFiles = await Promise.all(
          result.data.map(async (application) => {
            const [files] = await this.db.execute(
              'SELECT * FROM application_files WHERE application_id = ?',
              [application.id]
            );
            return { ...application, files };
          })
        );
        result.data = applicationsWithFiles;
      }

      return ResponseHelpers.send(res, ResponseHelpers.paginated(result.data, paginationResponse));

    } catch (error) {
      console.error('Error fetching applications:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch applications');
    }
  }

  // Get application by ID (used by consolidated endpoint)
  async getApplicationById(req, res) {
    try {
      const { applicationId } = req.params;

      // Validate applicationId
      if (!applicationId || isNaN(applicationId)) {
        return ResponseHelpers.sendValidationResponse(res, 'Valid application ID is required');
      }

      // Get application details
      const application = await this.db.getById('applications', applicationId);
      
      if (!application) {
        return ResponseHelpers.sendNotFoundResponse(res, 'Application not found');
      }

      // Get application files
      const [files] = await this.db.execute(
        'SELECT * FROM application_files WHERE application_id = ? ORDER BY created_at ASC',
        [applicationId]
      );

      return ResponseHelpers.sendSuccessResponse(res, {
        ...application,
        files
      });

    } catch (error) {
      console.error('Error fetching application:', error);
      return ResponseHelpers.sendServerErrorResponse(res, 'Failed to fetch application');
    }
  }

  // Submit membership application
  async submitApplication(req, res) {
    try {
      const { names, email, phone, idNumber, agreedToTerms } = req.body;

      // Validate input
      const nameValidation = validateNames(names);
      if (!nameValidation.valid) {
        return ResponseHelpers.sendValidationResponse(res, nameValidation.message);
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(emailValidation.message));
      }

      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json(ERROR_RESPONSES.validation(phoneValidation.message));
      }

      // Check for duplicate application using QueryHelpers
      const duplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'applications', {
        email: email.toLowerCase()
      });

      if (duplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          `Application with this email already exists (${duplicateCheck.constraint})`
        );
      }

      // Check for duplicate phone
      const phoneDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'applications', {
        phone: phone
      });

      if (phoneDuplicateCheck.isDuplicate) {
        return ResponseHelpers.sendValidationResponse(res, 
          `Application with this phone number already exists (${phoneDuplicateCheck.constraint})`
        );
      }

      // Check for duplicate ID number if provided
      if (idNumber) {
        const idNumberDuplicateCheck = await QueryHelpers.checkDuplicate(this.db, 'applications', {
          id_number: idNumber
        });

        if (idNumberDuplicateCheck.isDuplicate) {
          return ResponseHelpers.sendValidationResponse(res, 
            `Application with this ID number already exists (${idNumberDuplicateCheck.constraint})`
          );
        }
      }

      // Encrypt sensitive data
      const encryptedApplication = encryptUserData({
        names,
        email: email.toLowerCase(),
        phone,
        id_number: idNumber || null
      });

      // Insert application
      const [result] = await this.db.execute(`
        INSERT INTO applications (names, email, phone, id_number, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [encryptedApplication.names, encryptedApplication.email, encryptedApplication.phone, encryptedApplication.id_number || null, 'pending', getCurrentUTCDate()]);

      const applicationId = result.insertId;

      // Fetch admin emails dynamically
      let adminEmails = [];
      let adminUserIds = [];
      try {
        const adminUsers = await fetchAdminUsers(this.db);
        const { decryptUserData } = require('../utils/encryption');
        adminEmails = adminUsers.map(user => {
          try {
            const decryptedUser = decryptUserData(user);
            adminUserIds.push(user.id);
            return decryptedUser.email;
          } catch (error) {
            console.error('Error decrypting admin email:', error);
            return null;
          }
        }).filter(email => email !== null);
      } catch (error) {
        console.error('Error fetching admin emails:', error);
        adminEmails = ['tabitakwizerisezerano@gmail.com']; // Fallback
      }

      if (adminEmails.length === 0) {
        adminEmails = ['tabitakwizerisezerano@gmail.com']; // Fallback
      }

      // Create in-app notifications for all admins
      for (const adminId of adminUserIds) {
        try {
          await this.db.execute(`
            INSERT INTO notifications (user_id, title, message, type, created_at) 
            VALUES (?, ?, ?, ?, ?)
          `, [
            adminId,
            '👉 New Membership Application',
            `${names} has submitted a membership application. Email: ${email.toLowerCase()}, Phone: ${phone}`,
            'info',
            getCurrentUTCDate()
          ]);
        } catch (notifError) {
          console.error(`Failed to create notification for admin ${adminId}:`, notifError);
        }
      }

      // Send email notifications to admins (with attachment if file uploaded)
      try {
        const emailHtml = getMembershipApplicationTemplate({
          names,
          email: email.toLowerCase(),
          phone,
          idNumber: idNumber || 'Not provided',
          agreedToTerms: agreedToTerms === 'true' || agreedToTerms === true
        });

        for (const adminEmail of adminEmails) {
          try {
            if (req.file) {
              // Send email with file attachment
              await sendEmailWithAttachment(
                adminEmail,
                'New Membership Application - The Future',
                emailHtml,
                req.file
              );
            } else {
              // Send email without attachment
              await sendEmail(adminEmail, 'New Membership Application - The Future', emailHtml);
            }
          } catch (emailError) {
            console.error(`Failed to send email to ${adminEmail}:`, emailError);
          }
        }

        // Delete temp file after sending emails
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
            console.log('Temp file deleted:', req.file.path);
          } catch (unlinkError) {
            console.error('Failed to delete temp file:', unlinkError);
          }
        }
      } catch (emailError) {
        console.error('Application email failed:', emailError);
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { applicationId: result.insertId },
        'Application submitted successfully'
      ));

    } catch (error) {
      console.error('Error submitting application:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to submit application'));
    }
  }

  // Upload application files
  async uploadFiles(req, res) {
    try {
      const { applicationId } = req.params;

      // Validate applicationId
      if (!applicationId || isNaN(applicationId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid application ID is required'));
      }

      // Check if application exists
      const [application] = await this.db.execute(
        'SELECT * FROM applications WHERE id = ?',
        [applicationId]
      );

      if (application.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Application not found'));
      }

      // Handle file upload
      this.upload.array('files', 5)(req, res, async (err) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json(ERROR_RESPONSES.validation(err.message));
        }

        try {
          const uploadedFiles = [];
          
          for (const file of req.files) {
            // Insert file record
            const [result] = await this.db.execute(`
              INSERT INTO application_files (application_id, filename, original_name, file_size, mime_type, file_data, created_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              applicationId,
              file.filename,
              file.originalname,
              file.size,
              file.mimetype,
              file.buffer,
              getCurrentUTCDate()
            ]);

            uploadedFiles.push({
              id: result.insertId,
              filename: file.filename,
              originalName: file.originalname,
              size: file.size,
              mimeType: file.mimetype
            });
          }

          return res.json(SUCCESS_RESPONSES.ok(uploadedFiles, 'Files uploaded successfully'));

        } catch (error) {
          console.error('Error saving files:', error);
          return res.status(500).json(ERROR_RESPONSES.server('Failed to save files'));
        }
      });

    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to upload files'));
    }
  }

  // Update application status
  async updateApplicationStatus(req, res) {
    try {
      const { applicationId } = req.params;
      const { status, notes, processedBy } = req.body;

      // Validate applicationId
      if (!applicationId || isNaN(applicationId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid application ID is required'));
      }

      // Validate status
      if (!status || !['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid status is required'));
      }

      // Get application details
      const [applications] = await this.db.execute(
        'SELECT * FROM applications WHERE id = ?',
        [applicationId]
      );

      if (applications.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Application not found'));
      }

      // Update application
      const [result] = await this.db.execute(
        'UPDATE applications SET status = ? WHERE id = ?',
        [status, applicationId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Application not found'));
      }

      // If approved, create user account
      if (status === 'approved') {
        const bcrypt = require('bcryptjs');
        const { decryptUserData } = require('../utils/encryption');
        
        // Decrypt application data
        const decryptedApp = decryptUserData(applications[0]);
        
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user account
        await this.db.execute(`
          INSERT INTO users (names, email, phone, password, role, email_verified, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [decryptedApp.names, decryptedApp.email, decryptedApp.phone, hashedPassword, 'member', 1, getCurrentUTCDate()]);

        // Send welcome email
        try {
          const { getWelcomeTemplate } = require('../utils/emailTemplates');
          const emailHtml = getWelcomeTemplate(decryptedApp, tempPassword);
          await sendEmail(decryptedApp.email, 'Welcome to The Future Tontine', emailHtml);
        } catch (emailError) {
          console.error('Welcome email failed:', emailError);
        }
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Application status updated successfully'));

    } catch (error) {
      console.error('Error updating application status:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update application status'));
    }
  }

  // Delete application (admin only)
  async deleteApplication(req, res) {
    try {
      const { applicationId } = req.params;

      // Validate applicationId
      if (!applicationId || isNaN(applicationId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid application ID is required'));
      }

      // Delete application files first
      await this.db.execute('DELETE FROM application_files WHERE application_id = ?', [applicationId]);

      // Delete application
      const [result] = await this.db.execute('DELETE FROM applications WHERE id = ?', [applicationId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Application not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Application deleted successfully'));

    } catch (error) {
      console.error('Error deleting application:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete application'));
    }
  }

  // Get application statistics (admin)
  async getApplicationStats(req, res) {
    try {
      const { period } = req.query;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (period) {
        switch (period) {
          case 'today':
            whereClause += ' AND DATE(created_at) = CURDATE()';
            break;
          case 'week':
            whereClause += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            break;
          case 'month':
            whereClause += ' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            break;
        }
      }

      // Get application statistics
      const [stats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_applications,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM applications 
        ${whereClause}
      `, params);

      return res.json(SUCCESS_RESPONSES.ok(stats[0] || {
        total_applications: 0,
        pending_count: 0,
        under_review_count: 0,
        approved_count: 0,
        rejected_count: 0
      }));

    } catch (error) {
      console.error('Error fetching application stats:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch application statistics'));
    }
  }
}

module.exports = ApplicationsController;
