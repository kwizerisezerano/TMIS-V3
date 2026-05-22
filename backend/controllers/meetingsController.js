/**
 * Meetings Controller
 * Handles all meeting-related business logic
 */

const {
  ERROR_RESPONSES,
  SUCCESS_RESPONSES,
  getCurrentUTCDate
} = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');
const { sendPenaltyEmail, sendMeetingScheduledEmail, sendAttendanceMarkedEmail } = require('../utils/email');

class MeetingsController {
  constructor(db) {
    this.db = db;
  }

  // Get all meetings (admin)
  async getAllMeetings(req, res) {
    try {
      const { page = 1, limit = 20, status, tontineId } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      let params = [];

      if (status) {
        whereClause += ' AND m.status = ?';
        params.push(status);
      }

      if (tontineId) {
        whereClause += ' AND m.tontine_id = ?';
        params.push(tontineId);
      }

      // Get meetings with tontine and creator details
      const [meetingsRaw] = await this.db.execute(`
        SELECT m.*, t.name as tontine_name, u.names as created_by_name_raw
        FROM meetings m
        JOIN tontines t ON m.tontine_id = t.id
        LEFT JOIN users u ON m.created_by = u.id
        ${whereClause}
        ORDER BY m.meeting_date DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Decrypt creator names
      const meetings = meetingsRaw.map(meeting => {
        try {
          if (meeting.created_by_name_raw) {
            const decrypted = decryptUserData({ names: meeting.created_by_name_raw });
            return { ...meeting, created_by_name: decrypted.names };
          }
          return meeting;
        } catch (e) {
          return meeting;
        }
      });

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM meetings m
        ${whereClause}
      `, params);

      return res.json(SUCCESS_RESPONSES.ok({
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching all meetings:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch meetings'));
    }
  }

  // Get meetings for a tontine
  async getTontineMeetings(req, res) {
    try {
      const { tontineId } = req.params;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      // Validate tontineId
      if (!tontineId || isNaN(tontineId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      let whereClause = 'WHERE m.tontine_id = ?';
      let params = [tontineId];

      if (status) {
        whereClause += ' AND m.status = ?';
        params.push(status);
      }

      // Get tontine meetings with creator details
      const [meetingsRaw] = await this.db.execute(`
        SELECT m.*, t.name as tontine_name, u.names as created_by_name_raw
        FROM meetings m
        JOIN tontines t ON m.tontine_id = t.id
        LEFT JOIN users u ON m.created_by = u.id
        ${whereClause}
        ORDER BY m.meeting_date DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      // Decrypt creator names
      const meetings = meetingsRaw.map(meeting => {
        try {
          if (meeting.created_by_name_raw) {
            const decrypted = decryptUserData({ names: meeting.created_by_name_raw });
            return { ...meeting, created_by_name: decrypted.names };
          }
          return meeting;
        } catch (e) {
          return meeting;
        }
      });

      // Get total count
      const [countResult] = await this.db.execute(`
        SELECT COUNT(*) as total FROM meetings m
        ${whereClause}
      `, params);

      return res.json(SUCCESS_RESPONSES.ok({
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }));

    } catch (error) {
      console.error('Error fetching tontine meetings:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch meetings'));
    }
  }

  // Create meeting
  async createMeeting(req, res) {
    try {
      const { tontineId, tontine_id, title, description, meetingDate, meeting_date, location, agenda } = req.body;

      // Support both camelCase and snake_case field names
      const finalTontineId = tontineId || tontine_id;
      const finalMeetingDate = meetingDate || meeting_date;

      // Debug log received data
      console.log('createMeeting received:', { tontineId: finalTontineId, title, meetingDate: finalMeetingDate });

      // Validate required fields
      if (!finalTontineId || !title || !finalMeetingDate) {
        return res.status(400).json(ERROR_RESPONSES.validation('Tontine ID, title, and meeting date are required'));
      }

      // Validate tontineId is a valid number
      const parsedTontineId = parseInt(finalTontineId, 10);
      if (isNaN(parsedTontineId) || parsedTontineId <= 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid tontine ID is required'));
      }

      // Check if tontine exists (regardless of status first)
      const [tontineAnyStatus] = await this.db.execute(
        'SELECT id, name, status FROM tontines WHERE id = ?',
        [parsedTontineId]
      );

      // Check if tontine exists and is active
      const [tontine] = await this.db.execute(
        'SELECT * FROM tontines WHERE id = ? AND status = ?',
        [parsedTontineId, 'active']
      );

      if (tontineAnyStatus.length === 0) {
        console.error(`Tontine with ID ${parsedTontineId} does not exist`);
        return res.status(400).json(ERROR_RESPONSES.validation(`Tontine with ID ${parsedTontineId} does not exist`));
      }

      if (tontine.length === 0) {
        const tontineInfo = tontineAnyStatus[0];
        console.error(`Tontine ${parsedTontineId} exists but is not active (status: ${tontineInfo.status})`);
        return res.status(400).json(ERROR_RESPONSES.validation(`Tontine "${tontineInfo.name}" is not active (current status: ${tontineInfo.status}). Only active tontines can have meetings scheduled.`));
      }

      // Get created_by from user (from session/token) or default to 1 (first admin)
      const createdBy = req.user?.id || 1;

      // Insert meeting
      const [result] = await this.db.execute(`
        INSERT INTO meetings (tontine_id, title, description, meeting_date, location, agenda, created_by, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [parsedTontineId, title, description || null, finalMeetingDate, location || null, agenda || null, createdBy, 'scheduled', getCurrentUTCDate()]);

      // Get all members of the tontine for notifications
      const [members] = await this.db.execute(
        'SELECT user_id FROM tontine_members WHERE tontine_id = ? AND status = ?',
        [finalTontineId, 'approved']
      );

      // Create notifications and send emails for all members
      for (const member of members) {
        // Create in-app notification
        await this.db.execute(`
          INSERT INTO notifications (user_id, title, message, type, created_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          member.user_id,
          'New Meeting Scheduled',
          `A new meeting "${title}" has been scheduled for ${new Date(meetingDate).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
          'meeting',
          getCurrentUTCDate()
        ]);

        // Get member email and send email notification
        try {
          const [memberData] = await this.db.execute(
            'SELECT email, names FROM users WHERE id = ?',
            [member.user_id]
          );

          if (memberData.length > 0) {
            const decryptedMember = {
              email: memberData[0].email ? decryptUserData({ email: memberData[0].email }).email : null,
              names: memberData[0].names ? decryptUserData({ names: memberData[0].names }).names : 'Member'
            };

            if (decryptedMember.email) {
              // Send email notification (non-blocking, don't await)
              sendMeetingScheduledEmail(decryptedMember.email, {
                title: title,
                meetingDate: finalMeetingDate,
                location: location || null,
                agenda: agenda || null
              }, decryptedMember.names).catch(err => {
                console.error('Failed to send meeting email to member:', err);
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending meeting email:', emailError);
        }
      }

      return res.status(201).json(SUCCESS_RESPONSES.created(
        { meetingId: result.insertId },
        'Meeting created successfully'
      ));

    } catch (error) {
      console.error('Error creating meeting:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to create meeting'));
    }
  }

  // Update meeting
  async updateMeeting(req, res) {
    try {
      const { meetingId } = req.params;
      const { title, description, meetingDate, meeting_date, location, agenda, status } = req.body;

      // Support both camelCase and snake_case field names
      const finalMeetingDate = meetingDate || meeting_date;

      // Validate meetingId
      if (!meetingId || isNaN(meetingId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid meeting ID is required'));
      }

      // Check if meeting exists
      const [existing] = await this.db.execute('SELECT * FROM meetings WHERE id = ?', [meetingId]);
      if (existing.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Meeting not found'));
      }

      // Update meeting
      const [result] = await this.db.execute(`
        UPDATE meetings
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            meeting_date = COALESCE(?, meeting_date),
            location = COALESCE(?, location),
            agenda = COALESCE(?, agenda),
            status = COALESCE(?, status)
        WHERE id = ?
      `, [title, description, finalMeetingDate, location, agenda, status, meetingId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Meeting not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Meeting updated successfully'));

    } catch (error) {
      console.error('Error updating meeting:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to update meeting'));
    }
  }

  // Record meeting attendance
  async recordAttendance(req, res) {
    try {
      const { meetingId } = req.params;
      const { attendance } = req.body; // Array of { userId, user_id, status, notes }

      // Validate meetingId
      if (!meetingId || isNaN(meetingId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid meeting ID is required'));
      }

      // Validate attendance data
      if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        return res.status(400).json(ERROR_RESPONSES.validation('Attendance data is required'));
      }

      // Check if meeting exists and get tontine info
      const [meeting] = await this.db.execute(`
        SELECT m.*, t.name as tontine_name, t.contribution_amount
        FROM meetings m
        JOIN tontines t ON m.tontine_id = t.id
        WHERE m.id = ?
      `, [meetingId]);
      
      if (meeting.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Meeting not found'));
      }

      const meetingData = meeting[0];
      const tontineId = meetingData.tontine_id;
      // Default penalty: 10% of contribution amount or 5000 RWF, whichever is higher
      const defaultPenaltyAmount = Math.max(meetingData.contribution_amount * 0.1, 5000);

      // Clear existing attendance records
      await this.db.execute('DELETE FROM meeting_attendance WHERE meeting_id = ?', [meetingId]);

      // Record new attendance and apply penalties for absent members
      let recordedCount = 0;
      let penaltyCount = 0;
      
      for (const record of attendance) {
        if (!record.userId || isNaN(record.userId) || !record.status) continue;

        try {
          // Format arrival_time - use current time if late and no time provided
          let arrivalTime = null;
          if (record.status === 'late' && record.arrival_time) {
            arrivalTime = new Date(record.arrival_time).toISOString();
          } else if (record.status === 'late') {
            arrivalTime = new Date().toISOString();
          }

          // Insert attendance record
          await this.db.execute(`
            INSERT INTO meeting_attendance (meeting_id, user_id, status, arrival_time, excuse_reason, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [meetingId, record.userId, record.status, arrivalTime, record.excuse_reason || null, getCurrentUTCDate()]);
          
          recordedCount++;

          // Notify user that their attendance has been marked so they can review (both in-app and email)
          try {
            const [userForNotification] = await this.db.execute(
              'SELECT names, email FROM users WHERE id = ?',
              [record.userId]
            );

            if (userForNotification.length > 0) {
              const decryptedUser = {
                names: userForNotification[0].names ? decryptUserData({ names: userForNotification[0].names }).names : 'Member',
                email: userForNotification[0].email ? decryptUserData({ email: userForNotification[0].email }).email : null
              };

              // Create in-app notification for attendance marked
              await this.db.execute(`
                INSERT INTO notifications (user_id, title, message, type, created_at)
                VALUES (?, ?, ?, 'info', NOW())
              `, [
                record.userId,
                'Attendance Marked',
                `Your attendance for the meeting "${meetingData.title}" has been marked as: ${record.status}. Please review your attendance record and contact the administrator if there are any discrepancies.`
              ]);

              // Send email notification for attendance marked
              if (decryptedUser.email) {
                sendAttendanceMarkedEmail(decryptedUser.email, {
                  meetingTitle: meetingData.title,
                  meetingDate: meetingData.meeting_date,
                  status: record.status,
                  excuseReason: record.excuse_reason || null,
                  penaltyApplied: record.status === 'absent' ? 1 : 0
                }, decryptedUser.names).catch(err => {
                  console.error('Failed to send attendance email:', err);
                });
              }
            }
          } catch (notificationError) {
            console.error('Error creating attendance notification:', notificationError);
          }

          // Apply penalty for absent members (not excused) - 5,000 RWF per constitution
          if (record.status === 'absent') {
            // Check if penalty already exists for this user and meeting
            const [existingPenalty] = await this.db.execute(`
              SELECT id FROM penalties 
              WHERE user_id = ? AND tontine_id = ? AND reason LIKE '%absence%' AND status = 'pending'
            `, [record.userId, tontineId]);

            if (existingPenalty.length === 0) {
              // Insert penalty for absence (5,000 RWF per constitution Article 36)
              const absencePenalty = 5000;
              await this.db.execute(`
                INSERT INTO penalties (user_id, tontine_id, amount, reason, status, created_at)
                VALUES (?, ?, ?, ?, 'pending', NOW())
              `, [record.userId, tontineId, absencePenalty, `Absent from meeting: ${meetingData.title}`]);

              // Mark penalty as applied in attendance record
              await this.db.execute(`
                UPDATE meeting_attendance SET penalty_applied = 1 WHERE meeting_id = ? AND user_id = ?
              `, [meetingId, record.userId]);

              // Get user details for notification
              const [user] = await this.db.execute(
                'SELECT names, email FROM users WHERE id = ?',
                [record.userId]
              );

              if (user.length > 0) {
                const userData = user[0];
                const decryptedUser = {
                  names: userData.names ? decryptUserData({ names: userData.names }).names : 'Member',
                  email: userData.email ? decryptUserData({ email: userData.email }).email : null
                };

                // Create in-app notification
                await this.db.execute(`
                  INSERT INTO notifications (user_id, title, message, type, created_at)
                  VALUES (?, ?, ?, 'warning', NOW())
                `, [
                  record.userId,
                  'Penalty Applied',
                  `A penalty of RWF ${absencePenalty.toLocaleString()} has been applied for absence from the meeting "${meetingData.title}".`
                ]);

                // Send email notification
                if (decryptedUser.email) {
                  await sendPenaltyEmail(decryptedUser.email, {
                    userName: decryptedUser.names,
                    amount: absencePenalty.toLocaleString(),
                    reason: `Absent from meeting: ${meetingData.title} on ${new Date(meetingData.meeting_date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  });
                }
              }
              
              penaltyCount++;
            }
          }
          
          // Apply penalty for late arrival - 1,000 RWF per constitution Article 36
          if (record.status === 'late') {
            // Check if penalty already exists for this user and meeting
            const [existingLatePenalty] = await this.db.execute(`
              SELECT id FROM penalties 
              WHERE user_id = ? AND tontine_id = ? AND reason LIKE '%late%' AND status = 'pending'
            `, [record.userId, tontineId]);

            if (existingLatePenalty.length === 0) {
              // Insert penalty for late arrival (1,000 RWF per constitution Article 36)
              const latePenalty = 1000;
              await this.db.execute(`
                INSERT INTO penalties (user_id, tontine_id, amount, reason, status, created_at)
                VALUES (?, ?, ?, ?, 'pending', NOW())
              `, [record.userId, tontineId, latePenalty, `Late arrival to meeting: ${meetingData.title}`]);

              // Get user details for notification
              const [user] = await this.db.execute(
                'SELECT names, email FROM users WHERE id = ?',
                [record.userId]
              );

              if (user.length > 0) {
                const userData = user[0];
                const decryptedUser = {
                  names: userData.names ? decryptUserData({ names: userData.names }).names : 'Member',
                  email: userData.email ? decryptUserData({ email: userData.email }).email : null
                };

                // Create in-app notification
                await this.db.execute(`
                  INSERT INTO notifications (user_id, title, message, type, created_at)
                  VALUES (?, ?, ?, 'warning', NOW())
                `, [
                  record.userId,
                  'Penalty Applied',
                  `A penalty of RWF ${latePenalty.toLocaleString()} has been applied for late arrival to the meeting "${meetingData.title}".`
                ]);

                // Send email notification
                if (decryptedUser.email) {
                  await sendPenaltyEmail(decryptedUser.email, {
                    userName: decryptedUser.names,
                    amount: latePenalty.toLocaleString(),
                    reason: `Late arrival to meeting: ${meetingData.title} on ${new Date(meetingData.meeting_date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to process attendance for user ${record.userId}:`, error);
        }
      }

      // Update meeting status to completed
      await this.db.execute(
        'UPDATE meetings SET status = ? WHERE id = ?',
        ['completed', meetingId]
      );

      return res.json(SUCCESS_RESPONSES.ok({
        recordedCount,
        totalRecords: attendance.length,
        penaltiesApplied: penaltyCount
      }, 'Meeting attendance recorded successfully'));

    } catch (error) {
      console.error('Error recording meeting attendance:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to record attendance'));
    }
  }

  // Get meeting attendance
  async getMeetingAttendance(req, res) {
    try {
      const { meetingId } = req.params;

      // Validate meetingId
      if (!meetingId || isNaN(meetingId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid meeting ID is required'));
      }

      // Get attendance with user details
      const [attendance] = await this.db.execute(`
        SELECT ma.*, u.names, u.phone
        FROM meeting_attendance ma
        JOIN users u ON ma.user_id = u.id
        WHERE ma.meeting_id = ?
        ORDER BY u.names ASC
      `, [meetingId]);

      // Decrypt user data
      const decryptedAttendance = attendance.map(record => {
        try {
          return {
            ...record,
            names: record.names ? decryptUserData({ names: record.names }).names : record.names,
            phone: record.phone ? decryptUserData({ phone: record.phone }).phone : record.phone
          };
        } catch (error) {
          return record;
        }
      });

      return res.json(SUCCESS_RESPONSES.ok(decryptedAttendance));

    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch attendance'));
    }
  }

  // Delete meeting (admin only)
  async deleteMeeting(req, res) {
    try {
      const { meetingId } = req.params;

      // Validate meetingId
      if (!meetingId || isNaN(meetingId)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid meeting ID is required'));
      }

      // Delete attendance records first
      await this.db.execute('DELETE FROM meeting_attendance WHERE meeting_id = ?', [meetingId]);

      // Delete meeting
      const [result] = await this.db.execute('DELETE FROM meetings WHERE id = ?', [meetingId]);

      if (result.affectedRows === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Meeting not found'));
      }

      return res.json(SUCCESS_RESPONSES.ok(null, 'Meeting deleted successfully'));

    } catch (error) {
      console.error('Error deleting meeting:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to delete meeting'));
    }
  }
}

module.exports = MeetingsController;
