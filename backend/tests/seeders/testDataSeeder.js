/**
 * Test Data Seeder
 * Provides dummy data for testing all endpoints
 */

const bcrypt = require('bcryptjs');
const { encryptUserData } = require('../../utils/encryption');
const { getCurrentUTCDate } = require('../../utils/common');

class TestDataSeeder {
  constructor() {
    this.testUsers = [];
    this.testApplications = [];
    this.testTontines = [];
    this.testMemberships = [];
    this.testContributions = [];
    this.testLoans = [];
    this.testPayments = [];
    this.testMeetings = [];
    this.testNotifications = [];
  }

  async seedUsers(connection) {
    console.log('Seeding test users...');
    
    const users = [
      {
        names: 'John Test User',
        email: 'john@test.com',
        phone: '+250788123456',
        role: 'admin',
        id_number: '1199080012345678'
      },
      {
        names: 'Jane Test Member',
        email: 'jane@test.com',
        phone: '+250788654321',
        role: 'member',
        id_number: '1199080087654321'
      },
      {
        names: 'Bob Test President',
        email: 'bob@test.com',
        phone: '+250788987654',
        role: 'admin',
        id_number: '1199080098765432'
      },
      {
        names: 'Alice Test User',
        email: 'alice@test.com',
        phone: '+250788111222',
        role: 'member',
        id_number: '1199080011122334'
      },
      {
        names: 'Charlie Test Member',
        email: 'charlie@test.com',
        phone: '+250788333444',
        role: 'member',
        id_number: '1199080033344455'
      }
    ];

    const hashedPassword = await bcrypt.hash('test123', 10);

    for (const user of users) {
      const encryptedUser = encryptUserData(user);
      
      const [result] = await connection.execute(`
        INSERT INTO users (names, email, phone, role, email_verified, id_number, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        encryptedUser.names,
        encryptedUser.email,
        encryptedUser.phone,
        user.role,
        1, // email_verified
        encryptedUser.id_number,
        getCurrentUTCDate()
      ]);

      this.testUsers.push({
        id: result.insertId,
        ...user,
        password: hashedPassword
      });
    }

    console.log(`Seeded ${this.testUsers.length} test users`);
    return this.testUsers;
  }

  async seedApplications(connection) {
    console.log('Seeding test applications...');
    
    const applications = [
      {
        names: 'New Applicant One',
        email: 'applicant1@test.com',
        phone: '+250788555666',
        id_number: '1199080055667788',
        status: 'pending'
      },
      {
        names: 'New Applicant Two',
        email: 'applicant2@test.com',
        phone: '+250788777888',
        id_number: '1199080077889900',
        status: 'approved'
      },
      {
        names: 'New Applicant Three',
        email: 'applicant3@test.com',
        phone: '+250788999000',
        id_number: '1199080099900112',
        status: 'rejected'
      }
    ];

    for (const app of applications) {
      const encryptedApp = encryptUserData(app);
      
      const [result] = await connection.execute(`
        INSERT INTO applications (names, email, phone, id_number, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        encryptedApp.names,
        encryptedApp.email,
        encryptedApp.phone,
        encryptedApp.id_number,
        app.status,
        getCurrentUTCDate(),
        getCurrentUTCDate()
      ]);

      this.testApplications.push({
        id: result.insertId,
        ...app
      });
    }

    console.log(`Seeded ${this.testApplications.length} test applications`);
    return this.testApplications;
  }

  async seedTontines(connection) {
    console.log('Seeding test tontines...');
    
    const tontines = [
      {
        name: 'Test Tontine One',
        description: 'First test tontine for development',
        contribution_amount: 20000.00,
        contribution_frequency: 'monthly',
        max_members: 10,
        creator_id: this.testUsers[0].id, // John Test User (admin)
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active'
      },
      {
        name: 'Test Tontine Two',
        description: 'Second test tontine for development',
        contribution_amount: 15000.00,
        contribution_frequency: 'weekly',
        max_members: 15,
        creator_id: this.testUsers[2].id, // Bob Test President (admin)
        start_date: '2024-06-01',
        end_date: '2025-05-31',
        status: 'active'
      },
      {
        name: 'Test Tontine Three',
        description: 'Inactive test tontine',
        contribution_amount: 25000.00,
        contribution_frequency: 'monthly',
        max_members: 8,
        creator_id: this.testUsers[0].id, // John Test User (admin)
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        status: 'completed'
      }
    ];

    for (const tontine of tontines) {
      const [result] = await connection.execute(`
        INSERT INTO tontines (name, description, contribution_amount, contribution_frequency, max_members, creator_id, start_date, end_date, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tontine.name,
        tontine.description,
        tontine.contribution_amount,
        tontine.contribution_frequency,
        tontine.max_members,
        tontine.creator_id,
        tontine.start_date,
        tontine.end_date,
        tontine.status,
        getCurrentUTCDate()
      ]);

      this.testTontines.push({
        id: result.insertId,
        ...tontine
      });
    }

    console.log(`Seeded ${this.testTontines.length} test tontines`);
    return this.testTontines;
  }

  async seedMemberships(connection) {
    console.log('Seeding test memberships...');
    
    const memberships = [
      // John Test User (admin) as member of Tontine One
      {
        tontine_id: this.testTontines[0].id,
        user_id: this.testUsers[0].id,
        shares: 2,
        status: 'approved'
      },
      // Jane Test Member as member of Tontine One
      {
        tontine_id: this.testTontines[0].id,
        user_id: this.testUsers[1].id,
        shares: 1,
        status: 'approved'
      },
      // Bob Test President as member of Tontine One
      {
        tontine_id: this.testTontines[0].id,
        user_id: this.testUsers[2].id,
        shares: 1,
        status: 'approved'
      },
      // Alice Test User as member of Tontine One (pending)
      {
        tontine_id: this.testTontines[0].id,
        user_id: this.testUsers[3].id,
        shares: 1,
        status: 'pending'
      },
      // Jane Test Member as member of Tontine Two
      {
        tontine_id: this.testTontines[1].id,
        user_id: this.testUsers[1].id,
        shares: 1,
        status: 'approved'
      },
      // Charlie Test Member as member of Tontine Two
      {
        tontine_id: this.testTontines[1].id,
        user_id: this.testUsers[4].id,
        shares: 1,
        status: 'approved'
      }
    ];

    for (const membership of memberships) {
      const [result] = await connection.execute(`
        INSERT INTO tontine_members (tontine_id, user_id, shares, status, created_at) 
        VALUES (?, ?, ?, ?, ?)
      `, [
        membership.tontine_id,
        membership.user_id,
        membership.shares,
        membership.status,
        getCurrentUTCDate()
      ]);

      this.testMemberships.push({
        id: result.insertId,
        ...membership
      });
    }

    console.log(`Seeded ${this.testMemberships.length} test memberships`);
    return this.testMemberships;
  }

  async seedContributions(connection) {
    console.log('Seeding test contributions...');
    
    const contributions = [
      // John Test User contribution to Tontine One
      {
        user_id: this.testUsers[0].id,
        tontine_id: this.testTontines[0].id,
        amount: 20000.00,
        payment_method: 'mobile_money',
        contribution_date: '2024-01-15',
        transaction_ref: 'CONTR-170512345678-1-1',
        payment_status: 'Approved'
      },
      // Jane Test Member contribution to Tontine One
      {
        user_id: this.testUsers[1].id,
        tontine_id: this.testTontines[0].id,
        amount: 20000.00,
        payment_method: 'bank_transfer',
        contribution_date: '2024-01-15',
        transaction_ref: 'CONTR-170512345679-2-1',
        payment_status: 'Approved'
      },
      // John Test User second contribution
      {
        user_id: this.testUsers[0].id,
        tontine_id: this.testTontines[0].id,
        amount: 20000.00,
        payment_method: 'mobile_money',
        contribution_date: '2024-02-15',
        transaction_ref: 'CONTR-170801234567-1-1',
        payment_status: 'Approved'
      },
      // Jane Test Member contribution to Tontine Two
      {
        user_id: this.testUsers[1].id,
        tontine_id: this.testTontines[1].id,
        amount: 15000.00,
        payment_method: 'mobile_money',
        contribution_date: '2024-06-15',
        transaction_ref: 'CONTR-171842345678-2-2',
        payment_status: 'Pending'
      }
    ];

    for (const contribution of contributions) {
      const [result] = await connection.execute(`
        INSERT INTO contributions (user_id, tontine_id, amount, payment_method, contribution_date, transaction_ref, payment_status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        contribution.user_id,
        contribution.tontine_id,
        contribution.amount,
        contribution.payment_method,
        contribution.contribution_date,
        contribution.transaction_ref,
        contribution.payment_status,
        getCurrentUTCDate()
      ]);

      this.testContributions.push({
        id: result.insertId,
        ...contribution
      });
    }

    console.log(`Seeded ${this.testContributions.length} test contributions`);
    return this.testContributions;
  }

  async seedLoans(connection) {
    console.log('Seeding test loans...');
    
    const loans = [
      // Jane Test Member loan request for Tontine One
      {
        user_id: this.testUsers[1].id,
        tontine_id: this.testTontines[0].id,
        amount: 100000.00,
        interest_rate: 1.70,
        total_amount: 117000.00,
        repayment_period: 6,
        phone_number: '+250788654321',
        status: 'Approved'
      },
      // Bob Test President loan request for Tontine One
      {
        user_id: this.testUsers[2].id,
        tontine_id: this.testTontines[0].id,
        amount: 150000.00,
        interest_rate: 1.70,
        total_amount: 175500.00,
        repayment_period: 9,
        phone_number: '+250788987654',
        status: 'Pending'
      },
      // Alice Test User loan request (rejected)
      {
        user_id: this.testUsers[3].id,
        tontine_id: this.testTontines[0].id,
        amount: 80000.00,
        interest_rate: 1.70,
        total_amount: 93600.00,
        repayment_period: 4,
        phone_number: '+250788111222',
        status: 'Rejected'
      }
    ];

    for (const loan of loans) {
      const [result] = await connection.execute(`
        INSERT INTO loan_requests (user_id, tontine_id, amount, interest_rate, total_amount, repayment_period, phone_number, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        loan.user_id,
        loan.tontine_id,
        loan.amount,
        loan.interest_rate,
        loan.total_amount,
        loan.repayment_period,
        loan.phone_number,
        loan.status,
        getCurrentUTCDate()
      ]);

      this.testLoans.push({
        id: result.insertId,
        ...loan
      });
    }

    console.log(`Seeded ${this.testLoans.length} test loans`);
    return this.testLoans;
  }

  async seedPayments(connection) {
    console.log('Seeding test payments...');
    
    const payments = [
      // Loan payment for Jane's approved loan
      {
        user_id: this.testUsers[1].id,
        loan_id: this.testLoans[0].id,
        amount: 19500.00,
        payment_method: 'mobile_money',
        payment_date: '2024-03-15',
        transaction_ref: 'LOAN-PAY-171047890123-2-1',
        payment_status: 'Approved'
      },
      // Contribution payment
      {
        user_id: this.testUsers[1].id,
        tontine_id: this.testTontines[0].id,
        amount: 20000.00,
        payment_method: 'mobile_money',
        payment_date: '2024-03-15',
        transaction_ref: 'PAY-171047890124-2-1',
        payment_status: 'Pending'
      }
    ];

    for (const payment of payments) {
      const [result] = await connection.execute(`
        INSERT INTO loan_payments (user_id, loan_id, amount, payment_method, payment_date, transaction_ref, payment_status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.user_id,
        payment.loan_id,
        payment.amount,
        payment.payment_method,
        payment.payment_date,
        payment.transaction_ref,
        payment.payment_status,
        getCurrentUTCDate()
      ]);

      this.testPayments.push({
        id: result.insertId,
        ...payment
      });
    }

    console.log(`Seeded ${this.testPayments.length} test payments`);
    return this.testPayments;
  }

  async seedMeetings(connection) {
    console.log('Seeding test meetings...');
    
    const meetings = [
      {
        tontine_id: this.testTontines[0].id,
        title: 'Monthly Meeting - January',
        description: 'Regular monthly meeting for Tontine One',
        meeting_date: '2024-01-20 14:00:00',
        location: 'Conference Room A',
        status: 'completed',
        created_by: this.testUsers[0].id
      },
      {
        tontine_id: this.testTontines[0].id,
        title: 'Monthly Meeting - February',
        description: 'Regular monthly meeting for Tontine One',
        meeting_date: '2024-02-20 14:00:00',
        location: 'Conference Room A',
        status: 'completed',
        created_by: this.testUsers[0].id
      },
      {
        tontine_id: this.testTontines[0].id,
        title: 'Monthly Meeting - March',
        description: 'Regular monthly meeting for Tontine One',
        meeting_date: '2024-03-20 14:00:00',
        location: 'Conference Room A',
        status: 'scheduled',
        created_by: this.testUsers[0].id
      }
    ];

    for (const meeting of meetings) {
      const [result] = await connection.execute(`
        INSERT INTO meetings (tontine_id, title, description, meeting_date, location, status, created_by, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        meeting.tontine_id,
        meeting.title,
        meeting.description,
        meeting.meeting_date,
        meeting.location,
        meeting.status,
        meeting.created_by,
        getCurrentUTCDate()
      ]);

      this.testMeetings.push({
        id: result.insertId,
        ...meeting
      });
    }

    console.log(`Seeded ${this.testMeetings.length} test meetings`);
    return this.testMeetings;
  }

  async seedNotifications(connection) {
    console.log('Seeding test notifications...');
    
    const notifications = [
      {
        user_id: this.testUsers[1].id,
        title: 'Loan Approved',
        message: 'Your loan request of RWF 100,000 has been approved.',
        type: 'success',
        is_read: false
      },
      {
        user_id: this.testUsers[2].id,
        title: 'New Loan Application',
        message: 'A new loan application has been submitted for review.',
        type: 'info',
        is_read: true
      },
      {
        user_id: this.testUsers[3].id,
        title: 'Loan Rejected',
        message: 'Your loan request has been rejected due to insufficient contributions.',
        type: 'error',
        is_read: false
      }
    ];

    for (const notification of notifications) {
      const [result] = await connection.execute(`
        INSERT INTO notifications (user_id, title, message, type, \`read\`, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notification.user_id,
        notification.title,
        notification.message,
        notification.type,
        notification.is_read ? 1 : 0,
        getCurrentUTCDate()
      ]);

      this.testNotifications.push({
        id: result.insertId,
        ...notification
      });
    }

    console.log(`Seeded ${this.testNotifications.length} test notifications`);
    return this.testNotifications;
  }

  async seedAll(connection) {
    try {
      await this.seedUsers(connection);
      await this.seedApplications(connection);
      await this.seedTontines(connection);
      await this.seedMemberships(connection);
      await this.seedContributions(connection);
      await this.seedLoans(connection);
      await this.seedPayments(connection);
      await this.seedMeetings(connection);
      await this.seedNotifications(connection);

      console.log('All test data seeded successfully');
      
      return {
        users: this.testUsers,
        applications: this.testApplications,
        tontines: this.testTontines,
        memberships: this.testMemberships,
        contributions: this.testContributions,
        loans: this.testLoans,
        payments: this.testPayments,
        meetings: this.testMeetings,
        notifications: this.testNotifications
      };
    } catch (error) {
      console.error('Failed to seed test data:', error);
      throw error;
    }
  }

  // Helper method to get test data
  getTestData() {
    return {
      users: this.testUsers,
      applications: this.testApplications,
      tontines: this.testTontines,
      memberships: this.testMemberships,
      contributions: this.testContributions,
      loans: this.testLoans,
      payments: this.testPayments,
      meetings: this.testMeetings,
      notifications: this.testNotifications
    };
  }
}

module.exports = new TestDataSeeder();
